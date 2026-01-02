// src/server.ts
import Koa, { Context, Next } from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import serve from "koa-static";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";

import { synthesizeViaWyomingPiper } from "./wyoming.js";
import { pcmToWav } from "./wav.js";

const PIPER_HOST = process.env.PIPER_HOST ?? "wyoming-piper";
const PIPER_PORT = Number(process.env.PIPER_PORT ?? "10200");
const DEFAULT_VOICE = process.env.DEFAULT_VOICE ?? "en_US-lessac-medium";
const BIND_HOST = process.env.BIND_HOST ?? "0.0.0.0";
const BIND_PORT = Number(process.env.BIND_PORT ?? "3000");
const MAX_TEXT_CHARS = Number(process.env.MAX_TEXT_CHARS ?? "2000");
const SOCKET_TIMEOUT_MS = Number(process.env.SOCKET_TIMEOUT_MS ?? "30000");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkTcp(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port });
    const t = setTimeout(() => {
      sock.destroy();
      resolve(false);
    }, timeoutMs);

    sock.on("connect", () => {
      clearTimeout(t);
      sock.end();
      resolve(true);
    });
    sock.on("error", () => {
      clearTimeout(t);
      resolve(false);
    });
  });
}

const app = new Koa();
app.use(cors()); // OK inside VPN; remove if you want same-origin only
app.use(bodyParser({ jsonLimit: "1mb" }));

// Static web client
app.use(serve(path.join(__dirname, "..", "public")));

app.use(async (ctx: Context, next: Next) => {
  if (ctx.path === "/health" && ctx.method === "GET") {
    const ok = await checkTcp(PIPER_HOST, PIPER_PORT, 1000);
    ctx.type = "application/json";
    ctx.body = { ok: true, piper: ok ? "reachable" : "unreachable" };
    return;
  }

  if (ctx.path === "/tts" && ctx.method === "POST") {
    const body = (ctx.request as any).body as { text?: string; voice?: string };
    const text = String(body?.text ?? "").trim();
    const voice = String(body?.voice ?? "").trim() || DEFAULT_VOICE;

    if (!text) {
      ctx.status = 400;
      ctx.body = { error: "Missing 'text'" };
      return;
    }
    if (text.length > MAX_TEXT_CHARS) {
      ctx.status = 413;
      ctx.body = { error: `Text too long (max ${MAX_TEXT_CHARS} chars)` };
      return;
    }

    try {
      const res = await synthesizeViaWyomingPiper({
        host: PIPER_HOST,
        port: PIPER_PORT,
        text,
        voiceName: voice,
        timeoutMs: SOCKET_TIMEOUT_MS
      });

      const wav = pcmToWav(res.pcm, res.format);

      ctx.status = 200;
      ctx.set("Content-Type", "audio/wav");
      ctx.set("Cache-Control", "no-store");
      ctx.body = wav;
      return;
    } catch (err: any) {
      ctx.status = 502;
      ctx.type = "application/json";
      ctx.body = { error: "TTS failed", detail: err?.message ?? String(err) };
      return;
    }
  }

  return next();
});

app.listen(BIND_PORT, BIND_HOST, () => {
  console.log(`tts-api listening on http://${BIND_HOST}:${BIND_PORT}`);
  console.log(`piper: ${PIPER_HOST}:${PIPER_PORT} (default voice: ${DEFAULT_VOICE})`);
});
