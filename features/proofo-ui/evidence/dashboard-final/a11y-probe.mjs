// Локальный probe координатора: реальный вход и axe, только isolated QA DB.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { randomUUID, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const root = process.cwd();
const require = createRequire(resolve(root, 'package.json'));
const { Pool } = require('pg');
const { hash } = require('@node-rs/argon2');
const { chromium, expect } = require(resolve(root, 'tools/visual/node_modules/playwright/test'));
const settings = parseEnv(readFileSync(resolve(root, '.secrets/dashboard-test.env'), 'utf8'));
const db = new URL(settings.DATABASE_URL);
assert.equal(db.hostname, '127.0.0.1');
assert.equal(db.pathname, '/proofwall_ui_test');
assert.equal(settings.BASE_URL, 'http://127.0.0.1:33181');
const pool = new Pool({ connectionString: settings.DATABASE_URL });
const account = randomUUID(), email = `axe-${account}@example.test`, password = randomBytes(24).toString('base64url');
const checks = [];
let browser;
try {
  await pool.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)', [account, email, await hash(password)]);
  browser = await chromium.launch({ executablePath: '/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome', args: ['--no-sandbox'] });
  const context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'UTC', deviceScaleFactor: 1, colorScheme: 'light' });
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto(settings.BASE_URL + '/login?next=/dashboard');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL(settings.BASE_URL + '/dashboard');
  for (const state of ['empty', 'populated']) {
    if (state === 'populated') {
      await pool.query('INSERT INTO projects(account_id,slug,branding) VALUES($1,$2,$3)', [account, 'axe-' + account.slice(0, 12), { name: 'Проверка доступности интерфейса' }]);
    }
    for (const [width, height] of [[1440, 900], [390, 844], [360, 800]]) {
      await page.setViewportSize({ width, height });
      await page.goto(settings.BASE_URL + '/dashboard');
      await expect(page.getByRole('heading', { name: 'Кабинет', exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const result = await page.evaluate(async () => await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } }));
      checks.push({ state, width, violations: result.violations, incomplete: result.incomplete, passes: result.passes.map(rule => rule.id) });
    }
  }
} finally {
  await browser?.close();
  await pool.query('DELETE FROM accounts WHERE id=$1', [account]);
  await pool.end();
}
const violations = checks.flatMap(check => check.violations);
writeFileSync(resolve(root, 'features/proofo-ui/evidence/dashboard-final/accessibility-results.json'), JSON.stringify({ scope: 'Automated axe WCAG 2A/2AA/2.1AA, empty and populated live SSR at three widths; incomplete rules need manual evaluation; screen reader acceptance not claimed', checks }, null, 2) + '\n');
console.log(JSON.stringify({ checks: checks.length, violations: violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), incomplete: checks.map(c => ({ state: c.state, width: c.width, rules: c.incomplete.map(r => r.id) })) }));
assert.equal(violations.length, 0, 'Automated accessibility violations remain');
