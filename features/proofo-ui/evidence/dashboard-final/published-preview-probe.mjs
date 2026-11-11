// Обычный HTTPS login синтетического preview-аккаунта; значения доступа не выводятся.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const root = process.cwd(), require = createRequire(resolve(root, 'package.json'));
const { chromium, expect } = require(resolve(root, 'tools/visual/node_modules/playwright/test'));
const access = parseEnv(readFileSync('/home/proofwall/.secrets/ui-preview-access.env', 'utf8'));
const base = 'https://ui-proofwall.78.17.53.233.sslip.io';
assert.equal(new URL(access.URL).origin, base);
const evidence = resolve(root, 'features/proofo-ui/evidence/dashboard-final');
const observations = [];
const browser = await chromium.launch({ executablePath: '/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome', args: ['--no-sandbox'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ru-RU', timezoneId: 'UTC', deviceScaleFactor: 1, colorScheme: 'light', ignoreHTTPSErrors: false });
  await context.route('**/*', route => new URL(route.request().url()).hostname === new URL(base).hostname ? route.continue() : route.abort());
  const page = await context.newPage();
  const anonymous = await page.goto(base + '/dashboard');
  assert.equal(new URL(page.url()).pathname, '/login');
  const tls = await anonymous.securityDetails();
  await page.getByLabel('Email', { exact: true }).fill(access.EMAIL);
  await page.getByLabel('Пароль', { exact: true }).fill(access.PASSWORD);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL(base + '/dashboard');
  await expect(page.getByRole('heading', { name: 'Кабинет', exact: true })).toBeVisible();
  await expect(page.locator('.cab-wall-card')).toHaveCount(2);
  await expect(page.locator('.cab-subscription')).toContainText('Бесплатных: 1 · Платных: 1');
  assert.deepEqual(await page.locator('.cab-metrics b').allTextContents(), ['—', '—', '2', '2']);
  const cookie = (await context.cookies()).find(c => c.name === 'pw_session');
  assert.ok(cookie?.secure && cookie.httpOnly && cookie.sameSite === 'Lax');
  observations.push({ case: 'ordinary HTTPS login', passed: true, walls: 2, secureCookie: cookie.secure, httpOnlyCookie: cookie.httpOnly, sameSite: cookie.sameSite, tls });
  for (const [width, height] of [[1440, 900], [390, 844], [360, 800]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: resolve(evidence, `published-dashboard-${width}.png`), fullPage: true });
    observations.push({ case: 'published responsive view', width, overflow: false, screenshot: `published-dashboard-${width}.png` });
  }
  const projectHref = await page.locator('.cab-wall-card').first().getAttribute('href');
  await page.locator('.cab-wall-card').first().click();
  await page.waitForURL(base + projectHref);
  await expect(page.locator('pre.snippet')).toContainText(new URL(base).hostname);
  observations.push({ case: 'owned project navigation and actual preview widget URL', passed: true });
  for (const path of ['/dashboard.html', '/__test/dashboard']) {
    const response = await page.goto(base + path);
    assert.equal(response.status(), 404);
    observations.push({ case: 'fixture not exposed', path, status: 404 });
  }
  for (const url of ['https://proofwall.78.17.53.233.sslip.io/', 'https://proofwall.78.17.53.233.sslip.io/__design/proofo/?screen=dashboard']) {
    const response = await fetch(url);
    assert.equal(response.status, 200);
    observations.push({ case: 'existing host preserved', url, status: response.status });
  }
  writeFileSync(resolve(evidence, 'publication.json'), JSON.stringify({ status: 'passed', exitCode: 0, command: 'node_modules/.bin/node features/proofo-ui/evidence/dashboard-final/published-preview-probe.mjs', url: base + '/dashboard', syntheticDataOnly: true, observations, limits: ['Dashboard increment; branding/collect still draft', 'No real mail/storage/payment credentials in isolated preview', 'No production DNS/database changes'] }, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'passed', observations: observations.length, url: base + '/dashboard', credentialsPrinted: false }));
} finally { await browser.close(); }
