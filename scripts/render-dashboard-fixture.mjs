#!/usr/bin/env node
// Только локальный артефакт; production route или overrides отсутствуют.
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = await mkdtemp(resolve(tmpdir(), 'proofwall-dashboard-fixture-'));
const result = spawnSync(process.execPath, [resolve(root, 'node_modules/vitest/vitest.mjs'), 'run', 'tests/dashboard-visual-fixture.test.ts'], {
  cwd: resolve(root, 'apps/web'), env: { ...process.env, DASHBOARD_FIXTURE_OUTPUT: output }, stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);
if (process.argv.includes('--render-only')) { console.log(output); } else {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2' };
  const allowed = new Set(['/dashboard.html', '/globals.css', '/dashboard.css', '/proofo/body.woff2', '/proofo/display.woff2']);
  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!allowed.has(pathname)) { res.writeHead(404).end(); return; }
    try { const data = await readFile(resolve(output, '.' + pathname)); res.writeHead(200, { 'content-type': types[extname(pathname)] }).end(data); }
    catch { res.writeHead(500).end(); }
  });
  server.listen(33182, '127.0.0.1', () => console.log('Dashboard fixture: http://127.0.0.1:33182/dashboard.html'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
