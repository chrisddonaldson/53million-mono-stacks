import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  await exec('npm', ['run', 'build'], { cwd: path.resolve(__dirname, '..') });
  const server = spawn('node', ['scripts/serve.js'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '4173' },
  });

  await waitForLine(server, 'static-server listening');

  const cypressCode = await exec('npx', ['cypress', 'run', '--config-file', 'cypress.config.js'], {
    cwd: path.resolve(__dirname, '..'),
    inheritStdio: true,
  });

  server.kill('SIGTERM');
  process.exit(cypressCode);
}

function waitForLine(child, match) {
  return new Promise((resolve, reject) => {
    const onData = (data) => {
      if (data.toString().includes(match)) {
        child.stdout.off('data', onData);
        resolve(true);
      }
    };
    child.stdout.on('data', onData);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Server exited with code ${code}`));
    });
  });
}

function exec(cmd, args, { cwd, inheritStdio = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: inheritStdio ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    let output = '';
    if (!inheritStdio) {
      child.stdout.on('data', (d) => (output += d.toString()));
      child.stderr.on('data', (d) => (output += d.toString()));
    }
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(output || `Command ${cmd} exited ${code}`));
      } else {
        resolve(code || 0);
      }
    });
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
