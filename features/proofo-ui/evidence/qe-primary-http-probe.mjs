// Независимая QE-проверка. Только собственные synthetic rows в isolated PG; без GRANT/REVOKE.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const root = process.cwd();
const require = createRequire(resolve(root, 'package.json'));
const visual = createRequire(resolve(root, 'tools/visual/package.json'));
const { chromium } = visual('playwright');
const { Pool } = require('pg');
const { hash } = require('@node-rs/argon2');
const { CHROME } = await import(resolve(root, 'scripts/capture-proofo-reference.mjs'));
const settings = parseEnv(await readFile(resolve(root, '.secrets/dashboard-test.env'), 'utf8'));
const db = new URL(settings.DATABASE_URL);
assert.ok(['127.0.0.1', 'localhost'].includes(db.hostname) && db.pathname === '/proofwall_ui_test');
assert.equal(settings.BASE_URL, 'http://127.0.0.1:33181');
const base = settings.BASE_URL;
const pool = new Pool({ connectionString: settings.DATABASE_URL });
const id = randomUUID(), pid = randomUUID();
const slug = 'qe-primary-' + id.slice(0, 8);
const email = slug + '@example.test', password = 'Synthetic-QE-primary-login-239';
const observations = [];
let browser;
try {
  await pool.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)', [id, email, await hash(password)]);
  await pool.query('INSERT INTO projects(id,account_id,slug,branding) VALUES($1,$2,$3,$4)', [pid, id, slug, { name: 'Ж'.repeat(180) }]);
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'UTC', viewport: { width: 1440, height: 900 } });
  await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const page = await context.newPage();
  for (const suffix of ['/dashboard', '/dashboard?fixture=1&account_id=' + id, '/dashboard.html', '/__test/dashboard']) {
    const response = await page.goto(base + suffix);
    const pathname = new URL(page.url()).pathname;
    if (suffix.startsWith('/dashboard?') || suffix === '/dashboard') {
      assert.equal(pathname, '/login');
      assert.equal(new URL(page.url()).searchParams.get('next'), '/dashboard');
    } else assert.equal(response.status(), 404);
    observations.push({ case: 'anonymous fixture/auth boundary', path: suffix.split('?')[0], status: response.status(), finalPath: pathname });
  }
  const login = async () => {
    await page.goto(base + '/login?next=/dashboard');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Пароль', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await page.waitForURL(base + '/dashboard');
    await page.locator('.cab-wall-card').waitFor();
  };
  await login();
  for (const width of [320, 360, 390, 700, 701, 768, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    const metrics = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth, cardScroll: document.querySelector('.cab-wall-card').scrollWidth, cardWidth: document.querySelector('.cab-wall-card').clientWidth }));
    observations.push({ case: 'live responsive overflow', width, ...metrics });
  }
  for (const state of ['expired', 'revoked']) {
    if (state === 'revoked') await login();
    await pool.query(state === 'expired' ? "UPDATE sessions SET expires_at=now()-interval '1 minute' WHERE account_id=$1" : 'UPDATE sessions SET revoked_at=now() WHERE account_id=$1', [id]);
    await page.goto(base + '/dashboard');
    assert.equal(new URL(page.url()).pathname, '/login');
    assert.equal(new URL(page.url()).searchParams.get('next'), '/dashboard');
    assert.equal(await page.locator('.cab-wall-card').count(), 0);
    observations.push({ case: state + ' ordinary session', finalPath: '/login', next: '/dashboard', cards: 0 });
  }
  await writeFile(resolve(root, 'features/proofo-ui/evidence/qe-primary-http.json'), JSON.stringify({ observations, successful: true }, null, 2) + '\n');
  console.log(JSON.stringify({ successful: true, observations }));
} finally {
  await browser?.close();
  await pool.query('DELETE FROM accounts WHERE id=$1', [id]);
  await pool.end();
}
