#!/usr/bin/env node
// Только контролируемая первичная фиксация. Обновление baseline не поддерживается.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { constants } from 'node:fs';
import { readFile, mkdir, readdir, lstat, open, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BASELINE = path.join(ROOT, 'features/proofo-ui/reference/dashboard-v3');
export const MANIFEST_SHA256 = 'e7999b11e9fb68cf57f64323c624df5d70693d366d1d69be01a1d7e9e3101684';
export const SOURCE = 'e2e2f963b1a0199d597396cfba1aef369b7e969d';
export const SOURCE_PATH = 'features/proofo-ui/preview';
export const SOURCE_TREE = 'd9acba4e57aacbd35c2736523d08a8874f744b30';
export const VIEWPORTS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 800 }];
export const CHROME = process.env.PROOFO_CHROMIUM_EXECUTABLE || '/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome';
export const sha = value => createHash('sha256').update(value).digest('hex');
export const tooling = createRequire(path.join(ROOT, 'tools/visual/package.json'));
export const browserTools = () => tooling('playwright');
export const fileExists = async file => {
  try { await lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
};

// Reject every symlink component, including same-byte files and directory aliases.
export async function assertNoSymlinks(file) {
  const absolute = path.resolve(file);
  let current = path.parse(absolute).root;
  for (const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error(`REFUSED: symlink in path: ${current}`);
    if (current !== absolute && !info.isDirectory()) throw new Error(`REFUSED: non-directory ancestor: ${current}`);
  }
}

export async function readNoFollow(file, encoding) {
  file = path.resolve(file);
  await assertNoSymlinks(file);
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!(await handle.stat()).isFile()) throw new Error(`REFUSED: input is not a regular file: ${file}`);
    return await handle.readFile(encoding);
  } finally { await handle.close(); }
}

export async function assertFreshFile(file) {
  file = path.resolve(file);
  await assertNoSymlinks(path.dirname(file));
  if (await fileExists(file)) throw new Error(`REFUSED: output file already exists: ${file}`);
}

export async function writeNew(file, data) {
  file = path.resolve(file);
  await assertFreshFile(file);
  const handle = await open(file, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try { await handle.writeFile(data); } finally { await handle.close(); }
}

export async function filesUnder(dir) {
  dir = path.resolve(dir);
  await assertNoSymlinks(dir);
  const entries = await readdir(dir, { withFileTypes: true });
  const lists = await Promise.all(entries.map(async e => {
    const file = path.join(dir, e.name);
    await assertNoSymlinks(file);
    if (!e.isDirectory() && !e.isFile()) throw new Error(`REFUSED: non-regular baseline entry: ${file}`);
    return e.isDirectory() ? (await filesUnder(file)).map(p => `${e.name}/${p}`) : [e.name];
  }));
  return lists.flat().sort();
}

export async function serve(dir) {
  await assertNoSymlinks(dir);
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
  const server = createServer(async (req, res) => {
    try {
      const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
      const file = path.resolve(dir, relative);
      if (!file.startsWith(`${path.resolve(dir)}/`)) throw new Error('outside source');
      const data = await readNoFollow(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) };
}

export async function environment() {
  return {
    node: process.version, platform: os.platform(), arch: os.arch(), kernel: os.release(),
    osRelease: await readFile('/etc/os-release', 'utf8'), chromiumExecutable: CHROME,
    chromiumSha256: sha(await readFile(CHROME)),
    tooling: Object.fromEntries(['playwright', 'pixelmatch', 'pngjs'].map(name => [name, tooling(`${name}/package.json`).version]))
  };
}

export async function launch() {
  return browserTools().chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'] });
}

export async function capture(browser, url, viewport, output, mutation) {
  await assertFreshFile(output);
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: 'ru-RU', timezoneId: 'UTC', colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block', bypassCSP: Boolean(mutation) });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('requestfailed', request => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  try {
    const origin = new URL(url).origin;
    await context.route('**/*', async route => {
      const target = new URL(route.request().url());
      if (target.origin !== origin) { failures.push(`external resource: ${target.origin}`); await route.abort(); }
      else await route.continue();
    });
    await page.clock.install({ time: new Date('2026-11-11T12:00:00.000Z') });
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    if (!response?.ok()) throw new Error(`Page unavailable: ${response?.status()}`);
    await page.locator('.cab-shell').waitFor({ state: 'visible' });
    // Заранее названные demo-only исключения, утверждённые до app implementation.
    // Прямое DOM style свойство сохраняет CSP включённой; product selectors не меняются.
    await page.evaluate(() => { for (const selector of ['.cab-notice', '#preview-tools']) document.querySelector(selector)?.style.setProperty('display', 'none', 'important'); });
    await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); document.activeElement?.blur(); });
    await page.mouse.move(0, 0);
    // Мутации только в памяти тестового app DOM; frozen resources не изменяются.
    if (mutation) await page.addStyleTag({ content: mutation });
    const measure = () => page.locator('.cab-shell').boundingBox();
    const before = await measure();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const box = await measure();
    if (!box || JSON.stringify(before) !== JSON.stringify(box)) throw new Error('Unstable .cab-shell geometry');
    const dom = await page.evaluate(() => {
      const shell = document.querySelector('.cab-shell');
      const bounds = shell.getBoundingClientRect();
      const selectors = ['.cab-shell', '.cab-top', '.cab-paper', '.cab-title', 'h1', 'h2', 'h3', '.brand', '.cab-back', '.cab-summary', '.cab-subscription', '.cab-section', '.cab-metrics', '.cab-metrics>div', '.cab-walls', '.cab-wall-card', '.cab-card-bottom', '.cab-field', '.cab-check', '.cab-color', '.cab-collect-tabs', '.cab-button', '.cab-attribution'];
      const properties = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color', 'backgroundColor', 'borderColor', 'borderRadius', 'marginTop', 'marginBottom', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap'];
      const metrics = Object.fromEntries(selectors.map(selector => [selector, [...document.querySelectorAll(selector)].filter(e => e === shell || shell.contains(e)).map(e => {
        const b = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        return { box: { x: b.x - bounds.x, y: b.y - bounds.y, width: b.width, height: b.height }, style: Object.fromEntries(properties.map(p => [p, cs[p]])) };
      })]));
      return { metrics, text: shell.innerText, values: [...shell.querySelectorAll('input,select,textarea')].map(e => ({ tag: e.tagName, type: e.type, value: e.value, checked: e.checked })), fonts: [...document.fonts].map(f => ({ family: f.family, status: f.status, weight: f.weight })), body: { background: getComputedStyle(document.body).backgroundColor, font: getComputedStyle(document.body).fontFamily } };
    });
    if (!dom.fonts.some(f => f.family === 'body' && f.status === 'loaded') || !dom.fonts.some(f => f.family === 'display' && f.status === 'loaded')) throw new Error('Required local fonts were not loaded');
    // Явный region: .cab-shell, scroll=0. Banner и footer расположены вне clip.
    const noticeLocator = page.locator('.cab-notice');
    const notice = await noticeLocator.count() ? await noticeLocator.boundingBox() : null;
    if (notice && notice.y + notice.height > box.y) throw new Error('Demo notice intersects approved crop');
    const rasterClip = { ...box, width: Math.ceil(box.width), height: Math.ceil(box.height) };
    const screenshot = await page.screenshot({ clip: rasterClip, fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css' });
    await writeNew(output, screenshot);
    const { PNG } = tooling('pngjs');
    const png = PNG.sync.read(screenshot);
    const pixelSize = { width: Math.ceil(box.width), height: Math.ceil(box.height) };
    if (png.width !== pixelSize.width || png.height !== pixelSize.height) throw new Error(`Screenshot dimensions ${png.width}x${png.height} do not match full shell ${pixelSize.width}x${pixelSize.height}`);
    if (failures.length) throw new Error(failures.join('\n'));
    return { viewport, clip: box, rasterClip, pixelSize, mutationContext: mutation ? { bypassCSP: true, ephemeralCSS: mutation } : null, dom };
  } finally { await context.close(); }
}

export async function verifyIntegrity(baseline = BASELINE) {
  const manifestBytes = await readNoFollow(path.join(baseline, 'manifest.json'));
  if (sha(manifestBytes) !== MANIFEST_SHA256) throw new Error('Baseline manifest hash mismatch');
  const manifest = JSON.parse(manifestBytes);
  if (manifest.source.commit !== SOURCE || manifest.source.tree !== SOURCE_TREE) throw new Error('Unapproved source identity');
  const actualFiles = (await filesUnder(baseline)).filter(file => file !== 'manifest.json');
  if (JSON.stringify(actualFiles) !== JSON.stringify(Object.keys(manifest.files).sort())) throw new Error('Baseline file inventory changed');
  for (const [file, expected] of Object.entries(manifest.files)) {
    if (sha(await readNoFollow(path.join(baseline, file))) !== expected.sha256) throw new Error(`Baseline hash mismatch: ${file}`);
  }
  return manifest;
}

async function main() {
  if (await fileExists(BASELINE)) throw new Error('REFUSED: dashboard-v3 already exists; baseline updates are unsupported');
  if (process.argv.length !== 4 || process.argv[2] !== '--approve-source' || process.argv[3] !== SOURCE) throw new Error(`Initial capture requires --approve-source ${SOURCE}`);
  const tree = execFileSync('git', ['rev-parse', `${SOURCE}:${SOURCE_PATH}`], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (tree !== SOURCE_TREE) throw new Error('Approved source tree mismatch');
  await assertNoSymlinks(os.tmpdir());
  await assertNoSymlinks(path.dirname(BASELINE));
  const stage = await import('node:fs/promises').then(fs => fs.mkdtemp(path.join(os.tmpdir(), 'proofo-reference-')));
  let server; let browser;
  try {
    const resources = path.join(stage, 'resources'); await mkdir(resources);
    const names = execFileSync('git', ['ls-tree', '-r', '--name-only', SOURCE, SOURCE_PATH], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n');
    for (const file of names) {
      const relative = file.slice(SOURCE_PATH.length + 1); const target = path.join(resources, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeNew(target, execFileSync('git', ['show', `${SOURCE}:${file}`], { cwd: ROOT }));
    }
    server = await serve(resources); browser = await launch();
    const manifest = { version: 3, kind: 'initial-frozen-reference', source: { commit: SOURCE, path: SOURCE_PATH, tree: SOURCE_TREE }, approval: 'Ранее данное владельцем «да давай» для начала инкремента и трёх макетов; новые состояния приложения этим не утверждаются.', capturedAt: new Date().toISOString(), environment: { ...await environment(), browserVersion: browser.version() }, render: { selector: '.cab-shell', fullPage: true, rasterSize: 'ceil(measured shell width/height)', scroll: [0, 0], DPR: 1, locale: 'ru-RU', timezone: 'UTC', clock: '2026-11-11T12:00:00.000Z', colorScheme: 'light', reducedMotion: 'reduce', CSP: 'enabled; bypass only in ephemeral mutation contexts', masks: [], normalizations: [{ selector: '.cab-notice', display: 'none!important', reason: 'Demo-only banner excluded before capture, no app spacer' }, { selector: '#preview-tools', display: 'none!important', reason: 'Demo-only floating navigator; also clean=1' }], excluded: ['body > #app > .footer: outside crop, contains prototype-only text'] }, cases: [], files: {} };
    for (const screen of ['dashboard', 'branding', 'collect']) {
      await mkdir(path.join(stage, screen));
      for (const viewport of VIEWPORTS) {
        const id = `${screen}/${viewport.width}x${viewport.height}`;
        const result = await capture(browser, `${server.url}/?screen=${screen}&clean=1`, viewport, path.join(stage, `${id}.png`));
        await writeNew(path.join(stage, `${id}.json`), `${JSON.stringify(result, null, 2)}\n`);
        manifest.cases.push({ id, screen, state: 'initial-idle', viewport, image: `${id}.png`, measurements: `${id}.json` });
      }
    }
    for (const file of await filesUnder(stage)) {
      const bytes = await readNoFollow(path.join(stage, file));
      manifest.files[file] = { sha256: sha(bytes), bytes: bytes.length };
    }
    await writeNew(path.join(stage, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    if (await fileExists(BASELINE)) throw new Error('REFUSED: target appeared during capture');
    await assertNoSymlinks(path.dirname(BASELINE)); await rename(stage, BASELINE);
    console.log(`Frozen ${manifest.cases.length} initial cases; ${BASELINE}`);
  } finally { await browser?.close(); await server?.close(); await rm(stage, { recursive: true, force: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 2; });
