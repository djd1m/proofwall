// Локальный synthetic browser smoke, без mail-сети и пользовательского profile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const [origin, modulePath, executablePath, outputDir] = process.argv.slice(2);
  if (!origin || !modulePath || !executablePath || !outputDir ||
      !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) {
    throw new Error('Usage: <local-origin> <puppeteer-core-module-path> <chrome-binary> <output-dir>');
  }
  fs.mkdirSync(outputDir, { recursive: true });
  const puppeteer = require(path.resolve(modulePath));
  const browser = await puppeteer.launch({ executablePath, headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'] });
  const results = [];
  try {
    const page = await browser.newPage();
    const writes = []; const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setRequestInterception(true);
    let responseMode = 'success';
    page.on('request', r => {
      const u = new URL(r.url());
      if (u.origin === origin && u.pathname.startsWith('/api/auth/')) {
        writes.push({ pathname: u.pathname, method: r.method(), body: JSON.parse(r.postData() || '{}') });
        return r.respond({ status: responseMode === 'success' ? 200 : 401,
          contentType: 'application/json', body: JSON.stringify(responseMode === 'success' ? { verified: true } : { error: 'войдите в аккаунт' }) });
      }
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        if (u.origin !== origin) return r.abort();
      }
      return r.continue();
    });
    for (const width of [1200, 390]) {
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
      writes.length = 0;
      await page.goto(`${origin}/verify-email#token=${'v'.repeat(43)}`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => !location.hash);
      assert.equal(writes.length, 0, 'GET must not consume token');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'horizontal overflow');
      const confirm = (await page.$$('button'))[0];
      assert(confirm, 'confirm button exists');
      await page.screenshot({ path: path.join(outputDir, `verify-${width}.png`), fullPage: true });
      await confirm.focus(); await page.keyboard.press('Enter');
      await page.waitForSelector('[role=status]');
      assert.equal(writes.length, 1); assert.equal(writes[0].method, 'POST');
      assert.equal(writes[0].pathname, '/api/auth/verify-email');
      assert.deepEqual(writes[0].body, { token: 'v'.repeat(43) });
      assert.match(await page.$eval('[role=status]', e => e.textContent), /подтверждён/);
      results.push({ width, explicitPost: true, fragmentRemoved: true, noGetMutation: true });
    }
    writes.length = 0; responseMode = 'success';
    await page.goto(`${origin}/verify-email`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[role=alert]');
    assert.match(await page.$eval('body', e => e.innerText), /email аккаунта, в который вы сейчас вошли/);
    await page.click('button'); await page.waitForSelector('[role=status]');
    assert.match(await page.$eval('[role=status]', e => e.textContent), /текущего аккаунта уже подтверждён/);
    assert.deepEqual(writes[0].body, { expected_email: null });
    writes.length = 0; responseMode = 'unauthorized';
    await page.goto(`${origin}/verify-email`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[role=alert]'); assert.equal(writes.length, 0);
    await page.click('button'); await page.waitForSelector('a[href*="/login"]');
    assert.equal(writes[0].pathname, '/api/auth/resend-verification');
    const preview = pathToFileURL(path.resolve('docs/preview/resend-onboarding.html')).href;
    for (const width of [1200, 390]) {
      await page.setViewport({ width, height: 1100 }); await page.goto(preview, { waitUntil: 'load' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const links = await page.$$eval('a', nodes => nodes.map(n => n.href));
      assert(links.some(u => u.endsWith('/w/acme-reviews'))); assert(links.some(u => u.endsWith('/f/acme-reviews')));
      await page.screenshot({ path: path.join(outputDir, `email-${width}.png`), fullPage: true });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(outputDir, 'browser-smoke.json'), JSON.stringify({ mode: 'synthetic mocked API UI smoke', results, errors }, null, 2) + '\n');
    console.log('Synthetic email/verification browser smoke passed');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
