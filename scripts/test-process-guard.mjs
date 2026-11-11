#!/usr/bin/env node
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const script = resolve(dirname(fileURLToPath(import.meta.url)), 'process-guard.mjs');
const hash = value => createHash('sha256').update(value).digest('hex');
const ids = ['unit', 'typecheck', 'build', 'integration', 'e2e', 'visual', 'accessibility', 'independent-review'];
function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), 'proofwall-process-guard-'));
  const put = (path, value) => { mkdirSync(dirname(resolve(root, path)), { recursive: true }); writeFileSync(resolve(root, path), typeof value === 'string' ? value : JSON.stringify(value)); };
  execFileSync('git', ['init', '-q', root]);
  put('.gitignore', 'node_modules/\n.env*\n');
  put('package.json', { scripts: { release: 'echo deploy' } });
  put('node_modules/agentic-qe/package.json', { name: 'agentic-qe', version: '3.15.19' });
  put('.agents/agentic-qe/skills/test/SKILL.md', 'fixture vendor skill');
  put('.agents/agentic-qe/UPSTREAM-MANIFEST.json', { schemaVersion: 1, repository: 'fixture', commit: 'a'.repeat(40), runtime: { package: 'agentic-qe', version: '3.15.19' }, packages: [{ name: 'fixture', version: '1', root: '.agents/agentic-qe', files: { 'skills/test/SKILL.md': hash('fixture vendor skill') } }] });
  put('.agents/skills/test/SKILL.md', 'fixture vendor skill');
  const featureFiles = {};
  for (const path of ['SKILL.md', ...['03-adr.md', '03.5-ideation-swarm.md', '06-implementation-plan.md', '08-qe.md', '09-fleet-qe.md'].map(name => `modules/${name}`)]) {
    const body = path === 'SKILL.md' ? '## Proofwall: обязательный Direct Mode' : '<!-- PROOFWALL DIRECT SOURCE -->\n.agents/agentic-qe/';
    put(`.agents/skills/feature-adr/${path}`, body); featureFiles[path] = hash(body);
  }
  put('.agents/skills/.proofwall-installed.json', { schemaVersion: 1, upstreamCommit: 'a'.repeat(40), featureFiles });
  put('features/proofo-ui/plan.md', 'approved fixture plan');
  put('openspec/changes/proofo-ui/specs/ui/spec.md', 'fixture scenario');
  put('apps/web/product.js', 'fixture product');
  mkdirSync(resolve(root, 'scripts'), { recursive: true });
  cpSync(script, resolve(root, 'scripts/process-guard.mjs'));
  cpSync(resolve(dirname(script), 'verify-qe-installation.mjs'), resolve(root, 'scripts/verify-qe-installation.mjs'));
  mkdirSync(resolve(root, '.codex'), { recursive: true });
  cpSync(resolve(dirname(script), '../.codex/hooks.json'), resolve(root, '.codex/hooks.json'), { recursive: true });
  put('reports/artifact.txt', 'fixture artifact, not a real screenshot');
  const state = { schemaVersion: 1, feature: 'proofo-ui', fullQe: true, complexityTier: 'L', stage: 'ready', activeProductChange: true, requiredChecks: [...ids], receipt: { issuedAt: new Date().toISOString(), checks: {} } };
  for (const id of ids) {
    const evidence = `reports/${id}.json`;
    put(evidence, { status: 'passed', exitCode: 0, command: `fixture-${id}`, artifacts: ['reports/artifact.txt'] });
    state.receipt.checks[id] = { status: 'passed', evidence, evidenceSha256: hash(readFileSync(resolve(root, evidence))) };
  }
  const save = () => put('features/proofo-ui/implementation-state.json', state);
  admit({ root, put, state, save });
  state.stage = 'ready';
  save();
  const run = (mode, payload) => spawnSync(process.execPath, [resolve(root, 'scripts/process-guard.mjs'), mode], { cwd: root, input: payload === undefined ? undefined : JSON.stringify({ cwd: root, ...payload }), encoding: 'utf8' });
  const refresh = () => { const result = run('digest'); assert.equal(result.status, 0, result.stderr); state.receipt.inputDigest = result.stdout.trim(); save(); };
  refresh();
  return { root, put, state, save, run, refresh, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
function check(name, action) { test(name, () => { const f = fixture(); try { action(f); } finally { f.cleanup(); } }); }
function red(result, message) { assert.equal(result.status, 2, result.stdout + result.stderr); if (message) assert.match(result.stderr, message); }
check('legitimate fixture receipt succeeds (not product evidence)', f => assert.equal(f.run('check-delivery').status, 0));
check('configuration and SessionStart payload succeed', f => { assert.equal(f.run('check-config').status, 0); const r = f.run('hook', { hook_event_name: 'SessionStart' }); assert.equal(r.status, 0, r.stderr); assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, /--full-qe/); });
check('missing receipt is an executable failure', f => { f.state.receipt = null; f.save(); red(f.run('check-delivery'), /receipt/); });
check('planned product delivery is blocked', f => { f.state.stage = 'planned'; f.save(); red(f.run('check-delivery'), /stage=planned/); });
check('tracked or untracked source mutation invalidates digest', f => { f.put('apps/web/new-file.js', 'untracked mutation'); red(f.run('check-delivery'), /stale digest/); });
check('plan mutation invalidates receipt/admission', f => { f.put('features/proofo-ui/plan.md', 'changed plan'); red(f.run('check-delivery'), /stale digest|устарел/); });
check('visual failure cannot be labeled as passed by outer receipt', f => { const check = f.state.receipt.checks.visual; f.put(check.evidence, { status: 'failed', exitCode: 1, command: 'visual comparison' }); check.evidenceSha256 = hash(readFileSync(resolve(f.root, check.evidence))); f.save(); f.refresh(); red(f.run('check-delivery'), /visual/); });
check('empty evidence fails closed', f => { f.put('reports/visual.json', ''); red(f.run('check-delivery')); });
check('symlink evidence fails closed', f => { rmSync(resolve(f.root, 'reports/visual.json')); symlinkSync('unit.json', resolve(f.root, 'reports/visual.json')); red(f.run('check-delivery'), /Symlink/); });
check('vendor mutation fails verification', f => { f.put('.agents/agentic-qe/skills/test/SKILL.md', 'corruption'); red(f.run('check-config'), /hash mismatch/); });
check('wrong local runtime version fails verification', f => { f.put('node_modules/agentic-qe/package.json', { name: 'agentic-qe', version: '0.0.0' }); red(f.run('check-config'), /версия/); });
check('missing obligatory check fails closed', f => { f.state.requiredChecks = ['unit']; f.save(); red(f.run('check-delivery')); });
check('baseline replacement patch is explicitly denied', f => { const r = f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: '*** Update File: features/proofo-ui/reference/home.png\nreplacement' } }); red(r, /baseline/); assert.equal(JSON.parse(r.stdout).hookSpecificOutput.permissionDecision, 'deny'); });
check('snapshot update command is explicitly denied', f => red(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npx playwright test --update-snapshots' } }), /baseline/));
check('delivery and npm script indirection need receipt', f => { f.state.receipt = null; f.save(); red(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npm run release' } }), /receipt/); });
check('process docs editing with quoted baseline/deploy examples allowed while planned', f => { f.state.stage = 'planned'; f.state.receipt = null; f.save(); assert.equal(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: '*** Update File: docs/development/process-hooks.md\n+node overwrite reference/test.png\n+git push deploy release' } }).status, 0); });
check('ordinary planned Stop is allowed', f => { f.state.stage = 'planned'; f.state.receipt = null; f.state.activeProductChange = false; f.save(); const result = JSON.parse(f.run('hook', { hook_event_name: 'Stop' }).stdout); assert.equal(result.decision, undefined); assert.equal(result.continue, undefined); });
check('active Stop requests one continuation then terminates with blocker', f => { f.state.stage = 'implementing'; f.state.receipt = null; f.save(); const once = JSON.parse(f.run('hook', { hook_event_name: 'Stop', stop_hook_active: false }).stdout); assert.equal(once.decision, 'block'); const twice = JSON.parse(f.run('hook', { hook_event_name: 'Stop', stop_hook_active: true }).stdout); assert.equal(twice.continue, false); assert.match(twice.stopReason, /QE/); });
check('empty payload produces actual nonzero exit', f => red(spawnSync(process.execPath, [script, 'hook'], { cwd: f.root, input: '', encoding: 'utf8' })));
check('audit contains only allowlisted metadata, never synthetic tool input', f => { f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'echo synthetic-private-input' } }); const log = readFileSync(resolve(f.root, '.agentic-qe/proofwall-hook-events.jsonl'), 'utf8'); assert.doesNotMatch(log, /synthetic-private-input/); const entry = JSON.parse(log.trim()); assert.deepEqual(Object.keys(entry).sort(), ['decision', 'event', 'timestamp']); assert.equal(f.run('check-delivery').status, 0); });
check('ignored artifacts cannot escape digest binding', f => { f.put('.gitignore', 'node_modules/\nreports/artifact.txt\n'); f.refresh(); red(f.run('check-delivery'), /Artifact/); });
check('traversal evidence fails closed', f => { f.state.receipt.checks.unit.evidence = '../outside.json'; f.save(); red(f.run('check-delivery')); });
check('empty ordinary source file is valid digest input', f => { f.put('apps/web/.gitkeep', ''); f.refresh(); assert.equal(f.run('check-delivery').status, 0); });
check('process-only source push is allowed while planned/inactive', f => { rmSync(resolve(f.root, 'apps'), { recursive: true }); f.state.activeProductChange = false; f.state.stage = 'planned'; f.state.receipt = null; f.save(); assert.equal(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git push origin main' } }).status, 0); });
check('untracked product diff blocks source publication even while inactive', f => { f.state.activeProductChange = false; f.state.stage = 'planned'; f.state.receipt = null; f.save(); red(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git push origin main' } }), /planned/); });
check('malformed JSON errors never echo synthetic input', f => { const result = spawnSync(process.execPath, [script, 'hook'], { cwd: f.root, input: 'synthetic-private-malformed-payload', encoding: 'utf8' }); red(result); assert.doesNotMatch(result.stdout + result.stderr, /synthetic-private/); });
check('credential-named paths excluded from digest without reading their content', f => { const before = f.run('digest').stdout; f.put('credentials.json', 'synthetic-nonsecret-fixture'); assert.equal(f.run('digest').stdout, before); });
function admit(f) {
  const refs = ['features/proofo-ui/plan.md', 'openspec/changes/proofo-ui/specs/ui/spec.md'].map(path => ({ path, sha256: hash(readFileSync(resolve(f.root, path))) }));
  const designDigest = hash(JSON.stringify(refs.map(ref => [ref.path, ref.sha256]).sort((a, b) => a[0].localeCompare(b[0]))));
  f.state.implementationAdmission = { plan: refs[0], specifications: refs.slice(1), checkpoints: {} };
  for (const id of ['K1', 'K2']) {
    const evidence = `reports/${id}.json`;
    f.put(evidence, { status: 'passed', exitCode: 0, command: `fixture-${id}`, designDigest });
    f.state.implementationAdmission.checkpoints[id] = { status: 'passed', evidence, evidenceSha256: hash(readFileSync(resolve(f.root, evidence))) };
  }
  f.state.stage = 'implementing'; f.save();
}
const productPatch = { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { command: '*** Update File: apps/web/product.js\n+product implementation' } };
check('existing VPS stand launcher cannot publish without current receipt', f => { f.state.stage = 'planned'; f.state.receipt = null; f.save(); red(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'exec_command', tool_input: { cmd: 'bash scripts/stand.sh up -d --build web' } }), /planned/); });
check('read-only stand status remains allowed while planned', f => { f.state.stage = 'planned'; f.state.receipt = null; f.save(); assert.equal(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'exec_command', tool_input: { cmd: 'bash scripts/stand.sh ps' } }).status, 0); });
for (const cmd of ["sed -n '1,20p' apps/web/package.json", "python3 -c 'print(open(\"apps/web/package.json\").read())'"]) {
  check(`narrow read-only form allowed: ${cmd}`, f => { f.state.stage = 'planned'; f.state.receipt = null; f.save(); assert.equal(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'exec_command', tool_input: { cmd } }).status, 0); });
}
check('planned product patch fails before execution', f => { f.state.stage = 'planned'; f.save(); red(f.run('hook', productPatch), /stage=planned/); });
check('implementing without K1/K2 evidence fails before execution', f => { f.state.stage = 'implementing'; f.state.implementationAdmission = null; f.save(); red(f.run('hook', productPatch), /допуска/); });
check('implementing with current design-bound K1/K2 admits product patch fixture', f => { admit(f); assert.equal(f.run('hook', productPatch).status, 0); });
check('plan change invalidates implementation admission', f => { admit(f); f.put('features/proofo-ui/plan.md', 'new unapproved plan'); red(f.run('hook', productPatch), /устарел/); });
check('failed K2 cannot admit product patch', f => { admit(f); f.put('reports/K2.json', { status: 'failed', exitCode: 1, command: 'fixture-K2' }); red(f.run('hook', productPatch), /K2/); });
check('CI diff gate rejects missing or malformed revision inputs', f => red(f.run('check-product-diff'), /40-hex/));
for (const field of ['input', 'patch']) check(`planned product patch in tool_input.${field} is denied`, f => { f.state.stage = 'planned'; f.save(); red(f.run('hook', { ...productPatch, tool_input: { [field]: productPatch.tool_input.command } }), /stage=planned/); });
check('decoy command cannot hide a product patch in input', f => { f.state.stage = 'planned'; f.save(); red(f.run('hook', { ...productPatch, tool_input: { command: '*** Update File: docs/readme.md\n+decoy', input: productPatch.tool_input.command } }), /stage=planned/); });
check('unparseable patch destinations fail closed', f => red(f.run('hook', { ...productPatch, tool_input: { patch: 'unparseable patch' } }), /разобрать/));
for (const path of ['snapshots/home.png', 'features/proofo-ui/home.spec.ts-snapshots/home.png']) check(`snapshot destination ${path} is denied`, f => red(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: { patch: `*** Update File: ${path}\n+replacement` } }), /baseline/));
for (const command of ['cat docs/development/deploy.md', 'rg -- --update-snapshots docs', "bash -c 'cat apps/web/package.json'", `node -p 'require("fs").readFileSync("apps/web/package.json","utf8")'`]) check(`read-only research allowed: ${command}`, f => { f.state.stage = 'planned'; f.state.receipt = null; f.save(); const result = f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } }); assert.equal(result.status, 0, result.stderr); });
for (const command of ['cat apps/web/product.js && touch apps/web/new.js', 'cat $(node apps/web/write.js)', "bash -c 'cat apps/web/product.js; touch apps/web/new.js'"]) check(`read-only exception rejects mutation/substitution: ${command}`, f => { f.state.stage = 'planned'; f.save(); red(f.run('hook', { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } }), /stage=planned/); });
function changeConfig(f, edit) { const config = JSON.parse(readFileSync(resolve(f.root, '.codex/hooks.json'), 'utf8')); edit(config); f.put('.codex/hooks.json', config); }
check('fake echo handler cannot pass trust-bypass validation', f => { changeConfig(f, config => { config.hooks.PreToolUse[0].hooks[0].command = 'echo /scripts/process-guard.mjs hook'; }); red(f.run('check-config'), /Invalid hook/); });
check('restrictive matcher cannot pass trust-bypass validation', f => { changeConfig(f, config => { config.hooks.PreToolUse[0].matcher = '^NeverMatches$'; }); red(f.run('check-config'), /match all/); });
check('additional hook event cannot pass trust-bypass validation', f => { changeConfig(f, config => { config.hooks.PostToolUse = config.hooks.PreToolUse; }); red(f.run('check-config'), /three hook events/); });
check('asynchronous handler cannot pass trust-bypass validation', f => { changeConfig(f, config => { config.hooks.PreToolUse[0].hooks[0].async = true; }); red(f.run('check-config'), /Invalid hook/); });
check('missing generated feature-adr fails configuration check', f => { rmSync(resolve(f.root, '.agents/skills/feature-adr/SKILL.md')); red(f.run('check-config')); });
check('tampered generated Direct Mode routing fails SessionStart', f => { f.put('.agents/skills/feature-adr/modules/08-qe.md', 'tampered route'); red(f.run('hook', { hook_event_name: 'SessionStart' }), /modified/); });
check('tampered installed QE skill fails delivery', f => { f.put('.agents/skills/test/SKILL.md', 'tampered installed skill'); red(f.run('check-delivery'), /modified/); });
check('missing typecheck is rejected', f => { f.state.requiredChecks = ids.filter(id => id !== 'typecheck'); f.save(); red(f.run('check-delivery')); });
check('missing build is rejected', f => { f.state.requiredChecks = ids.filter(id => id !== 'build'); f.save(); red(f.run('check-delivery')); });
check('unclassified implementation is rejected', f => { f.state.complexityTier = 'unclassified'; f.save(); red(f.run('hook', productPatch), /complexity/); });
check('XL cannot omit security/performance', f => { f.state.complexityTier = 'XL'; f.save(); red(f.run('check-delivery'), /security.*performance/); });
check('XL security/performance require actual passed reports', f => { f.state.complexityTier = 'XL'; f.state.requiredChecks.push('security', 'performance'); f.save(); red(f.run('check-delivery'), /security/); });
check('XL fixture with security/performance evidence succeeds', f => { f.state.complexityTier = 'XL'; for (const id of ['security', 'performance']) { f.state.requiredChecks.push(id); const evidence = `reports/${id}.json`; f.put(evidence, { status: 'passed', exitCode: 0, command: `fixture-${id}` }); f.state.receipt.checks[id] = { status: 'passed', evidence, evidenceSha256: hash(readFileSync(resolve(f.root, evidence))) }; } f.save(); f.refresh(); assert.equal(f.run('check-delivery').status, 0); });
