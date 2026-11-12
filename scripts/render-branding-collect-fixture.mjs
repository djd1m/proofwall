#!/usr/bin/env node
// Offline SSR imports the production views. No Next route, auth, services or hydration.
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertNoSymlinks, readNoFollow, writeNew } from './capture-proofo-reference.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output');
const output = outputIndex >= 0 && args[outputIndex + 1] ? path.resolve(args[outputIndex + 1]) : null;
const verify = args.includes('--verify');
if (!output || args.some((arg, i) => !['--output', '--verify'].includes(arg) && i !== outputIndex + 1)) throw new Error('Usage: --output FRESH_DIRECTORY [--verify]');
await assertNoSymlinks(path.dirname(output));
await mkdir(output, { mode: 0o700 });
const temporary = await mkdtemp(path.join(root, '.secrets/branding-view-build-'));
let server;
try {
  const modulePath = path.join(temporary, 'views.mjs');
  const built = await build({ stdin: { contents: "export { BrandingView } from './apps/web/src/app/dashboard/[slug]/branding/branding-view.tsx'; export { CollectView } from './apps/web/src/app/f/[slug]/collect-view.tsx';", resolveDir: root, loader: 'tsx' }, outfile: modulePath, bundle: true, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic', logLevel: 'silent', metafile: true });
  const { BrandingView, CollectView } = await import(pathToFileURL(modulePath).href);
  const inputs = await Promise.all(Object.keys(built.metafile.inputs).filter(p => p !== '<stdin>').map(async source => ({ path: source, sha256: createHash('sha256').update(await readNoFollow(path.resolve(root, source))).digest('hex') })));
  await writeNew(path.join(output, 'identity.json'), JSON.stringify({ kind: 'offline-production-view-inputs', inputs, hydrated: false }, null, 2));
  // Literal approved presentation. Unsupported items exist only as model data here.
  const palette = { fieldBorder: '#ddd3c2', fieldFill: '#f7f4eb', cardSurface: '#fffdf8', accentFill: '#c8492f', onAccent: '#ffffff', accentText: '#c8492f' };
  const branding = {
    projectName: 'Тихий берег · демо', wallHref: '?screen=empty-wall&clean=1', wallLinkLabel: 'пустой публичной стене →', backHref: '?screen=project&clean=1', homeHref: '?screen=home&clean=1', palette,
    values: { theme: 'Светлая — бумага', review_order: 'Сначала свежие', show_platform_labels: true, accent_color: '#c8492f', logo_url: '', heading: 'Оставьте отзыв' },
    themeOptions: [{ value: 'Светлая — бумага', label: 'Светлая — бумага' }, { value: 'Тёмная', label: 'Тёмная' }],
    orderOptions: [{ value: 'Сначала свежие', label: 'Сначала свежие' }, { value: 'Сначала с высокой оценкой', label: 'Сначала с высокой оценкой' }, { value: 'Сначала старые', label: 'Сначала старые' }],
    orderHint: 'Видео-отзывы всегда стоят над стеной. Лимит тарифа отбирает свежие отзывы, порядок переставляет уже отобранные.',
    logoHint: 'Только HTTPS. Пусто — логотипа не будет. В макете картинка не загружается.'
  };
  const collect = {
    headingLines: ['Оставьте', 'отзыв'], intro: 'Займёт минуту. Регистрироваться не нужно.', homeHref: '?screen=home&clean=1', palette,
    tabs: [{ label: '✍ Написать текстом', href: '?screen=collect&clean=1', current: true }, { label: 'Записать видео', href: '?screen=collect-video&clean=1' }],
    notice: 'Демонстрационная форма: вводите только вымышленные данные. Отправка не выполняется.',
    photoHint: 'JPEG, PNG или WebP, до 5 МБ. Файл не читается и не загружается.',
    disclosure: 'Отправляя отзыв, вы разрешаете владельцу опубликовать ваше имя и фото. Текст публикуется без изменений после проверки. Согласие можно отозвать. Это текст исследованной формы; макет ничего не отправляет.',
    values: { name: '', role: '', text: '' }
  };
  for (const [screen, component, model] of [['branding', BrandingView, branding], ['collect', CollectView, collect]]) {
    const html = renderToStaticMarkup(React.createElement(component, { model }));
    await writeNew(path.join(output, `${screen}.html`), `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Proofwall ${screen}</title><link rel="stylesheet" href="/globals.css"><link rel="stylesheet" href="/proofo-forms.css"></head><body>${html}</body></html>`);
  }
  await writeNew(path.join(output, 'proofo-forms.css'), await readNoFollow(path.join(root, 'apps/web/src/app/proofo-forms.css')));
  await writeNew(path.join(output, 'globals.css'), await readNoFollow(path.join(root, 'apps/web/src/app/globals.css')));
  await mkdir(path.join(output, 'proofo'));
  for (const name of ['body.woff2', 'display.woff2']) await writeNew(path.join(output, 'proofo', name), await readNoFollow(path.join(root, 'apps/web/public/proofo', name)));
  if (verify) {
    server = createServer(async (req, res) => {
      try {
        const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
        const file = path.resolve(output, `.${pathname}`);
        if (!file.startsWith(`${output}/`)) throw new Error('outside fixture');
        const data = await readNoFollow(file);
        res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2' })[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
      } catch { res.writeHead(404); res.end('Not found'); }
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(33189, '127.0.0.1', resolve); });
    const results = [];
    for (const screen of ['branding', 'collect']) {
      const reportDir = `${output}-${screen}-visual`;
      let exitCode = 0;
      try {
        const result = await promisify(execFile)(process.execPath, [path.join(root, 'scripts/check-proofo-visual.mjs'), '--screen', screen, '--url', `http://127.0.0.1:33189/${screen}.html`, '--output', reportDir, '--mutations'], { cwd: root, env: { PATH: path.dirname(process.execPath), LANG: 'C.UTF-8', TZ: 'UTC' }, maxBuffer: 1024 * 1024 });
        await writeNew(`${reportDir}.stdout.txt`, result.stdout);
      } catch (error) {
        exitCode = typeof error.code === 'number' ? error.code : 1;
        await writeNew(`${reportDir}.stdout.txt`, error.stdout || '');
        await writeNew(`${reportDir}.stderr.txt`, error.stderr || error.message);
      }
      results.push({ screen, exitCode, reportDir });
    }
    await writeNew(`${output}-results.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results));
    if (results.some(r => r.exitCode !== 0)) process.exitCode = 1;
  } else console.log(JSON.stringify({ rendered: ['branding', 'collect'], output }));
} finally {
  if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await rm(temporary, { recursive: true, force: true });
}
