#!/usr/bin/env node
// Изолированный QA: только явно переданные синтетические настройки.
import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const privateDir = resolve(root, '.secrets');
const modes = new Set(['check-env', 'test', 'typecheck', 'build', 'start', 'e2e']);
const allowed = new Set(['DATABASE_URL', 'BASE_URL', 'SESSION_SECRET', 'BILLING_WEBHOOK_TOKEN',
  'N3_ENTITLEMENT_SIGNING_SECRET', 'N3_ENTITLEMENT_TOKEN_SECRET', 'S3_ENDPOINT', 'S3_REGION',
  'S3_FORCE_PATH_STYLE', 'S3_PHOTO_BUCKET', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY',
  'NEXT_TELEMETRY_DISABLED']);
const refuse = () => { throw new Error('Unsafe branding QA configuration; values withheld'); };

function localEndpoint(raw, protocol) {
  let url;
  try { url = new URL(raw); } catch { refuse(); }
  if (url.protocol !== protocol || !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      !url.port || [33181, 33182, 33183, 33184].includes(Number(url.port)) ||
      url.search || url.hash) refuse();
  return url;
}

export function assertBrandingCollectQaConfig(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings) ||
      Object.keys(settings).some(key => !allowed.has(key)) ||
      Object.values(settings).some(value => typeof value !== 'string')) refuse();
  const db = localEndpoint(settings.DATABASE_URL, 'postgres:');
  const app = localEndpoint(settings.BASE_URL, 'http:');
  const s3 = localEndpoint(settings.S3_ENDPOINT, 'http:');
  if (db.pathname !== '/proofwall_ui_test' || !db.username || !db.password ||
      [app, s3].some(url => url.username || url.password || url.pathname !== '/') ||
      new Set([db.port, app.port, s3.port]).size !== 3 ||
      settings.S3_ACCESS_KEY !== 'proofwall-ui-test-access' ||
      settings.S3_SECRET_KEY !== 'proofwall-ui-test-secret-only' ||
      settings.S3_PHOTO_BUCKET !== 'proofwall-ui-test-photos' ||
      (settings.S3_BUCKET !== undefined && settings.S3_BUCKET !== 'proofwall-ui-test-photos') ||
      settings.S3_REGION !== 'us-east-1' || settings.S3_FORCE_PATH_STYLE !== 'true' ||
      typeof settings.SESSION_SECRET !== 'string' || settings.SESSION_SECRET.length < 32) refuse();
  return { ...settings };
}

export function buildBrandingCollectQaEnv(settings, mode) {
  const cfg = assertBrandingCollectQaConfig(settings);
  if (!modes.has(mode)) refuse();
  const env = {
    PATH: `${resolve(root, 'node_modules/.bin')}:/usr/bin:/bin`, TMPDIR: '/tmp',
    LANG: 'C.UTF-8', TZ: 'UTC', DATABASE_URL: cfg.DATABASE_URL, TEST_DATABASE_URL: cfg.DATABASE_URL,
    SESSION_SECRET: cfg.SESSION_SECRET, BASE_URL: cfg.BASE_URL, BRANDING_QA_ORIGIN: cfg.BASE_URL,
    NEXT_TELEMETRY_DISABLED: '1', VIDEO_INTAKE_ENABLED: 'false',
    NODE_ENV: mode === 'test' ? 'test' : 'production',
  };
  for (const key of ['BILLING_WEBHOOK_TOKEN', 'N3_ENTITLEMENT_SIGNING_SECRET', 'N3_ENTITLEMENT_TOKEN_SECRET']) {
    if (cfg[key]) env[key] = cfg[key];
  }
  if (mode !== 'test') {
    env.NEXT_PUBLIC_BASE_URL = cfg.BASE_URL;
    for (const key of ['S3_ENDPOINT', 'S3_REGION', 'S3_FORCE_PATH_STYLE', 'S3_PHOTO_BUCKET', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY']) {
      if (cfg[key]) env[key] = cfg[key];
    }
  }
  return env;
}

function privateSettings() {
  const file = resolve(privateDir, 'branding-collect-test.env');
  for (const [path, directory, permissions] of [[privateDir, true, 0o700], [file, false, 0o600]]) {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || realpathSync(path) !== path || stat.uid !== process.getuid() ||
        (stat.mode & 0o777) !== permissions || (directory ? !stat.isDirectory() : !stat.isFile())) refuse();
  }
  return assertBrandingCollectQaConfig(parseEnv(readFileSync(file, 'utf8')));
}

async function freePort(url) {
  const endpoint = new URL(url);
  await new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error('QA port unavailable; no process was stopped')));
    server.listen(Number(endpoint.port), '127.0.0.1', () => server.close(resolvePort));
  });
}

async function child(args, env, cwd = resolve(root, 'apps/web')) {
  return new Promise((resolveChild, reject) => {
    const handle = spawn(process.execPath, args, { cwd, env, stdio: 'inherit' });
    const stop = signal => handle.kill(signal);
    const onTerm = () => stop('SIGTERM');
    process.once('SIGTERM', onTerm); process.once('SIGINT', onTerm);
    handle.once('error', () => reject(new Error('Isolated QA child failed to start')));
    handle.once('close', code => {
      process.removeListener('SIGTERM', onTerm); process.removeListener('SIGINT', onTerm);
      resolveChild(code ?? 1);
    });
  });
}

async function main() {
  const mode = process.argv[2];
  const args = process.argv.slice(3);
  if (!modes.has(mode) || (mode !== 'test' && args.length) || args.some(arg =>
    !/^(?:tests\/[\w.-]+\.test\.ts|--(?:maxWorkers|minWorkers)=\d+|--testNamePattern=.{1,200}|--reporter=(?:default|json|verbose))$/.test(arg))) refuse();
  const cfg = privateSettings();
  const env = buildBrandingCollectQaEnv(cfg, mode);
  if (mode === 'check-env') { console.log(JSON.stringify({ status: 'accepted', endpoints: 'isolated-loopback' })); return; }
  if (['start', 'e2e'].includes(mode)) await freePort(cfg.BASE_URL);
  if (mode === 'e2e') await freePort(cfg.S3_ENDPOINT);
  if (mode === 'test') console.log('Legacy test output below uses isolated synthetic fixtures.');
  if (mode === 'build') {
    const npm = resolve(root, 'node_modules/npm/bin/npm-cli.js');
    // npm is normally system-owned; resolve its executable without inheriting a shell.
    const npmCli = (() => { try { return realpathSync('/usr/bin/npm'); } catch { return npm; } })();
    for (const args of [['run', 'build', '--workspace', '@course/agent-payments'], ['run', 'build:widget']]) {
      const status = await child([npmCli, ...args], env, root);
      if (status) { process.exitCode = status; return; }
    }
  }
  const commands = {
    test: [resolve(root, 'node_modules/vitest/vitest.mjs'), 'run', ...args],
    typecheck: [resolve(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '-p', 'tsconfig.json'],
    build: [resolve(root, 'node_modules/next/dist/bin/next'), 'build'],
    start: [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', new URL(cfg.BASE_URL).port],
    e2e: ['--test', resolve(root, 'tools/visual/branding-collect.e2e.test.mjs')],
  };
  process.exitCode = await child(commands[mode], env);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => { console.error('Isolated branding QA refused or failed; sensitive values withheld'); process.exitCode = 1; });
}
