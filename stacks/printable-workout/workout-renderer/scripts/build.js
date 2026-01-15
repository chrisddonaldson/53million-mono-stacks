import esbuild from 'esbuild';
import { solidPlugin } from 'esbuild-plugin-solid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../src');
const entry = path.join(srcDir, 'index.tsx');
const outFile = path.resolve(__dirname, '../dist/workout-renderer.js');

if (!fs.existsSync(entry)) {
  console.error('Entry file missing:', entry);
  process.exit(1);
}

esbuild
  .build({
    entryPoints: [entry],
    outfile: outFile,
    bundle: true,
    format: 'esm',
    target: 'es2019',
    sourcemap: true,
    plugins: [solidPlugin({ dev: false })],
  })
  .then(() => {
    console.log('Built', outFile);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
