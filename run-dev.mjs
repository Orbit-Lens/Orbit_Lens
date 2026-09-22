import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\x1b[36m%s\x1b[0m', '🛰️ Starting OrbitLens Development Environment...');
console.log('\x1b[36m%s\x1b[0m', '─────────────────────────────────────────────────');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Spawn Web Backend (port 5000)
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend', 'web-backend'),
  stdio: 'pipe',
  shell: true,
});

backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log('\x1b[33m[Backend 5000]\x1b[0m', line);
    }
  }
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.error('\x1b[31m[Backend Err]\x1b[0m', line);
    }
  }
});

// 2. Spawn Next.js Frontend (port 3000)
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'pipe',
  shell: true,
});

frontend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.log('\x1b[32m[Frontend 3000]\x1b[0m', line);
    }
  }
});

frontend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      console.error('\x1b[31m[Frontend Err]\x1b[0m', line);
    }
  }
});

function cleanup() {
  console.log('\n\x1b[36m%s\x1b[0m', '🛑 Shutting down OrbitLens services...');
  try {
    if (isWindows) {
      if (backend.pid) spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
      if (frontend.pid) spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
    } else {
      backend.kill('SIGINT');
      frontend.kill('SIGINT');
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
