#!/usr/bin/env node
// Read-only baseline; результаты и мутации существуют только вне frozen directory.
import { mkdir, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { BASELINE, tooling, capture, environment, launch, serve, verifyIntegrity, assertNoSymlinks, assertFreshFile, readNoFollow, writeNew } from './capture-proofo-reference.mjs';

const mutations = {
  font: '.cab-shell .cab-paper h1{font-family:monospace!important}',
  margin: '.cab-shell .cab-paper h1{margin-left:3px!important}',
  color: '.cab-shell .cab-paper h1{color:#0077cc!important}'
};

async function diffImages(expectedPath, actualPath, prefix) {
  const { PNG } = tooling('pngjs');
  const { default: pixelmatch } = await import(pathToFileURL(tooling.resolve('pixelmatch')).href);
  const expected = PNG.sync.read(await readNoFollow(expectedPath));
  const actual = PNG.sync.read(await readNoFollow(actualPath));
  const width = Math.max(expected.width, actual.width), height = Math.max(expected.height, actual.height);
  const canvas = input => {
    const output = new PNG({ width, height });
    PNG.bitblt(input, output, 0, 0, input.width, input.height, 0, 0); return output;
  };
  const a = canvas(expected), b = canvas(actual), diff = new PNG({ width, height }), overlay = new PNG({ width, height });
  let rawDiffPixels = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2] || a.data[i + 3] !== b.data[i + 3]) rawDiffPixels++;
    for (let channel = 0; channel < 4; channel++) overlay.data[i + channel] = Math.round((a.data[i + channel] + b.data[i + channel]) / 2);
  }
  const pixelmatchPixels = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0, includeAA: true });
  await writeNew(`${prefix}.diff.png`, PNG.sync.write(diff));
  await writeNew(`${prefix}.overlay.png`, PNG.sync.write(overlay));
  return { expected: { width: expected.width, height: expected.height }, actual: { width: actual.width, height: actual.height }, dimensionsMatch: expected.width === actual.width && expected.height === actual.height, rawDiffPixels, pixelmatchPixels, threshold: 0, maxDiffPixels: 0 };
}

function options() {
  const result = {};
  for (let i = 2; i < process.argv.length; i++) {
    const flag = process.argv[i];
    if (['--self-check', '--mutations'].includes(flag)) result[flag.slice(2)] = true;
    else if (['--url', '--screen', '--output'].includes(flag) && process.argv[i + 1]) result[flag.slice(2)] = process.argv[++i];
    else throw new Error(`Unsupported argument: ${flag}`);
  }
  if (Boolean(result.url) === Boolean(result['self-check'])) throw new Error('Choose exactly one: --url http://127.0.0.1:PORT/dashboard.html or --self-check');
  if (result.url && !['http:', 'https:'].includes(new URL(result.url.replaceAll('{screen}', 'dashboard')).protocol)) throw new Error('HTTP(S) target required');
  result.screen ||= 'dashboard';
  if (!['dashboard', 'branding', 'collect', 'all'].includes(result.screen)) throw new Error('Unsupported screen');
  if (result.screen === 'all' && result.url && !result.url.includes('{screen}')) throw new Error('For --screen all, --url must contain {screen}');
  return result;
}

async function main() {
  const opts = options();
  const manifest = await verifyIntegrity();
  const currentEnvironment = await environment();
  for (const key of ['node', 'platform', 'arch', 'osRelease', 'chromiumSha256']) {
    if (currentEnvironment[key] !== manifest.environment[key]) throw new Error(`Rendering environment mismatch: ${key}`);
  }
  if (JSON.stringify(currentEnvironment.tooling) !== JSON.stringify(manifest.environment.tooling)) throw new Error('Tooling versions mismatch');
  let server; let browser;
  let output;
  if (opts.output) {
    output = path.resolve(opts.output);
    if (output === BASELINE || output.startsWith(`${BASELINE}/`)) throw new Error('REFUSED: output must be outside frozen baseline');
    await assertNoSymlinks(path.dirname(output));
    try { await mkdir(output, { mode: 0o700 }); }
    catch (error) { if (error.code === 'EEXIST') throw new Error(`REFUSED: output directory must be fresh: ${output}`); throw error; }
  } else {
    await assertNoSymlinks(os.tmpdir());
    output = await mkdtemp(path.join(os.tmpdir(), 'proofo-visual-'));
  }
  await assertNoSymlinks(output);
  const cases = manifest.cases.filter(c => opts.screen === 'all' || c.screen === opts.screen);
  if (!cases.length) throw new Error('No baseline cases selected');
  const planned = ['report.json'];
  for (const item of cases) for (const mutation of ['none', ...(opts.mutations ? Object.keys(mutations) : [])]) {
    const prefix = `${item.id.replaceAll('/', '-')}-${mutation}`;
    planned.push(...['actual.png', 'actual.json', 'diff.png', 'overlay.png'].map(suffix => `${prefix}.${suffix}`));
  }
  for (const file of planned) await assertFreshFile(path.join(output, file));
  const report = { kind: opts['self-check'] ? 'reference-pipeline-self-check' : 'application-visual-comparison', baseline: BASELINE, environment: currentEnvironment, url: opts.url || 'frozen resources on temporary loopback server', cases: [], passed: false };
  try {
    if (opts['self-check']) server = await serve(path.join(BASELINE, 'resources'));
    browser = await launch();
    if (browser.version() !== manifest.environment.browserVersion) throw new Error('Browser version mismatch');
    for (const item of cases) {
      const expected = JSON.parse(await readNoFollow(path.join(BASELINE, item.measurements), 'utf8'));
      const target = opts.url ? opts.url.replaceAll('{screen}', item.screen) : `${server.url}/?screen=${item.screen}&clean=1`;
      for (const [mutation, css] of [['none', undefined], ...(opts.mutations ? Object.entries(mutations) : [])]) {
        const prefix = path.join(output, `${item.id.replaceAll('/', '-')}-${mutation}`);
        const actual = await capture(browser, target, item.viewport, `${prefix}.actual.png`, css);
        await writeNew(`${prefix}.actual.json`, `${JSON.stringify(actual, null, 2)}\n`);
        const raster = await diffImages(path.join(BASELINE, item.image), `${prefix}.actual.png`, prefix);
        const checks = { raster: raster.dimensionsMatch && raster.rawDiffPixels === 0, absoluteShellClip: JSON.stringify(expected.clip) === JSON.stringify(actual.clip), absoluteRasterClip: JSON.stringify(expected.rasterClip) === JSON.stringify(actual.rasterClip), boxesAndStyles: JSON.stringify(expected.dom.metrics) === JSON.stringify(actual.dom.metrics), fixtureText: expected.dom.text === actual.dom.text, fixtureValues: JSON.stringify(expected.dom.values) === JSON.stringify(actual.dom.values), body: JSON.stringify(expected.dom.body) === JSON.stringify(actual.dom.body) };
        const identical = Object.values(checks).every(Boolean);
        // Контрольная поломка обязана менять именно raster, не только DOM report.
        const passed = mutation === 'none' ? identical : !checks.raster;
        report.cases.push({ id: item.id, mutation, expected: mutation === 'none' ? 'identical' : 'raster mismatch', passed, checks, geometry: { expected: expected.clip, actual: actual.clip, DPR: 1, tolerance: 0 }, raster, prefix });
        console.log(`${passed ? 'PASS' : 'FAIL'} ${item.id} ${mutation}: ${raster.rawDiffPixels} changed pixels; DOM ${checks.boxesAndStyles ? 'same' : 'different'}`);
      }
    }
    report.passed = report.cases.every(c => c.passed);
    await writeNew(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(`Artifacts: ${output}`);
    if (!report.passed) process.exitCode = 1;
  } finally { await browser?.close(); await server?.close(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 2; });
