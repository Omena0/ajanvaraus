import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const databaseName = 'ajanvaraus';
const port = 3000;
const waitTimeoutMs = 120000;

const cargoBinCandidates = [
  process.env.CARGO_HOME ? path.join(process.env.CARGO_HOME, 'bin') : null,
  process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.cargo', 'bin') : null,
  process.env.HOME ? path.join(process.env.HOME, '.cargo', 'bin') : null,
].filter(Boolean);

const cargoBinDirs = cargoBinCandidates.filter((dir) => existsSync(dir));
const pathEntries = [...cargoBinDirs, process.env.PATH || process.env.Path || ''].filter(Boolean);
const env = {
  ...process.env,
  PATH: pathEntries.join(path.delimiter),
  Path: pathEntries.join(path.delimiter),
};

let spacetimeStartProcess;
let spacetimeDevProcess;
let shuttingDown = false;

function runRustupTargetAdd() {
  const result = spawnSync('rustup', ['target', 'add', 'wasm32-unknown-unknown'], {
    env,
    stdio: 'ignore',
    windowsHide: true,
  });

  if (result.error && result.error.code !== 'ENOENT') {
    console.warn('Warning: unable to add wasm32-unknown-unknown target:', result.error.message);
  }
}

function startProcess(command, args, options = {}) {
  return spawn(command, args, {
    env,
    stdio: 'inherit',
    windowsHide: false,
    ...options,
  });
}

function waitForPort(targetPort, timeoutMs) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attemptConnection = () => {
      const socket = net.createConnection({ host: '127.0.0.1', port: targetPort });

      socket.once('connect', () => {
        socket.end();
        resolve();
      });

      socket.once('error', () => {
        socket.destroy();

        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for port ${targetPort}.`));
          return;
        }

        setTimeout(attemptConnection, 500);
      });
    };

    attemptConnection();
  });
}

function cleanup() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (spacetimeDevProcess && !spacetimeDevProcess.killed) {
    spacetimeDevProcess.kill();
  }

  if (spacetimeStartProcess && !spacetimeStartProcess.killed) {
    spacetimeStartProcess.kill();
  }
}

async function main() {
  runRustupTargetAdd();

  spacetimeStartProcess = startProcess('spacetime', ['start', '--non-interactive']);

  const startExitPromise = new Promise((resolve, reject) => {
    spacetimeStartProcess.once('error', reject);
    spacetimeStartProcess.once('exit', (code, signal) => {
      if (shuttingDown) {
        resolve({ code, signal });
        return;
      }

      reject(new Error(`spacetime start exited before the dev server was ready (code: ${code}, signal: ${signal}).`));
    });
  });

  await Promise.race([waitForPort(port, waitTimeoutMs), startExitPromise]);

  spacetimeDevProcess = startProcess('spacetime', ['dev', '--yes', databaseName]);

  try {
    await new Promise((resolve, reject) => {
      spacetimeDevProcess.once('error', reject);
      spacetimeDevProcess.once('exit', (code, signal) => {
        if (shuttingDown) {
          resolve();
          return;
        }

        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`spacetime dev exited with code ${code}${signal ? ` and signal ${signal}` : ''}.`));
      });
    });
  } finally {
    cleanup();
  }
}

process.once('SIGINT', () => {
  cleanup();
});

process.once('SIGTERM', () => {
  cleanup();
});

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  cleanup();
  process.exitCode = 1;
});