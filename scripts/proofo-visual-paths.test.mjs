import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, writeFile, symlink, unlink, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { BASELINE, ROOT, readNoFollow, verifyIntegrity, writeNew, capture, launch, serve } from './capture-proofo-reference.mjs';

async function temporary(run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'proofo-path-probe-'));
  try { await run(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

function runVerifier(root, ...args) {
  return spawnSync(process.execPath, [path.join(root, 'scripts/check-proofo-visual.mjs'), '--self-check', ...args], { cwd: root, encoding: 'utf8' });
}

test('same-byte baseline font symlink is refused by the real CLI with exit 2', () => temporary(async dir => {
  const root = path.join(dir, 'repo');
  await mkdir(path.join(root, 'scripts'), { recursive: true });
  for (const name of ['capture-proofo-reference.mjs', 'check-proofo-visual.mjs']) await cp(path.join(ROOT, 'scripts', name), path.join(root, 'scripts', name));
  const baseline = path.join(root, path.relative(ROOT, BASELINE));
  await cp(BASELINE, baseline, { recursive: true });
  const font = path.join(baseline, 'resources/assets/body.woff2');
  const original = await readFile(font); const sentinel = path.join(dir, 'same-byte-font');
  await writeFile(sentinel, original); await unlink(font); await symlink(sentinel, font);
  assert.deepEqual(await readFile(font), original);
  const result = runVerifier(root);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /REFUSED: symlink in path/);
  assert.deepEqual(await readFile(sentinel), original);
}));

test('existing report.json symlink is refused with exit 2 and sentinel unchanged', () => temporary(async dir => {
  const output = path.join(dir, 'output'); await mkdir(output);
  const sentinel = path.join(dir, 'report-sentinel'); const bytes = Buffer.from('{"passed":true}\n');
  await writeFile(sentinel, bytes); await symlink(sentinel, path.join(output, 'report.json'));
  assert.deepEqual(await readFile(path.join(output, 'report.json')), bytes);
  const result = runVerifier(ROOT, '--output', output);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /output directory must be fresh/);
  assert.deepEqual(await readFile(sentinel), bytes);
}));

test('legacy PNG symlink in an existing output directory is refused without touching target', () => temporary(async dir => {
  const output = path.join(dir, 'output'); await mkdir(output);
  const sentinel = path.join(dir, 'png-sentinel'); const bytes = Buffer.from('legacy screenshot bytes');
  await writeFile(sentinel, bytes); await symlink(sentinel, path.join(output, 'dashboard-1440x900-none.actual.png'));
  const result = runVerifier(ROOT, '--output', output);
  assert.equal(result.status, 2, result.stderr); assert.match(result.stderr, /output directory must be fresh/);
  assert.deepEqual(await readFile(sentinel), bytes);
}));

test('exclusive writer refuses existing report/PNG symlinks and regular files', () => temporary(async dir => {
  const sentinel = path.join(dir, 'sentinel'); const bytes = Buffer.from('unchanged'); await writeFile(sentinel, bytes);
  for (const name of ['report.json', 'dashboard-none.actual.png']) {
    const target = path.join(dir, name); await symlink(sentinel, target);
    await assert.rejects(writeNew(target, 'replacement'), /output file already exists/);
    assert.deepEqual(await readFile(sentinel), bytes);
  }
  await assert.rejects(writeNew(sentinel, 'replacement'), /output file already exists/);
  const fresh = path.join(dir, 'fresh.json'); await writeNew(fresh, bytes); assert.deepEqual(await readFile(fresh), bytes);
}));

test('source and output ancestor symlinks are refused, even with identical readable bytes', () => temporary(async dir => {
  const physical = path.join(dir, 'physical'); await mkdir(physical);
  const bytes = Buffer.from('same bytes'); await writeFile(path.join(physical, 'asset.css'), bytes);
  const alias = path.join(dir, 'alias'); await symlink(physical, alias);
  await assert.rejects(readNoFollow(path.join(alias, 'asset.css')), /symlink in path/);
  await assert.rejects(writeNew(path.join(alias, 'new.png'), bytes), /symlink in path/);
  const result = runVerifier(ROOT, '--output', path.join(alias, 'new-output'));
  assert.equal(result.status, 2, result.stderr); assert.match(result.stderr, /symlink in path/);
  assert.deepEqual(await readFile(path.join(physical, 'asset.css')), bytes);
}));

test('baseline directory alias is refused and the original baseline remains intact', () => temporary(async dir => {
  const alias = path.join(dir, 'baseline-alias'); await symlink(BASELINE, alias);
  await assert.rejects(verifyIntegrity(alias), /symlink in path/);
  const manifest = await verifyIntegrity(); assert.equal(manifest.cases.length, 9);
}));

test('capture accepts both excluded demo elements absent without waiting for them', { timeout: 15000 }, () => temporary(async dir => {
  const resources = path.join(dir, 'resources'); await cp(path.join(BASELINE, 'resources'), resources, { recursive: true });
  // Real CSS/local fonts; production-like wrapper has no banner or floating navigator.
  await writeFile(path.join(resources, 'absence.html'), '<!doctype html><html lang="ru"><head><meta charset="utf-8"><link rel="icon" href="favicon.svg"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="cabinet.css"></head><body><main class="cab-shell"><article class="cab-paper"><h1>Проверка без демобаннера</h1><p>Оба исключённых элемента отсутствуют.</p></article></main></body></html>');
  const server = await serve(resources); let browser;
  try {
    browser = await launch();
    const actual = await capture(browser, `${server.url}/absence.html`, { width: 1440, height: 900 }, path.join(dir, 'absence.png'));
    assert.match(actual.dom.text, /Оба исключённых элемента отсутствуют/);
    assert.ok(actual.pixelSize.width > 0 && actual.pixelSize.height > 0);
  } finally { await browser?.close(); await server.close(); }
}));
