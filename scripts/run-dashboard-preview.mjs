#!/usr/bin/env node
// Local isolated QA only. No production environment files, mail, billing or storage.
import { readFileSync, lstatSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const privateDir = resolve(root, '.secrets');
const file = resolve(privateDir, 'dashboard-test.env');
if (lstatSync(privateDir).isSymbolicLink() || lstatSync(file).isSymbolicLink()) throw new Error('QA environment must be a local private file');
const settings = parseEnv(readFileSync(file, 'utf8'));
const database = new URL(settings.DATABASE_URL || 'invalid:');
if (database.protocol !== 'postgres:' || !['127.0.0.1', 'localhost'].includes(database.hostname) || database.pathname !== '/proofwall_ui_test') {
  throw new Error('Refusing QA against a non-isolated database');
}
const origin = new URL(settings.BASE_URL || 'invalid:');
if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname)) throw new Error('QA origin must use loopback');
const mode = process.argv[2];
const args = process.argv.slice(3);
if (args.some(arg => /^--update(?:-snapshots|Snapshot)?$|^-u$/.test(arg))) throw new Error('Baseline updates are forbidden');
const env = { ...process.env, ...settings, NEXT_TELEMETRY_DISABLED: '1' };
env.TEST_DATABASE_URL = settings.DATABASE_URL;
for (const name of Object.keys(env)) {
  if (/^(?:S3_|RESEND_|MAIL_FROM$|OPENAI_API_KEY$|YOOKASSA_)/.test(name)) delete env[name];
}
const binaries = {
  test: ['node_modules/vitest/vitest.mjs', 'run', ...args],
  typecheck: ['node_modules/typescript/bin/tsc', '--noEmit', '-p', 'tsconfig.json'],
  build: ['node_modules/next/dist/bin/next', 'build'],
  start: ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', origin.port || '33181'],
};
if (mode === 'check-env') {
  console.log('Isolated QA environment accepted; external mail/storage/billing credentials excluded');
} else {
  const selected = binaries[mode];
  if (!selected) throw new Error('Usage: run-dashboard-preview.mjs check-env|test [test files]|typecheck|build|start');
  env.NODE_ENV = mode === 'test' ? 'test' : 'production';
  if (mode === 'build') {
    for (const command of [['run', 'build', '--workspace', '@course/agent-payments'], ['run', 'build:widget']]) {
      const result = spawnSync('npm', command, { cwd: root, env: { ...env, PATH: `${resolve(root, 'node_modules/.bin')}:${env.PATH || ''}` }, stdio: 'inherit' });
      if (result.status !== 0) process.exit(result.status ?? 1);
    }
  }
  const result = spawnSync(process.execPath, [resolve(root, selected[0]), ...selected.slice(1)], { cwd: resolve(root, 'apps/web'), env, stdio: 'inherit' });
  if (result.error) throw new Error('Failed to launch isolated QA command');
  process.exitCode = result.status ?? 1;
}
