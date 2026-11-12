// Production routes + выделенная PG + synthetic S3, без auth/fixture overrides.
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from 'playwright/test';
import { assertBrandingCollectQaConfig, buildBrandingCollectQaEnv } from '../../scripts/run-branding-collect-preview.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(resolve(root, 'apps/web/package.json'));
const { Pool } = require('pg');
const cfg = {};
for (const key of ['DATABASE_URL', 'BASE_URL', 'SESSION_SECRET', 'BILLING_WEBHOOK_TOKEN', 'N3_ENTITLEMENT_SIGNING_SECRET', 'N3_ENTITLEMENT_TOKEN_SECRET', 'S3_ENDPOINT', 'S3_REGION', 'S3_FORCE_PATH_STYLE', 'S3_PHOTO_BUCKET', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY']) {
  if (process.env[key] !== undefined) cfg[key] = process.env[key];
}
assertBrandingCollectQaConfig(cfg);
assert.equal(new URL(cfg.DATABASE_URL).port, '33186');
assert.equal(new URL(cfg.BASE_URL).port, '33187');
assert.equal(new URL(cfg.S3_ENDPOINT).port, '33188');
const childEnv = buildBrandingCollectQaEnv(cfg, 'e2e');
const base = cfg.BASE_URL;
const chrome = '/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome';
const pool = new Pool({ connectionString: cfg.DATABASE_URL });
const prefix = 'bc-' + randomUUID().slice(0, 8), slug = prefix + '-owner';
const password = 'Synthetic-branding-password-only-42';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const storage = new Map(), records = [];
const counts = { puts: 0, gets: 0, failures: 0, remoteBlockedRequests: 0 };
let failStorage = false, app, browser, context, foreignContext, page, s3, host, appLog, appFailure = false;
let accountId, projectId, foreignId;
let actualWidgetCsp;
const sleep = ms => new Promise(ok => setTimeout(ok, ms));
async function listen(server, port) {
  await new Promise((ok, no) => { server.once('error', no); server.listen(port, '127.0.0.1', ok); }); return server;
}
async function close(server) {
  if (server?.listening) { server.closeAllConnections(); await new Promise(ok => server.close(ok)); }
}
async function stopApp() {
  const owned = app; app = undefined;
  if (!owned || owned.exitCode !== null || owned.signalCode !== null || !owned.pid) return;
  const closed = new Promise(ok => owned.once('close', ok)); owned.kill('SIGTERM');
  const timer = setTimeout(() => owned.kill('SIGKILL'), 5000); await closed; clearTimeout(timer);
}
async function register(ctx, suffix, projectSlug) {
  const response = await ctx.request.post(base + '/api/auth/register', { data: { email: `${prefix}-${suffix}@example.test`, password, project_name: 'Синтетическая стена', desired_slug: projectSlug } });
  assert.equal(response.status(), 201, 'ordinary registration'); return response.json();
}
async function login(target) {
  await target.goto(base + '/login?next=/dashboard');
  await target.getByLabel('Email', { exact: true }).fill(`${prefix}-owner@example.test`);
  await target.getByLabel('Пароль', { exact: true }).fill(password);
  await target.getByRole('button', { name: 'Войти', exact: true }).click(); await target.waitForURL(base + '/dashboard');
}
async function isolatedContext() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU', timezoneId: 'UTC', reducedMotion: 'reduce' });
  ctx.setDefaultTimeout(7000);
  await ctx.route('**/*', route => {
    const url = new URL(route.request().url());
    if ((url.hostname === '127.0.0.1' && ['33187', '33189'].includes(url.port)) || (url.hostname === 'widget.synthetic.test' && url.port === '33189')) return route.continue();
    counts.remoteBlockedRequests++; return route.abort();
  }); return ctx;
}
async function editor(target = page) { await target.goto(`${base}/dashboard/${slug}/branding`); await expect(target.locator('form')).toBeVisible(); }
async function save(target = page) {
  const response = target.waitForResponse(r => r.request().method() === 'PATCH' && r.url().endsWith('/branding'));
  await target.getByRole('button', { name: 'Сохранить', exact: true }).click(); assert.equal((await response).status(), 200);
  await expect(target.getByRole('status')).toHaveText('Настройки сохранены.');
}
async function collect(target = page) { await target.goto(`${base}/f/${slug}`); await expect(target.locator('#cab-name')).toBeVisible(); }
async function draft(target = page, values = { name: 'Синтетический автор', role: 'Роль', text: 'Синтетический отзыв без изменений.' }) {
  await target.locator('#cab-name').fill(values.name); await target.locator('#cab-role').fill(values.role); await target.locator('#cab-review').fill(values.text);
}
async function clearQuota() {
  const keys = ['unknown', '127.0.0.1', '::ffff:127.0.0.1', '::1'].map(ip => createHash('sha256').update(ip + '|' + projectId).digest('hex'));
  await pool.query("DELETE FROM rate_limit_events WHERE scope='form_submission' AND key=ANY($1::text[])", [keys]);
}
async function patch(body, ctx = context) { return ctx.request.patch(`${base}/api/projects/${slug}/branding`, { headers: { origin: base }, data: body }); }
async function assertWidgetCsp(target) {
  await expect(target.locator('.host-marker')).toHaveAttribute('data-script', 'running');
  await expect(target.locator('.host-marker')).toHaveCSS('color', 'rgb(255, 0, 255)');
  const proof = await target.locator('.pw-widget').evaluate(el => {
    const root = el.getRootNode(), css = getComputedStyle(el), card = getComputedStyle(root.querySelector('.pw-card'));
    return { inline: root.querySelectorAll('style').length, sheets: root.adoptedStyleSheets.length,
      display: css.display, fontSize: css.fontSize, fontFamily: css.fontFamily,
      background: css.backgroundColor, theme: el.dataset.theme, padding: card.paddingTop,
      violations: window.__hostCspViolations?.length };
  });
  assert.equal(proof.inline, 0); assert.ok(proof.sheets >= 1); assert.equal(proof.violations, 0);
  assert.equal(proof.display, 'flex'); assert.equal(proof.fontSize, '14px'); assert.ok(!proof.fontFamily.includes('monospace')); assert.equal(proof.padding, '16px');
  assert.equal(proof.background, proof.theme === 'dark' ? 'rgb(24, 24, 24)' : 'rgb(255, 255, 255)');
  return proof;
}
async function widget(target = page) {
  const config = target.waitForResponse(r => r.url().includes('/api/widget/config?'));
  const hostResponse = await target.goto(`http://widget.synthetic.test:33189/widget?slug=${slug}`);
  const policy = hostResponse.headers()['content-security-policy'];
  actualWidgetCsp = policy;
  assert.ok(!policy.includes('unsafe-inline')); assert.ok(policy.includes("style-src 'self'"));
  const response = await config; assert.equal(response.status(), 200); assert.equal(response.headers()['access-control-allow-origin'], '*');
  const headers = await response.request().allHeaders();
  assert.equal(headers.origin, 'http://widget.synthetic.test:33189'); assert.equal(headers.cookie, undefined); assert.equal(headers.authorization, undefined);
  await expect(target.locator('.pw-widget')).toBeVisible(); await expect(target.locator('.pw-card').first()).toBeVisible();
  await assertWidgetCsp(target);
}

async function approveThroughOwnerApi(id) {
  const endpoint = `${base}/api/testimonials/${id}/moderate`;
  const pending = () => pool.query('SELECT status,text FROM testimonials WHERE id=$1', [id]);
  assert.equal((await pending()).rows[0].status, 'pending');
  const hidden = await (await context.request.get(`${base}/api/widget/config?slug=${slug}`)).json();
  assert.ok(!hidden.testimonials.some(row => row.id === id), 'pending is not public before owner moderation');
  assert.equal((await foreignContext.request.post(endpoint, { data: { status: 'approved' } })).status(), 403);
  const anonymous = await isolatedContext(), expired = await isolatedContext();
  try {
    assert.equal((await anonymous.request.post(endpoint, { data: { status: 'approved' } })).status(), 401);
    const expiredPage = await expired.newPage(); await login(expiredPage);
    const token = (await expired.cookies()).find(cookie => cookie.name === 'pw_session')?.value;
    assert.ok(token, 'ordinary session exists');
    const hash = createHmac('sha256', cfg.SESSION_SECRET).update(token).digest('hex');
    await pool.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1", [hash]);
    assert.equal((await expired.request.post(endpoint, { data: { status: 'approved' } })).status(), 401);
  } finally { await anonymous.close(); await expired.close(); }
  assert.equal((await pending()).rows[0].status, 'pending');
  const approved = await context.request.post(endpoint, { data: { status: 'approved' } });
  assert.equal(approved.status(), 200); assert.deepEqual(await approved.json(), { id, from: 'pending', to: 'approved', indexable: false });
  assert.equal((await pending()).rows[0].status, 'approved');
  const own = await (await context.request.get(`${base}/api/widget/config?slug=${slug}`)).json();
  const foreign = await (await foreignContext.request.get(`${base}/api/widget/config?slug=${prefix}-foreign`)).json();
  assert.ok(own.testimonials.some(row => row.id === id)); assert.ok(!foreign.testimonials.some(row => row.id === id));
  const foreignWall = await (await foreignContext.request.get(`${base}/w/${prefix}-foreign`)).text();
  assert.ok(!foreignWall.includes((await pending()).rows[0].text));
  records.push({ check: 'ordinary-owner-moderation', approved: 1, deniedForeign: 1, deniedAnonymous: 1, deniedExpired: 1 });
}

before(async () => {
  try {
    s3 = await listen(createServer(async (req, res) => {
      if (!req.headers.authorization?.includes('Credential=proofwall-ui-test-access/')) { res.writeHead(403).end(); return; }
      const pathname = decodeURIComponent(new URL(req.url, cfg.S3_ENDPOINT).pathname);
      if (!pathname.startsWith('/proofwall-ui-test-photos/')) { res.writeHead(404).end(); return; }
      if (failStorage) { counts.failures++; res.writeHead(503, { 'content-type': 'application/xml', 'retry-after': '0' }).end('<Error><Code>ServiceUnavailable</Code></Error>'); return; }
      if (req.method === 'PUT') {
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 5 * 1024 * 1024) { res.writeHead(413).end(); return; } chunks.push(chunk); }
        storage.set(pathname, Buffer.concat(chunks)); counts.puts++; res.writeHead(200, { ETag: '"synthetic"' }).end(); return;
      }
      if (req.method === 'GET' && storage.has(pathname)) {
        const body = storage.get(pathname); counts.gets++; res.writeHead(200, { 'content-type': 'image/png', 'content-length': String(body.length) }).end(body); return;
      } res.writeHead(404).end();
    }), 33188);
    host = await listen(createServer(async (req, res) => {
      const pathname = new URL(req.url, 'http://widget.synthetic.test:33189').pathname;
      if (pathname === '/host.css') {
        res.writeHead(200, { 'content-type': 'text/css' }).end('body{margin:8px;font:13px monospace}*{font-family:monospace!important;color:magenta!important}.host-marker{background:lime}'); return;
      }
      if (pathname === '/host.js') {
        res.writeHead(200, { 'content-type': 'application/javascript' });
        res.end(`window.__hostCspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.__hostCspViolations.push(e.effectiveDirective));document.querySelector('.host-marker').dataset.script='running';if(location.pathname==='/inline-mutant'){const revert=()=>{const r=document.querySelector('script[data-slug]')?.nextElementSibling?.shadowRoot;if(!r?.adoptedStyleSheets.length){setTimeout(revert,10);return;}const css=Array.from(r.adoptedStyleSheets).flatMap(s=>Array.from(s.cssRules).map(rule=>rule.cssText)).join('\\n');r.adoptedStyleSheets=[];const old=document.createElement('style');old.textContent=css;r.appendChild(old);window.__inlineMutationApplied=true;};revert();}`); return;
      }
      const manifest = JSON.parse(await readFile(resolve(root, 'apps/web/public/widget-manifest.json'), 'utf8'));
      res.writeHead(200, { 'content-type': 'text/html', 'content-security-policy': `default-src 'none'; script-src 'self' ${base}; connect-src ${base}; img-src ${base} data:; style-src 'self'; base-uri 'none'; object-src 'none'` });
      res.end(`<!doctype html><html><head><link rel="icon" href="data:,"><link rel="stylesheet" href="/host.css"></head><body><p class="host-marker">Внешний хост</p><script src="/host.js"></script><script src="${base}/${manifest.file}" data-slug="${slug}" async></script></body></html>`);
    }), 33189);
    appLog = createWriteStream(resolve(root, '.secrets/branding-repair-e2e-next.log'));
    app = spawn(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', '33187'], { cwd: resolve(root, 'apps/web'), env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] });
    app.once('error', () => { appFailure = true; });
    app.stdout.pipe(appLog); app.stderr.pipe(appLog);
    let ready = false;
    for (let i = 0; i < 300; i++) {
      if (appFailure || app.exitCode !== null) throw new Error('Owned QA application exited before readiness');
      try { if ((await fetch(base + '/login')).status === 200) { ready = true; break; } } catch { /* bounded readiness retry */ }
      await sleep(100);
    } assert.ok(ready, 'owned Next readiness');
    browser = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox', '--host-resolver-rules=MAP widget.synthetic.test 127.0.0.1'] });
    context = await isolatedContext();
    const reg = await register(context, 'owner', slug); accountId = reg.account_id;
    foreignContext = await isolatedContext();
    const other = await register(foreignContext, 'foreign', prefix + '-foreign'); foreignId = other.account_id;
    projectId = (await pool.query('SELECT id FROM projects WHERE slug=$1', [slug])).rows[0].id;
    page = await context.newPage(); await login(page);
  } catch (error) { await browser?.close(); await stopApp(); await close(host); await close(s3); throw error; }
}, { timeout: 60000 });
after(async () => {
  await browser?.close(); await stopApp(); appLog?.end(); await close(host); await close(s3);
  if (accountId || foreignId) await pool.query('DELETE FROM accounts WHERE id=ANY($1::uuid[])', [[accountId, foreignId].filter(Boolean)]);
  await pool.end();
  const manifest = JSON.parse(await readFile(resolve(root, 'apps/web/public/widget-manifest.json'), 'utf8'));
  const bundleSha256 = createHash('sha256').update(await readFile(resolve(root, 'apps/web/public', manifest.file))).digest('hex');
  await writeFile(resolve(root, '.secrets/branding-repair-e2e-measurements.json'), JSON.stringify({ counts, records,
    widgetContract: { policy: actualWidgetCsp, bundleFile: manifest.file, bundleSha256, browser: 'Chromium 148.0.7778.97', hostOrigin: 'http://widget.synthetic.test:33189', widgetOrigin: base, credentials: 'omit', cors: '*' } }, null, 2));
});

test('owner navigates from project to branding and back', async () => {
  await page.goto(base + '/dashboard'); await page.locator(`a[href="/dashboard/${slug}"]`).first().click();
  await page.getByRole('link', { name: /Оформление стены/ }).focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(`${base}/dashboard/${slug}/branding`);
  await page.getByRole('link', { name: '← кабинет' }).click(); await expect(page).toHaveURL(`${base}/dashboard/${slug}`);
  const anonymous = await isolatedContext(), anonPage = await anonymous.newPage();
  await anonPage.goto(`${base}/dashboard/${slug}/branding`); assert.equal(new URL(anonPage.url()).pathname, '/login'); await anonymous.close();
  assert.equal((await page.goto(`${base}/dashboard/${prefix}-foreign/branding`)).status(), 404);
  await pool.query('UPDATE projects SET deactivated=true WHERE id=$1', [projectId]);
  try { assert.equal((await page.goto(`${base}/dashboard/${slug}/branding`)).status(), 404); }
  finally { await pool.query('UPDATE projects SET deactivated=false WHERE id=$1', [projectId]); }
});

test('branding collect real flows', async () => {
  await editor(); await page.locator('#cab-theme').selectOption('dark'); await page.locator('#cab-order').selectOption('oldest');
  await page.locator('#cab-labels').uncheck(); await page.locator('#cab-color-text').fill('#FFFFFF');
  await page.locator('#cab-form-title').fill('Ваш честный отзыв'); await save(); await page.reload();
  await expect(page.locator('#cab-theme')).toHaveValue('dark'); await expect(page.locator('#cab-order')).toHaveValue('oldest'); await expect(page.locator('#cab-labels')).not.toBeChecked();
  await collect(); await expect(page.locator('h1')).toHaveText('Ваш честный отзыв'); await expect(page.getByText('Записать видео')).toHaveCount(0);
  await clearQuota(); await draft();
  const response = page.waitForResponse(r => r.url().endsWith('/api/testimonials') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Отправить отзыв', exact: true }).click(); assert.equal((await response).status(), 201); await expect(page.locator('.cab-thanks')).toBeFocused();
  const row = (await pool.query('SELECT id,status FROM testimonials WHERE project_id=$1 ORDER BY created_at DESC LIMIT 1', [projectId])).rows[0]; assert.equal(row.status, 'pending');
  const pendingConfig = await (await context.request.get(`${base}/api/widget/config?slug=${slug}`)).json();
  assert.equal(pendingConfig.testimonials.some(item => item.id === row.id), false);
  await approveThroughOwnerApi(row.id);
  await page.goto(`${base}/w/${slug}`); await expect(page.locator('.quote__body')).toContainText('Синтетический отзыв без изменений.'); await expect(page.locator('main')).toHaveAttribute('data-theme', 'dark');
  await widget(); await expect(page.locator('.pw-text')).toContainText('Синтетический отзыв без изменений.'); await expect(page.locator('.pw-badge')).toBeVisible();
});

test('legacy HTTP logo permits unrelated theme save', async () => {
  await pool.query('UPDATE projects SET branding=branding||$2::jsonb WHERE id=$1', [projectId, JSON.stringify({ logo_url: base + '/brand/icon.svg' })]);
  await editor(); await page.locator('#cab-theme').selectOption('light');
  let payload; await page.route('**/api/projects/*/branding', async route => { payload = route.request().postDataJSON(); await route.continue(); });
  await save(); assert.equal('logo_url' in payload, false); await page.unroute('**/api/projects/*/branding');
  await page.reload(); await expect(page.locator('#cab-theme')).toHaveValue('light'); await page.locator('#cab-logo').fill('http://edited.example/logo.png');
  let writes = 0; const listener = req => { if (req.method() === 'PATCH') writes++; }; page.on('request', listener);
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click(); await expect(page.locator('.cab-error-summary')).toBeFocused(); await expect(page.locator('#cab-logo')).toHaveAttribute('aria-invalid', 'true');
  assert.equal(writes, 0); page.off('request', listener); await patch({ logo_url: null });
});

test('branding locks settings during delayed save', async () => {
  await editor(); await page.locator('#cab-form-title').fill('Captured draft');
  let resume, entered, count = 0, payload;
  const arrival = new Promise(ok => { entered = ok; }), gate = new Promise(ok => { resume = ok; });
  await page.route('**/api/projects/*/branding', async route => { count++; payload = route.request().postDataJSON(); entered(); await gate; await route.continue(); });
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click(); await arrival;
  try {
    await expect(page.getByRole('status')).toBeFocused();
    for (const id of ['cab-theme', 'cab-order', 'cab-labels', 'cab-color', 'cab-color-text', 'cab-logo', 'cab-form-title']) {
      const control = page.locator('#' + id); await expect(control).toBeDisabled();
      const snapshot = await control.evaluate(el => ({ value: el.value, checked: el.checked }));
      if (id === 'cab-theme' || id === 'cab-order') await assert.rejects(() => control.selectOption({ index: 0 }, { timeout: 150 }));
      else if (id === 'cab-labels') await assert.rejects(() => control.setChecked(!snapshot.checked, { timeout: 150 }));
      else await assert.rejects(() => control.fill(id === 'cab-color' ? '#123456' : 'Attempted pending edit', { timeout: 150 }));
      assert.deepEqual(await control.evaluate(el => ({ value: el.value, checked: el.checked })), snapshot);
    }
    await expect(page.getByRole('button', { name: 'Сохранение…', exact: true })).toBeDisabled();
    await assert.rejects(() => page.getByRole('button', { name: 'Сохранение…', exact: true }).click({ timeout: 150 }));
    await page.keyboard.press('Enter'); assert.equal(count, 1); assert.deepEqual(payload, { heading: 'Captured draft' });
  } finally { resume(); }
  await expect(page.getByRole('status')).toHaveText('Настройки сохранены.'); await page.unroute('**/api/projects/*/branding');
});

test('branding two tabs merge dirty keys in commit order', async () => {
  const second = await isolatedContext(), tab = await second.newPage();
  try {
    await login(tab); await editor(); await editor(tab);
    await page.locator('#cab-form-title').fill('First tab'); await tab.locator('#cab-color-text').fill('#181818'); await save(); await save(tab); await page.reload(); await tab.reload();
    for (const target of [page, tab]) { await expect(target.locator('#cab-form-title')).toHaveValue('First tab'); await expect(target.locator('#cab-color-text')).toHaveValue('#181818'); }
    await page.locator('#cab-form-title').fill('Earlier commit'); await tab.locator('#cab-form-title').fill('Last commit'); await save(); await save(tab); await page.reload(); await tab.reload();
    for (const target of [page, tab]) await expect(target.locator('#cab-form-title')).toHaveValue('Last commit');
  } finally { await second.close(); }
});

test('collect preserves padded names and raw role text boundaries', async () => {
  const valid = [
    { name: ' ' + 'я'.repeat(80) + ' ', role: ' ' + 'р'.repeat(118) + ' ', text: ' '.repeat(10) },
    { name: 'Ан', role: ' '.repeat(120), text: 'т'.repeat(2000) },
  ];
  for (const values of valid) {
    await clearQuota(); await collect(); await draft(page, values);
    const response = page.waitForResponse(r => r.url().endsWith('/api/testimonials') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Отправить отзыв', exact: true }).click(); assert.equal((await response).status(), 201);
    const stored = (await pool.query('SELECT author_name,author_role,text FROM testimonials WHERE project_id=$1 ORDER BY created_at DESC LIMIT 1', [projectId])).rows[0];
    assert.deepEqual(stored, { author_name: values.name, author_role: values.role.trim() ? values.role : null, text: values.text });
    await clearQuota();
    const direct = await context.request.post(base + '/api/testimonials', { data: { slug, type: 'text', ...values } }); assert.equal(direct.status(), 201);
  }
  for (const values of [
    { name: ' я ', role: '', text: 'Valid text here' }, { name: 'я'.repeat(81), role: '', text: 'Valid text here' },
    { name: 'Автор', role: ' '.repeat(121), text: 'Valid text here' }, { name: 'Автор', role: '', text: 'x'.repeat(9) }, { name: 'Автор', role: '', text: 'x'.repeat(2001) },
  ]) {
    await clearQuota(); await collect(); await draft(page, values);
    let requests = 0; const listener = req => { if (req.method() === 'POST' && req.url().endsWith('/api/testimonials')) requests++; }; page.on('request', listener);
    await page.getByRole('button', { name: 'Отправить отзыв', exact: true }).click(); await expect(page.locator('.cab-error-summary')).toBeFocused();
    assert.equal(requests, 0); page.off('request', listener); await expect(page.locator('#cab-name')).toHaveValue(values.name);
    const before = (await pool.query('SELECT count(*)::int AS count FROM testimonials WHERE project_id=$1', [projectId])).rows[0].count, puts = counts.puts;
    assert.equal((await context.request.post(base + '/api/testimonials', { data: { slug, type: 'text', ...values } })).status(), 400);
    assert.equal((await pool.query('SELECT count(*)::int AS count FROM testimonials WHERE project_id=$1', [projectId])).rows[0].count, before); assert.equal(counts.puts, puts);
  }
});

test('collect uploads and reads local photo', async () => {
  await clearQuota(); await collect(); await draft();
  await page.locator('#cab-photo').setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: png });
  await expect(page.locator('.cab-photo-preview img')).toBeVisible();
  const first = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/testimonials'));
  failStorage = true;
  try {
    await page.getByRole('button', { name: 'Отправить отзыв', exact: true }).click(); assert.equal((await first).status(), 503);
    await expect(page.locator('.cab-error-summary')).toBeFocused(); await expect(page.locator('#cab-name')).toHaveValue('Синтетический автор');
    await expect(page.locator('.cab-photo-preview')).toContainText('synthetic.png');
    const quota = (await pool.query("SELECT count(*)::int AS count FROM rate_limit_events WHERE scope='form_submission' AND key=$1", [createHash('sha256').update('127.0.0.1|' + projectId).digest('hex')])).rows[0].count; assert.equal(quota, 0);
  } finally { failStorage = false; }
  const retry = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/testimonials'));
  await page.getByRole('button', { name: 'Отправить отзыв', exact: true }).click(); assert.equal((await retry).status(), 201); await expect(page.locator('.cab-thanks')).toBeFocused();
  const record = (await pool.query('SELECT id,photo_url,status FROM testimonials WHERE project_id=$1 ORDER BY created_at DESC LIMIT 1', [projectId])).rows[0];
  assert.equal(record.status, 'pending');
  const photo = await context.request.get(base + record.photo_url); assert.equal(photo.status(), 200); assert.deepEqual(await photo.body(), png);
  assert.equal(photo.headers()['x-content-type-options'], 'nosniff'); assert.ok(counts.puts > 0 && counts.gets > 0 && counts.failures > 0);
  await approveThroughOwnerApi(record.id);
  await page.goto(`${base}/w/${slug}`); await expect(page.locator(`img[src="${record.photo_url}"]`)).toBeVisible();
  await widget(); await expect(page.locator('.pw-photo')).toBeVisible();
  records.push({ check: 'local-photo', sha256: createHash('sha256').update(png).digest('hex'), byteCount: png.length, status: 'passed' });
});

test('forms expose labels errors statuses and managed focus', async () => {
  for (const route of ['branding', 'collect']) {
    if (route === 'branding') await editor(); else await collect();
    const ids = route === 'branding' ? ['cab-theme', 'cab-order', 'cab-labels', 'cab-color', 'cab-color-text', 'cab-logo', 'cab-form-title'] : ['cab-name', 'cab-role', 'cab-review', 'cab-photo'];
    for (const id of ids) {
      const element = page.locator('#' + id); await expect(element).toHaveAccessibleName(/.+/);
      assert.ok(await element.evaluate(el => Boolean(el.labels?.length || el.getAttribute('aria-label'))));
    }
    const ax = await page.locator('form').ariaSnapshot();
    assert.ok(ax.includes(route === 'branding' ? 'Цвет в формате HEX' : 'Ваше имя'));
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    if (route === 'branding') { await page.locator('#cab-logo').fill('http://bad.example/logo'); await page.getByRole('button', { name: 'Сохранить', exact: true }).click(); }
    else { await draft(page, { name: 'я', role: '', text: 'short' }); await page.getByRole('button', { name: 'Отправить отзыв', exact: true }).click(); }
    await expect(page.locator('.cab-error-summary')).toBeFocused();
    const invalid = page.locator('[aria-invalid="true"]').first();
    const relationship = await invalid.getAttribute('aria-describedby'); assert.ok(relationship);
    for (const id of relationship.split(' ')) await expect(page.locator('#' + id)).toBeVisible();
    const errorRelation = async () => {
      const messages = await invalid.evaluate(el => (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean).map(id => document.getElementById(id)?.textContent?.trim()));
      assert.ok(messages.length && messages.every(Boolean), 'visible nonempty field messages');
    };
    await errorRelation();
    await invalid.evaluate(el => el.removeAttribute('aria-describedby'));
    await assert.rejects(errorRelation); await invalid.evaluate((el, value) => el.setAttribute('aria-describedby', value), relationship);
    const message = page.locator('#' + relationship.split(' ').at(-1)), messageText = await message.textContent();
    await message.evaluate(el => { el.textContent = ''; }); await assert.rejects(errorRelation); await message.evaluate((el, text) => { el.textContent = text; }, messageText);
    assertColors(await colors(page));
    await page.locator('.cab-error-summary').getByRole('link').first().click(); await expect(invalid).toBeFocused();
  }
  for (const status of [400, 429, 503, 'network']) {
    await collect(); await draft();
    await page.route('**/api/testimonials', route => status === 'network' ? route.abort() : route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ errors: ['name: synthetic rejected value'], error: 'Синтетическая ошибка' }) }));
    await page.getByRole('button', { name: 'Отправить отзыв', exact: true }).click();
    await expect(page.locator('.cab-error-summary')).toBeFocused(); await expect(page.locator('#cab-review')).toHaveValue('Синтетический отзыв без изменений.'); await expect(page.locator('#cab-name')).toBeEnabled();
    assertColors(await colors(page));
    await page.unroute('**/api/testimonials');
    await editor(); await page.locator('#cab-form-title').fill('Retained failed draft');
    await page.route('**/api/projects/*/branding', route => status === 'network' ? route.abort() : route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'Синтетическая ошибка' }) }));
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click(); await expect(page.locator('.cab-error-summary')).toBeFocused(); await expect(page.locator('#cab-form-title')).toHaveValue('Retained failed draft'); await expect(page.locator('#cab-theme')).toBeEnabled();
    await page.unroute('**/api/projects/*/branding');
  }
  records.push({ check: 'field-message-relation-mutants', status: 'killed', count: 4 });
});

async function colors(target, selector = 'body') {
  return target.locator(selector).evaluate(scope => {
    const rgba = value => { const n = value.match(/[\d.]+/g)?.map(Number); if (!n || n.length < 3) throw new Error('Unresolved computed color'); return [n[0], n[1], n[2], n[3] ?? 1]; };
    const over = (a, b) => [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3])).concat(1);
    const parent = node => node.parentElement ?? (node.getRootNode() instanceof ShadowRoot ? node.getRootNode().host : null);
    const bg = node => node ? over(rgba(getComputedStyle(node).backgroundColor), bg(parent(node))) : [255, 255, 255, 1];
    const lum = c => { const n = c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return n[0] * .2126 + n[1] * .7152 + n[2] * .0722; };
    const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
    const result = [];
    const selectors = 'h1,a,button,input,textarea,select,[role=note],.cab-field,.cab-small,.cab-consent,.cab-counter,.status,.cab-error-summary,.cab-thanks,.quote__body,.quote__role,.quote__origin,.quote__transcript,.wallFoot,.pw-text,.pw-author-name,.pw-author-role,.pw-origin,.pw-transcript-label,.pw-badge';
    for (const el of scope.querySelectorAll(selectors)) {
      if (!el.getClientRects().length || el.matches(':disabled') || (!el.textContent.trim() && !el.matches('input,textarea,select'))) continue;
      const s = getComputedStyle(el), background = bg(el), foreground = over(rgba(s.color), background);
      const large = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && Number(s.fontWeight) >= 700);
      result.push({ element: el.id || el.className || el.tagName, kind: 'text', ratio: ratio(foreground, background), required: large ? 3 : 4.5 });
      if (el.matches('input:not([type=file]),textarea,select,button')) {
        const border = over(rgba(s.borderTopColor), background);
        result.push({ element: el.id || el.tagName, kind: 'boundary', ratio: el.matches('button') ? ratio(border, bg(parent(el))) : Math.min(ratio(border, background), ratio(border, bg(parent(el)))), required: 3 });
      }
      if (el.matches('input[type=file]')) {
        const native = getComputedStyle(el, '::file-selector-button');
        const fill = over(rgba(native.backgroundColor), background), edge = over(rgba(native.borderTopColor), fill);
        result.push({ element: el.id, kind: 'photo-boundary', ratio: Math.min(ratio(edge, fill), ratio(edge, background)), required: 3 });
      }
      if (el.matches(':focus-visible') && s.outlineStyle !== 'none') {
        result.push({ element: el.id || el.tagName, kind: 'focus', ratio: ratio(over(rgba(s.outlineColor), bg(parent(el))), bg(parent(el))), required: 3 });
      }
    }
    return result;
  });
}
function assertColors(rows) {
  assert.ok(rows.length > 0, 'computed color inventory');
  for (const row of rows) assert.ok(row.ratio + .001 >= row.required, JSON.stringify(row));
}

test('branding contrast covers accent text and accent fill', async () => {
  for (const theme of ['light', 'dark']) for (const accent_color of ['#FFFFFF', '#000000', '#F8F8F8', '#181818', '#777777']) {
    assert.equal((await patch({ theme, accent_color })).status(), 200);
    for (const route of ['editor', 'form', 'wall', 'widget']) {
      if (route === 'editor') await editor(); else if (route === 'form') await collect(); else if (route === 'wall') await page.goto(`${base}/w/${slug}`); else await widget();
      const rows = await colors(page, route === 'widget' ? '.pw-widget' : 'body'); assertColors(rows);
      records.push({ check: 'computed-contrast', theme, accent: accent_color, surface: route, count: rows.length, minMargin: Math.min(...rows.map(row => row.ratio - row.required)) });
    }
  }
  await patch({ accent_color: '#FFFFFF' }); await collect();
  await page.locator('h1').evaluate(el => { el.style.color = '#ffffff'; });
  const mutant = await colors(page); assert.throws(() => assertColors(mutant));
  records.push({ check: 'raw-white-accent-text-mutant', status: 'killed' });
});

test('live forms use owner approved field borders', async () => {
  for (const screen of ['branding', 'collect']) {
    if (screen === 'branding') await editor(); else await collect();
    const fields = page.locator('input:not([type=file]):not([type=checkbox]),textarea,select');
    for (const field of await fields.all()) await expect(field).toHaveCSS('border-top-color', 'rgb(142, 128, 107)');
    assertColors(await colors(page));
    await fields.first().focus(); assertColors(await colors(page));
    await page.locator('.proofo-forms').evaluate(el => el.style.setProperty('--field-border', '#ddd3c2'));
      const mutant = await colors(page); assert.throws(() => assertColors(mutant));
  }
  records.push({ check: 'live-border-original-mutant', status: 'killed' });
});

async function reflow(target, selector = 'body') {
  const result = await target.locator(selector).evaluate(scope => {
    const html = document.documentElement;
    const rows = [...scope.querySelectorAll('h1,p,.cab-error-summary,.cab-photo-preview span,.quote__role,.quote__author strong,.pw-author-name,.pw-author-role')]
      .filter(el => el.getClientRects().length).map(el => {
        const style = getComputedStyle(el); return { node: el.id || el.className || el.tagName, width: el.clientWidth, scroll: el.scrollWidth, whiteSpace: style.whiteSpace, overflow: style.overflowX, clamp: style.webkitLineClamp, text: el.textContent };
      });
    const tree = scope.getRootNode();
    let shadow = null;
    if (tree instanceof ShadowRoot) {
      const host = tree.host, box = host.getBoundingClientRect();
      const children = [...tree.children].filter(el => el.getClientRects().length).map(el => el.getBoundingClientRect());
      shadow = { host: { client: host.clientWidth, scroll: host.scrollWidth, left: box.left, right: box.right, width: box.width },
        root: { isShadowRoot: true, renderedChildren: children.length, left: Math.min(...children.map(r => r.left)), right: Math.max(...children.map(r => r.right)) } };
    }
    return { documentWidth: html.clientWidth, documentScroll: html.scrollWidth, rootWidth: scope.clientWidth, rootScroll: scope.scrollWidth, shadow, rows };
  });
  assert.ok(result.documentScroll <= result.documentWidth + 1, 'document overflow');
  assert.ok(result.rootScroll <= result.rootWidth + 1, 'surface overflow');
  if (result.shadow) {
    assert.ok(result.shadow.host.width > 0 && result.shadow.host.client > 0, 'shadow host has real layout width');
    assert.ok(result.shadow.host.scroll <= result.shadow.host.client + 1, 'shadow host overflow');
    assert.ok(result.shadow.root.renderedChildren > 0 && result.shadow.root.isShadowRoot, 'actual ShadowRoot geometry');
    assert.ok(result.shadow.root.left >= result.shadow.host.left - 1 && result.shadow.root.right <= result.shadow.host.right + 1, 'ShadowRoot content within independent host bounds');
  }
  for (const row of result.rows) {
    assert.ok(row.scroll <= row.width + 1, 'content overflow: ' + row.node);
    assert.notEqual(row.whiteSpace, 'nowrap', 'nowrap content: ' + row.node);
    assert.ok(!['hidden', 'clip'].includes(row.overflow), 'clipped content: ' + row.node);
    assert.ok(!row.clamp || row.clamp === 'none', 'line clamp: ' + row.node);
  }
  return result;
}

test('live forms and widget reflow without truncation', async () => {
  const heading = 'З'.repeat(120), name = ' ' + 'Я'.repeat(80) + ' ', role = 'Р'.repeat(120), text = 'Т'.repeat(2000), filename = 'ф'.repeat(251) + '.png';
  await pool.query('UPDATE projects SET branding=branding||$2::jsonb WHERE id=$1', [projectId, JSON.stringify({ heading, logo_url: 'https://logo.example/' + 'x'.repeat(2027) })]);
  const review = (await pool.query("INSERT INTO testimonials(project_id,author_name,author_role,text,status,source,source_platform,source_url) VALUES($1,$2,$3,$4,'approved','platform','yandex_maps',$5) RETURNING id", [projectId, name, role, text, 'https://yandex.ru/maps/?reviews=' + 'x'.repeat(2048 - 'https://yandex.ru/maps/?reviews='.length)])).rows[0].id;
  try {
    for (const theme of ['light', 'dark']) {
      await patch({ theme });
      for (const width of [320, 360, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await editor();
        const logo = 'https://logo.example/' + 'x'.repeat(2027);
        await expect(page.locator('#cab-form-title')).toHaveValue(heading); await expect(page.locator('#cab-logo')).toHaveValue(logo);
        for (const [id, value] of [['cab-form-title', heading], ['cab-logo', logo]]) {
          const input = page.locator('#' + id); await input.focus();
          await page.keyboard.press('End'); assert.equal(await input.evaluate(el => el.selectionStart), value.length);
          await page.keyboard.press('Home'); assert.equal(await input.evaluate(el => el.selectionStart), 0);
          await page.keyboard.press('Shift+End'); assert.deepEqual(await input.evaluate(el => [el.selectionStart, el.selectionEnd]), [0, value.length]);
          await expect(input).toBeInViewport(); await expect(input).toBeFocused(); await expect(input).toHaveValue(value);
          const internal = await input.evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth })); assert.ok(internal.scroll > internal.client, 'long input scrolls internally');
        }
        await page.locator('#cab-form-title').fill('Р'.repeat(119) + 'Е');
        const editorError = 'Ошибка: ' + 'О'.repeat(2048);
        await page.route('**/api/projects/*/branding', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: editorError }) }));
        try {
          await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
          await expect(page.locator('.cab-error-summary')).toHaveText(editorError); await expect(page.locator('.cab-error-summary')).toBeFocused();
          await reflow(page); assertColors(await colors(page));
          await page.locator('#cab-logo').focus(); await expect(page.locator('#cab-logo')).toBeInViewport(); await expect(page.locator('#cab-logo')).toHaveValue(logo);
          await page.getByRole('button', { name: 'Сохранить', exact: true }).focus(); await expect(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeInViewport();
        } finally { await page.unroute('**/api/projects/*/branding'); }
        records.push({ check: 'branding-editor-reflow', width, theme, status: 'passed', headingLength: 120, logoLength: 2048, errorLength: editorError.length });
        await collect(); await draft(page, { name, role, text });
        await page.locator('#cab-photo').setInputFiles({ name: filename, mimeType: 'image/png', buffer: png }); await expect(page.locator('.cab-photo-preview span')).toHaveText(filename);
        await expect(page.locator('h1')).toHaveText(heading); await expect(page.locator('#cab-name')).toHaveValue(name);
        await page.locator('#cab-name').focus(); await page.keyboard.press('End');
        assert.equal(await page.locator('#cab-name').evaluate(el => el.selectionStart), 82);
        await page.keyboard.press('Home'); assert.equal(await page.locator('#cab-name').evaluate(el => el.selectionStart), 0);
        await page.keyboard.press('Shift+End'); assert.deepEqual(await page.locator('#cab-name').evaluate(el => [el.selectionStart, el.selectionEnd]), [0, 82]);
        await expect(page.locator('#cab-name')).toBeInViewport();
        assert.equal(await page.locator('#cab-name').evaluate(el => el.value.length), 82);
        await reflow(page);
        const longError = 'Ошибка: ' + 'Е'.repeat(2048);
        await page.route('**/api/testimonials', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: longError }) }));
        try {
          await page.getByRole('button', { name: 'Отправить отзыв', exact: true }).click();
          await expect(page.locator('.cab-error-summary')).toHaveText(longError); await expect(page.locator('.cab-error-summary')).toBeFocused();
          await reflow(page); assertColors(await colors(page));
        } finally { await page.unroute('**/api/testimonials'); }
        await page.goto(`${base}/w/${slug}`); await expect(page.locator(`[itemprop=reviewBody]`).filter({ hasText: text })).toHaveText(text); await reflow(page);
        await widget(); await expect(page.locator('.pw-text').filter({ hasText: text })).toHaveText(text);
        const geometry = await reflow(page, '.pw-widget');
        records.push({ check: 'widget-three-level-reflow', width, theme, document: { client: geometry.documentWidth, scroll: geometry.documentScroll }, host: geometry.shadow.host, shadowRoot: geometry.shadow.root });
        records.push({ check: 'reflow', width, theme, status: 'passed' });
      }
    }
    await page.locator('.pw-text').filter({ hasText: text }).evaluate(el => { el.style.whiteSpace = 'nowrap'; el.style.overflow = 'hidden'; });
    await assert.rejects(() => reflow(page, '.pw-widget'));
    records.push({ check: 'nowrap-clip-mutant', status: 'killed' });
  } finally { await pool.query('DELETE FROM testimonials WHERE id=$1', [review]); await patch({ logo_url: null }); }
});

test('strict CSP accepts constructed scoped CSS and detects an inline injector', async () => {
  await patch({ theme: 'dark', accent_color: '#FFFFFF' }); await widget();
  await page.goto(`http://widget.synthetic.test:33189/inline-mutant?slug=${slug}`);
  await page.waitForFunction(() => window.__inlineMutationApplied === true);
  await expect.poll(() => page.evaluate(() => window.__hostCspViolations.length)).toBeGreaterThan(0);
  await assert.rejects(() => assertWidgetCsp(page));
  const broken = await page.locator('.pw-card').first().evaluate(el => getComputedStyle(el).paddingTop); assert.notEqual(broken, '16px');
  await widget(); records.push({ check: 'strict-csp-inline-mutant', status: 'killed', violationsOnPositiveHost: 0 });
});

test('public proof preserves source screenshot transcript demo and server badge', async () => {
  const photo = (await pool.query('SELECT photo_url FROM testimonials WHERE project_id=$1 AND photo_url IS NOT NULL LIMIT 1', [projectId])).rows[0].photo_url;
  const payload = '<img src=x onerror="window.__brandingXss=true">' + 'X'.repeat(30);
  const inserted = (await pool.query(`INSERT INTO testimonials(project_id,author_name,text,status,source,source_platform,source_url,screenshot_object_key,video_object_key,transcript,transcript_source)
    VALUES($1,'Proof author',$2,'approved','platform','yandex_maps','https://source.example/original',$3,'synthetic-video','Точная расшифровка','machine') RETURNING id`, [projectId, payload, photo.replace('/api/photo/', '')])).rows[0].id;
  const demo = (await pool.query("INSERT INTO testimonials(project_id,author_name,text,status,source) VALUES($1,'Demo','Синтетическая демонстрация','approved','demo') RETURNING id", [projectId])).rows[0].id;
  try {
    const before = await (await context.request.get(`${base}/api/widget/config?slug=${slug}`)).json();
    await patch({ show_platform_labels: false });
    const after = await (await context.request.get(`${base}/api/widget/config?slug=${slug}`)).json();
    assert.deepEqual(before.testimonials.find(row => row.id === inserted), after.testimonials.find(row => row.id === inserted));
    assert.equal(after.badge_required, true);
    for (const theme of ['light', 'dark']) {
      await patch({ theme }); await page.goto(`${base}/w/${slug}`);
      await expect(page.locator('.quote__origin')).toContainText('Перенесённый отзыв');
      await expect(page.locator('.quote__origin a')).toHaveAttribute('href', 'https://source.example/original');
      await expect(page.locator('.quote__shot img')).toBeVisible(); await expect(page.getByRole('note')).toContainText('не принадлежат реальным людям');
      await expect(page.locator('.quote__body').filter({ hasText: payload })).toHaveText(payload);
      assert.equal(await page.evaluate(() => Boolean(window.__brandingXss)), false); assertColors(await colors(page));
      await widget(); await expect(page.locator('.pw-origin')).toContainText('Перенесённый отзыв'); await expect(page.locator('.pw-origin')).not.toContainText('Яндекс.Карты');
      await expect(page.locator('.pw-shot')).toBeVisible(); await expect(page.locator('.pw-text').filter({ hasText: payload })).toHaveText(payload);
      await expect(page.locator('.pw-transcript-label')).toHaveText('Машинная расшифровка видео');
      await expect(page.locator('.host-marker')).toHaveCSS('color', 'rgb(255, 0, 255)'); assertColors(await colors(page, '.pw-widget'));
      await page.locator('.pw-badge').evaluate(el => { el.style.setProperty('display', 'none', 'important'); el.hidden = true; });
      await expect(page.locator('.pw-badge')).toBeVisible();
    }
    const install = await pool.query('SELECT domain FROM widget_installs WHERE project_id=$1', [projectId]);
    assert.ok(install.rows.some(row => row.domain === 'widget.synthetic.test')); assert.ok(!install.rows.some(row => row.domain === '127.0.0.1'));
    records.push({ check: 'proof-and-badge', status: 'passed' });
  } finally { await pool.query('DELETE FROM testimonials WHERE id=ANY($1::uuid[])', [[inserted, demo]]); }
});

test('expired owner session refuses branding page read and write', async () => {
  await pool.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE account_id=$1", [accountId]);
  try {
    assert.equal((await context.request.get(`${base}/api/projects/${slug}/branding`)).status(), 401);
    assert.equal((await patch({ theme: 'light' })).status(), 401);
    await page.goto(`${base}/dashboard/${slug}/branding`); assert.equal(new URL(page.url()).pathname, '/login');
  } finally { await login(page); }
});
