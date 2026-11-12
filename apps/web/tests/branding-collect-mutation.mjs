// Последовательные source mutations. Только targets этого автора, точное восстановление finally.
import { readFileSync, writeFileSync, lstatSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { buildBrandingCollectQaEnv } from '../../../scripts/run-branding-collect-preview.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const privateDir = resolve(root, '.secrets'), config = resolve(privateDir, 'branding-collect-test.env');
for (const [path, mode] of [[privateDir, 0o700], [config, 0o600]]) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || realpathSync(path) !== path || stat.uid !== process.getuid() || (stat.mode & 0o777) !== mode) throw new Error('Private QA config required');
}
const env = buildBrandingCollectQaEnv(parseEnv(readFileSync(config, 'utf8')), 'test');
const node = resolve(root, 'node_modules/node/bin/node');
const results = [];
const mutations = [
  ['logo-userinfo', 'apps/web/src/lib/branding.ts', "url.protocol === 'https:' && url.username === '' && url.password === ''", "url.protocol === 'https:'", 'branding.test.ts', 'branding rejects credential-bearing HTTPS logos without changing draft'],
  ['outcome-sink-removed', 'apps/web/src/app/api/projects/[slug]/branding/route.ts', "console.info('branding_patch', event)", 'void event', 'project-branding.test.ts', 'new branding logs omit payloads'],
  ['actual-owner-role', 'apps/web/src/lib/project-branding.ts', 'withAccount(accountId, async client =>', 'withService(async client =>', 'project-branding.test.ts', 'branding owner statements retain role and tenant context'],
  ['atomic-json-merge', 'apps/web/src/lib/project-branding.ts', 'branding = branding || $3::jsonb', 'branding = $3::jsonb', 'project-branding.test.ts', 'branding patch preserves unrelated keys'],
  ['origin', 'apps/web/src/app/api/projects/[slug]/branding/route.ts', "request.headers.get('origin') !== new URL(baseUrl()).origin", 'false', 'project-branding.test.ts', 'branding rejects cross origin and oversized stream'],
  ['actual-body-bound', 'apps/web/src/app/api/projects/[slug]/branding/route.ts', 'readBodyAtMost(request, 4096)', 'readBodyAtMost(request, 65536)', 'project-branding.test.ts', 'branding rejects cross origin and oversized stream'],
  ['unknown-keys', 'apps/web/src/lib/branding.ts', '!fields.includes(key)', 'false', 'branding.test.ts', 'branding patch rejects forbidden and malformed values'],
  ['sql-unicode', 'apps/web/src/lib/branding.ts', "typeof value === 'string' && !sqlSafe(value)", 'false', 'branding.test.ts', 'branding patch rejects forbidden and malformed values'],
  ['raw-accent-text', 'apps/web/src/lib/branding.ts', 'if (surface) {', 'if (surface) return fill; if (false) {', 'branding.test.ts', 'branding contrast covers accent text and accent fill'],
  ['selected-fifty', 'apps/web/src/lib/widget-config.ts', 'order by created_at desc, id desc', 'order by created_at asc, id asc', 'widget-config.test.ts', 'widget sorts the same newest fifty'],
  ['pending-unlocked', 'apps/web/src/app/dashboard/[slug]/branding/branding-editor.tsx', 'busy, errors, error, status,', 'busy: false, errors, error, status,', 'branding.test.ts', 'branding controller retains draft through pending failures and retry'],
  ['padded-name', 'apps/web/src/app/f/[slug]/submit-form.tsx', 'values.name.trim().length < 2 || values.name.trim().length > 80', 'values.name.length < 2 || values.name.length > 80', 'branding.test.ts', 'collect controller validates raw boundaries and announces only 201 success'],
  ['old-live-border', 'apps/web/src/app/dashboard/[slug]/branding/branding-editor.tsx', "fieldBorder: '#8e806b'", "fieldBorder: '#ddd3c2'", 'branding.test.ts', 'branding controller retains draft through pending failures and retry'],
  ['platform-label-toggle', 'apps/widget/src/render.ts', 'branding?.show_platform_labels !== false', 'true', 'widget:widget-branding.test.ts', 'platform labels hide names but preserve provenance'],
];
function run(test, name, log) {
  const widget = test.startsWith('widget:');
  const args = widget ? [resolve(root, 'node_modules/vitest/vitest.mjs'), 'run', 'tests/' + test.slice(7), '--testNamePattern=' + name, '--maxWorkers=1', '--minWorkers=1']
    : [resolve(root, 'scripts/run-branding-collect-preview.mjs'), 'test', 'tests/' + test, '--testNamePattern=' + name, '--maxWorkers=1', '--minWorkers=1'];
  const output = spawnSync(node, args, { cwd: widget ? resolve(root, 'apps/widget') : root, env, encoding: 'utf8', timeout: 45000, maxBuffer: 4 * 1024 * 1024 });
  writeFileSync(resolve(privateDir, log), (output.stdout ?? '') + (output.stderr ?? ''), { mode: 0o600 });
  return { code: output.status, text: (output.stdout ?? '') + (output.stderr ?? ''), error: Boolean(output.error) };
}
for (const [id, path, needle, replacement, test, name] of mutations) {
  const file = resolve(root, path), original = readFileSync(file, 'utf8');
  if (!original.includes(needle)) throw new Error('Mutation anchor absent: ' + id);
  const baseline = run(test, name, 'branding-repair-mutation-' + id + '-baseline.log');
  if (baseline.code !== 0 || baseline.error) throw new Error('Mutation baseline failed: ' + id);
  let changed = original.replaceAll(needle, replacement);
  if (id === 'actual-owner-role') changed = changed.replace("import { withAccount }", "import { withAccount, withService }");
  let observed;
  try { writeFileSync(file, changed); observed = run(test, name, 'branding-repair-mutation-' + id + '.log'); }
  finally { writeFileSync(file, original); }
  const killed = observed.code === 1 && !observed.error && /AssertionError/.test(observed.text) && observed.text.includes(name);
  const testPath = test.startsWith('widget:') ? 'apps/widget/tests/' + test.slice(7) : 'apps/web/tests/' + test;
  results.push({ id, path, test: name, testPath, testSha256: createHash('sha256').update(readFileSync(resolve(root, testPath))).digest('hex'), sourceSha256: createHash('sha256').update(original).digest('hex'), mutantSourceSha256: createHash('sha256').update(changed).digest('hex'), baselineExit: baseline.code, mutantExit: observed.code, killed, restored: readFileSync(file, 'utf8') === original });
  console.log(JSON.stringify({ id, baselineExit: baseline.code, mutantExit: observed.code, killed }));
}
writeFileSync(resolve(privateDir, 'branding-repair-source-mutations.json'), JSON.stringify({ results, killed: results.filter(row => row.killed).length, total: results.length }, null, 2));
if (results.some(row => !row.killed || !row.restored)) process.exitCode = 1;
