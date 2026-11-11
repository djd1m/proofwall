import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const repo = '/tmp/proofwall-ui-dashboard';
const tools = '/tmp/proofwall-dashboard-coverage-tools';
const output = `${repo}/features/proofo-ui/evidence/dashboard-final/coverage`;
const sources = ['apps/web/src/lib/dashboard-summary.ts', 'apps/web/src/app/dashboard/page.tsx', 'apps/web/src/app/dashboard/dashboard-overview.tsx', 'apps/web/src/app/dashboard/error.tsx'];
const tests = ['apps/web/tests/dashboard-overview.test.ts', 'apps/web/tests/dashboard-overview-db.test.ts', 'apps/web/tests/dashboard-visual-fixture.test.ts'];
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const hashes = () => Object.fromEntries([...sources, ...tests].map(file => [file, hash(`${repo}/${file}`)]));
if (process.version !== 'v22.23.4') throw new Error('Use the project Node.js 22.23.4');
const safe = parseEnv(readFileSync(`${repo}/.secrets/dashboard-test.env`, 'utf8'));
safe.TEST_DATABASE_URL ??= safe.DATABASE_URL;
for (const key of ['DATABASE_URL', 'TEST_DATABASE_URL']) {
  if (!safe[key]) throw new Error(`Missing isolated ${key}`);
  const target = new URL(safe[key]);
  if (!['postgres:', 'postgresql:'].includes(target.protocol) || !['127.0.0.1', 'localhost'].includes(target.hostname) || target.pathname !== '/proofwall_ui_test') throw new Error(`Unsafe ${key}`);
}
const env = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'LANG'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
Object.assign(env, { NODE_ENV: 'test', CI: '1', NO_COLOR: '1', DATABASE_URL: safe.DATABASE_URL, TEST_DATABASE_URL: safe.TEST_DATABASE_URL });
const secrets = [...new Set([safe.DATABASE_URL, safe.TEST_DATABASE_URL, ...[safe.DATABASE_URL, safe.TEST_DATABASE_URL].map(value => decodeURIComponent(new URL(value).password))].filter(Boolean))].sort((a,b) => b.length - a.length);
const redact = text => secrets.reduce((text, value) => text.replaceAll(value, '[REDACTED]'), text);
const binary = `${repo}/node_modules/node/bin/node`;
const cli = `${repo}/apps/web/node_modules/vitest/vitest.mjs`;
const config = `${tools}/dashboard.vitest.config.mjs`;
const args = [cli, 'run', '--config', config];
mkdirSync(output, { recursive: true });
const before = hashes();
const started = new Date().toISOString();
const run = spawnSync(binary, args, { cwd: `${repo}/apps/web`, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 180000 });
const log = redact(`${run.stdout ?? ''}${run.stderr ?? ''}${run.error ? `\nRunner error: ${run.error.message}\n` : ''}`);
writeFileSync(`${output}/vitest-run.log`, log);
const after = hashes();
const versions = Object.fromEntries([
  ['vitest', `${repo}/apps/web/node_modules/vitest/package.json`],
  ['provider', `${tools}/node_modules/@vitest/coverage-v8/package.json`],
].map(([key, file]) => [key, JSON.parse(readFileSync(file, 'utf8')).version]));
const metadata = {
  started, finished: new Date().toISOString(), scope: sources, tests,
  command: [binary, ...args], cwd: `${repo}/apps/web`,
  node: process.version, v8: process.versions.v8, versions,
  provider: 'actual @vitest/coverage-v8', providerDirectory: `${tools}/node_modules/@vitest/coverage-v8`,
  sharedVitestDirectory: `${repo}/apps/web/node_modules/vitest`,
  safeEnvironment: 'Only DATABASE_URL and TEST_DATABASE_URL loaded programmatically; both validated as loopback /proofwall_ui_test. Values redacted.',
  fixtureOutput: 'unset; fixture is executed but does not generate or modify any visual baseline',
  thresholds: { newCode: 80, critical: 90, metrics: ['lines','branches','functions','statements'], criticalFiles: sources.filter(file => !file.endsWith('dashboard-overview.tsx')) },
  exitCode: run.status, signal: run.signal, sourceAndTestHashesBefore: before, sourceAndTestHashesAfter: after,
  sourceAndTestsStable: JSON.stringify(before) === JSON.stringify(after),
  configSha256: hash(config),
};
writeFileSync(`${output}/run-metadata.json`, JSON.stringify(metadata, null, 2) + '\n');
for (const file of ['dashboard.vitest.config.mjs', 'run-dashboard-coverage.mjs']) copyFileSync(`${tools}/${file}`, `${output}/${file}`);
process.stdout.write(log);
process.stdout.write(`\nSaved isolated coverage evidence. Exit ${run.status}; source/test hashes stable: ${metadata.sourceAndTestsStable}\n`);
process.exitCode = run.status ?? 1;
