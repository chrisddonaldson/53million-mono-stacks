// src/wyoming.ts
import net from "node:net";

export type WyomingEvent = {
  type: string;
  data?: Record<string, unknown>;
  data_length?: number;
  payload_length?: number;
};

export type AudioFormat = { rate: number; width: number; channels: number };

export type TtsResult = {
  format: AudioFormat;
  pcm: Buffer;
};

function writeEvent(sock: net.Socket, type: string, data?: Record<string, unknown>, payload?: Buffer) {
  const payload_length = payload?.length ?? 0;

  // We only use inline "data" (no separate data bytes) in this MVP.
  const header: WyomingEvent = {
    type,
    data: data ?? {},
    data_length: 0,
    payload_length
  };

  sock.write(JSON.stringify(header) + "\n");
  if (payload_length > 0 && payload) sock.write(payload);
}

class WyomingParser {
  private buf = Buffer.alloc(0);

  push(chunk: Buffer) {
    this.buf = Buffer.concat([this.buf, chunk]);
  }

  // Returns one fully-parsed event if available, else null
  next(): { header: WyomingEvent; payload: Buffer } | null {
    const nl = this.buf.indexOf(0x0a); // \n
    if (nl === -1) return null;

    const headerLine = this.buf.subarray(0, nl).toString("utf8");
    let header: WyomingEvent;
    try {
      header = JSON.parse(headerLine) as WyomingEvent;
    } catch {
      throw new Error(`Invalid Wyoming header JSON: ${headerLine}`);
    }

    const dataLen = header.data_length ?? 0;
    const payloadLen = header.payload_length ?? 0;

    const totalNeeded = nl + 1 + dataLen + payloadLen;
    if (this.buf.length < totalNeeded) return null;

    // Skip additional data bytes (unused here)
    const payloadStart = nl + 1 + dataLen;
    const payload = this.buf.subarray(payloadStart, payloadStart + payloadLen);

    // Consume
    this.buf = this.buf.subarray(totalNeeded);

    return { header, payload };
  }
}

export async function synthesizeViaWyomingPiper(opts: {
  host: string;
  port: number;
  text: string;
  voiceName?: string;
  timeoutMs: number;
}): Promise<TtsResult> {
  const { host, port, text, voiceName, timeoutMs } = opts;

  return await new Promise<TtsResult>((resolve, reject) => {
    const sock = net.createConnection({ host, port });
    const parser = new WyomingParser();

    let timer: NodeJS.Timeout | undefined;
    const armTimeout = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        sock.destroy(new Error("Wyoming socket timeout"));
      }, timeoutMs);
    };

    let fmt: AudioFormat | null = null;
    const pcmChunks: Buffer[] = [];
    let gotAudioStop = false;

    sock.on("connect", () => {
      armTimeout();

      // Fire the actual synthesis request (non-streaming MVP)
      const data: Record<string, unknown> = { text };
      if (voiceName) data.voice = { name: voiceName };

      writeEvent(sock, "synthesize", data);
    });

    sock.on("data", (chunk: Buffer) => {
      armTimeout();
      parser.push(chunk);

      while (true) {
        const evt = parser.next();
        if (!evt) break;

        const { header, payload } = evt;
        const t = header.type;

        console.log(`[Wyoming] Event: ${t}`, header.data ? JSON.stringify(header.data) : "");

        if (t === "info") {
          // ignore, but useful for debugging
          continue;
        }

        if (t === "audio-start") {
          const data = header.data ?? {};
          const rate = Number((data as any).rate);
          const width = Number((data as any).width);
          const channels = Number((data as any).channels);

          if (Number.isFinite(rate) && Number.isFinite(width) && Number.isFinite(channels)) {
            fmt = { rate, width, channels };
          }
          continue;
        }

        if (t === "audio-chunk") {
          const data = header.data ?? {};
          const rate = Number((data as any).rate);
          const width = Number((data as any).width);
          const channels = Number((data as any).channels);

          // Update format if provided in chunk, otherwise keep existing
          if (Number.isFinite(rate) && Number.isFinite(width) && Number.isFinite(channels)) {
            fmt = { rate, width, channels };
          }

          if (!fmt) {
            console.warn("[Wyoming] No audio metadata received yet, using standard Piper defaults (22050, 16-bit, mono)");
            fmt = { rate: 22050, width: 2, channels: 1 };
          }

          pcmChunks.push(payload);
          continue;
        }

        if (t === "audio-stop") {
          gotAudioStop = true;
          if (timer) {
            clearTimeout(timer);
            timer = undefined;
          }
          sock.destroy();
          resolve({
            format: fmt!,
            pcm: Buffer.concat(pcmChunks)
          });
          return;
        }

        // Other event types can exist; ignore for MVP
      }
    });

    sock.on("error", (err: Error) => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      reject(err);
    });

    sock.on("close", () => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }

      if (!gotAudioStop) {
        reject(new Error("Socket closed before audio-stop received"));
      }
    });
  });
}
