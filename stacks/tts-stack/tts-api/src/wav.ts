// src/wav.ts
export function pcmToWav(pcm: Buffer, fmt: { rate: number; width: number; channels: number }): Buffer {
  const { rate, width, channels } = fmt;
  const bitsPerSample = width * 8;
  const blockAlign = channels * width;
  const byteRate = rate * blockAlign;

  // Add a small amount of trailing silence (e.g., 200ms) to prevent abrupt cut-offs
  const silenceMs = 200;
  const silenceBytes = Math.floor((rate * blockAlign * silenceMs) / 1000);
  const silence = Buffer.alloc(silenceBytes, 0);
  const fullPcm = Buffer.concat([pcm, silence]);

  // RIFF header is 44 bytes for PCM
  const header = Buffer.alloc(44);

  // ChunkID "RIFF"
  header.write("RIFF", 0, 4, "ascii");
  // ChunkSize = 36 + Subchunk2Size
  header.writeUInt32LE(36 + fullPcm.length, 4);
  // Format "WAVE"
  header.write("WAVE", 8, 4, "ascii");

  // Subchunk1ID "fmt "
  header.write("fmt ", 12, 4, "ascii");
  // Subchunk1Size 16 for PCM
  header.writeUInt32LE(16, 16);
  // AudioFormat 1 = PCM
  header.writeUInt16LE(1, 20);
  // NumChannels
  header.writeUInt16LE(channels, 22);
  // SampleRate
  header.writeUInt32LE(rate, 24);
  // ByteRate
  header.writeUInt32LE(byteRate, 28);
  // BlockAlign
  header.writeUInt16LE(blockAlign, 32);
  // BitsPerSample
  header.writeUInt16LE(bitsPerSample, 34);

  // Subchunk2ID "data"
  header.write("data", 36, 4, "ascii");
  // Subchunk2Size
  header.writeUInt32LE(fullPcm.length, 40);

  return Buffer.concat([header, fullPcm]);
}
