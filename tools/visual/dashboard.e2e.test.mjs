// Локальный production Next + isolated PG. Обычный вход, без HTTP overrides.
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from 'playwright/test';
import { BASELINE, verifyIntegrity, environment, CHROME, serve } from '../../scripts/capture-proofo-reference.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(join(root, 'package.json'));
const { Pool } = require('pg');
const { hash } = require('@node-rs/argon2');
const { PNG } = createRequire(import.meta.url)('pngjs');
const settings = parseEnv(await readFile(join(root, '.secrets/dashboard-test.env'), 'utf8'));
const sessionSecret = process.env.SESSION_SECRET || 'synthetic-dashboard-local-session-secret';
const db = new URL(settings.DATABASE_URL);
const base = settings.BASE_URL;
assert.ok(['127.0.0.1', 'localhost'].includes(db.hostname) && db.pathname === '/proofwall_ui_test', 'Только isolated PG');
assert.equal(new URL(base).origin, 'http://127.0.0.1:33181');
const pool = new Pool({ connectionString: settings.DATABASE_URL });
const account = randomUUID(), foreign = randomUUID(), empty = randomUUID();
const project = randomUUID(), paid = randomUUID(), inactive = randomUUID(), other = randomUUID();
const prefix = 'e2e-'+randomUUID().slice(0,8);
const slug = prefix+'-a', paidSlug = prefix+'-paid', foreignSlug = prefix+'-foreign';
const email = prefix+'@example.test', password = 'Synthetic-local-password-831';
const titles = ['Ж'.repeat(180), 'Первая строка\nВторая строка\nТретья строка', '<img src=x onerror="window.__dashboardXss=true">'];
let browser, context, page, referenceServer, referenceUrl, output;
const measurements = [];

async function login(target, identity = email) {
  await target.goto(base+'/login?next=/dashboard');
  await target.getByLabel('Email', { exact: true }).fill(identity);
  await target.getByLabel('Пароль', { exact: true }).fill(password);
  await target.getByRole('button', { name: 'Войти', exact: true }).click();
  await target.waitForURL(base+'/dashboard');
  await expect(target.locator('h1')).toHaveText('Кабинет');
}

async function ready(target) { await target.evaluate(() => document.fonts.ready); }

async function contract(target) {
  await ready(target);
  return target.evaluate(() => {
    const body = getComputedStyle(document.body), shell = document.querySelector('main.cab-shell');
    const s = getComputedStyle(shell), box = shell.getBoundingClientRect();
    return {
      body: Object.fromEntries(['fontFamily','backgroundColor','backgroundImage','backgroundSize','backgroundPosition'].map(key => [key,body[key]])),
      shell: { x:box.x, y:box.y, width:box.width, padding:s.padding },
    };
  });
}

async function screenshot(target) {
  await ready(target);
  await target.evaluate(() => window.scrollTo(0,0));
  const box = await target.locator('main.cab-shell').boundingBox();
  return target.screenshot({ fullPage:true, clip:{x:box.x,y:box.y,width:Math.ceil(box.width),height:Math.ceil(box.height)} });
}

function differentPixels(expected, actual) {
  const a=PNG.sync.read(expected), b=PNG.sync.read(actual);
  if(a.width!==b.width || a.height!==b.height) return Infinity;
  let count=0;
  for(let i=0;i<a.data.length;i+=4) if(a.data.subarray(i,i+4).some((value,j)=>value!==b.data[i+j])) count++;
  return count;
}

before(async () => {
  output = await mkdtemp(join(tmpdir(),'proofwall-dashboard-e2e-'));
  const passwordHash=await hash(password);
  const client=await pool.connect();
  try {
    await client.query('BEGIN'); await client.query('SET LOCAL ROLE app_service');
    for(const [id,address] of [[account,email],[foreign,prefix+'-foreign@example.test'],[empty,prefix+'-empty@example.test']])
      await client.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)',[id,address,passwordHash]);
    for(const [id,owner,s,name,tier,deactivated] of [[project,account,slug,'Живая стена','free',false],[paid,account,paidSlug,'Платная стена','paid',false],[inactive,account,prefix+'-inactive','Невидимая стена','free',true],[other,foreign,foreignSlug,'Чужая стена','free',false]]) {
      await client.query(`INSERT INTO projects(id,account_id,slug,branding,tier,paid_until,deactivated) VALUES($1,$2,$3,$4,$5,now()+interval '1 day',$6)`,[id,owner,s,{name},tier,deactivated]);
      for(const status of ['pending','approved','rejected','hidden'])
        await client.query(`INSERT INTO testimonials(project_id,author_name,text,status,created_at) VALUES($1,'Синтетический автор','Синтетический отзыв',$2,'2020-01-01')`,[id,status]);
      await client.query(`INSERT INTO analytics_events(project_id,event_type,created_at) VALUES($1,'badge_click',now()-interval '1 day')`,[id]);
      await client.query(`INSERT INTO widget_installs(project_id,domain,last_seen_at) VALUES($1,'synthetic.example.test',now()-interval '1 day')`,[id]);
    }
    await client.query('COMMIT');
  } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  browser=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
  context=await browser.newContext({viewport:{width:1440,height:900},locale:'ru-RU',timezoneId:'UTC',deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce'});
  // Запрещены внешние сервисы, включая mail/storage/payment, даже при ошибке приложения.
  await context.route('**/*',route => ['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  page=await context.newPage();
  await login(page);
  const manifest=await verifyIntegrity();
  const current=await environment();
  for(const key of ['node','platform','arch','osRelease','chromiumSha256']) assert.equal(current[key],manifest.environment[key]);
  const reference=await serve(join(BASELINE,'resources'));
  referenceServer=reference; referenceUrl=reference.url;
});

after(async () => {
  await browser?.close();
  await referenceServer?.close();
  await pool.query('DELETE FROM accounts WHERE id=ANY($1::uuid[])',[[account,foreign,empty]]);
  await pool.end();
  await writeFile(join(output,'measurements.json'),JSON.stringify(measurements,null,2));
  console.log('Browser measurements: '+join(output,'measurements.json'));
});

test('dashboard requires an ordinary session and opens the owned project', async () => {
  const anon=await browser.newContext(); const anonPage=await anon.newPage();
  await anonPage.goto(base+'/dashboard'); assert.equal(new URL(anonPage.url()).pathname,'/login');
  await anon.close();
  await page.goto(base+'/dashboard');
  await expect(page.locator('.cab-wall-card')).toHaveCount(2);
  await expect(page.locator('.cab-summary')).toContainText('Стен: 2');
  await expect(page.locator('.cab-subscription')).toContainText('Бесплатных: 1 · Платных: 1');
  await expect(page.locator('.cab-card-bottom').first()).toContainText('Всего отзывов: 4 · На проверке: 1');
  assert.deepEqual(await page.locator('.cab-metrics b').allTextContents(),['—','—','2','2']);
  await page.locator(`.cab-wall-card[href="/dashboard/${slug}"]`).click();
  await page.waitForURL(base+'/dashboard/'+slug);
  await expect(page.getByRole('link',{name:'Подтвердить email или запросить новое письмо'})).toBeVisible();
  await expect(page.locator('pre.snippet')).toContainText('script');
  const response=await page.goto(base+'/dashboard/'+foreignSlug);
  assert.equal(response.status(),404);
  await expect(page.locator('body')).not.toContainText('Чужая стена');
  await page.goto(base+'/dashboard');
  await pool.query(`UPDATE projects SET tier='paid',paid_until=now()-interval '1 day',branding='{}'::jsonb WHERE id=$1`,[paid]);
  await page.reload(); await expect(page.locator('.cab-subscription')).toContainText('Бесплатных: 2 · Платных: 0');
  await expect(page.locator(`.cab-wall-card[href="/dashboard/${paidSlug}"] h3`)).toContainText(paidSlug);
  await pool.query(`UPDATE projects SET tier='paid',paid_until=now()+interval '1 day' WHERE id=$1`,[paid]);
});

test('zero and single project accounts stay in overview', async () => {
  const emptyContext=await browser.newContext(); const emptyPage=await emptyContext.newPage();
  try {
    await login(emptyPage,prefix+'-empty@example.test');
    await expect(emptyPage.getByText('У вас нет активных стен.')).toBeVisible();
    await expect(emptyPage.locator('.cab-empty').getByRole('link',{name:'На главную →'})).toHaveAttribute('href','/');
    await expect(emptyPage.getByRole('link',{name:'Создать стену →'})).toHaveCount(0);
  } finally { await emptyContext.close(); }
  try {
    await pool.query('UPDATE projects SET deactivated=true WHERE id=$1',[paid]);
    await page.goto(base+'/dashboard'); await expect(page.locator('.cab-wall-card')).toHaveCount(1);
    assert.equal(new URL(page.url()).pathname,'/dashboard');
  } finally { await pool.query('UPDATE projects SET deactivated=false WHERE id=$1',[paid]); }
});

test('summary permission failure recovers through retry after valid login', async () => {
  await page.goto(base+'/dashboard');
  await expect(page.locator('.cab-wall-card')).toHaveCount(2);
  try {
    await pool.query('REVOKE SELECT ON analytics_events FROM app_authenticated');
    await page.reload();
    await expect(page.locator('.proofo-dashboard [role=alert]')).toContainText('Не удалось загрузить кабинет');
    await expect(page.locator('.cab-wall-card')).toHaveCount(0);
    // Service session store остаётся доступным; lookup именно текущей session hash.
    const cookies=await context.cookies(); const token=cookies.find(c=>c.name==='pw_session')?.value;
    assert.ok(token,'Обычный session cookie должен существовать');
    const { createHmac }=await import('node:crypto');
    const tokenHash=createHmac('sha256',sessionSecret).update(token).digest('hex');
    const client=await pool.connect();
    try {
      await client.query('BEGIN'); await client.query('SET LOCAL ROLE app_service');
      const result=await client.query('SELECT account_id FROM sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()',[tokenHash]);
      assert.equal(result.rows[0]?.account_id,account); await client.query('COMMIT');
    } finally { await client.query('ROLLBACK'); client.release(); }
  } finally { await pool.query('GRANT SELECT ON analytics_events TO app_authenticated'); }
  await page.getByRole('button',{name:'Повторить',exact:true}).click();
  await expect(page.locator('.cab-wall-card')).toHaveCount(2);
  await expect(page.locator('.proofo-dashboard [role=alert]')).toHaveCount(0);
});

test('session store failure does not render owned data', async () => {
  try {
    await pool.query('REVOKE SELECT ON sessions FROM app_service');
    await page.reload(); await expect(page.locator('.proofo-dashboard [role=alert]')).toContainText('Не удалось загрузить кабинет');
    await expect(page.locator('.cab-wall-card')).toHaveCount(0);
  } finally { await pool.query('GRANT SELECT ON sessions TO app_service'); }
  await page.getByRole('button',{name:'Повторить',exact:true}).click(); await expect(page.locator('.cab-wall-card')).toHaveCount(2);
});

test('live dashboard and fixture share body styles and shell geometry', async () => {
  const fixture=await context.newPage(), reference=await context.newPage();
  try {
    for(const [width,height] of [[1440,900],[390,844],[360,800]]) {
      for(const target of [page,fixture,reference]) await target.setViewportSize({width,height});
      await page.goto(base+'/dashboard'); await fixture.goto('http://127.0.0.1:33182/dashboard.html');
      await reference.goto(referenceUrl+'/?screen=dashboard&clean=1');
      await reference.evaluate(()=>{for(const selector of ['.cab-notice','#preview-tools']) document.querySelector(selector)?.style.setProperty('display','none','important');});
      const live=await contract(page), frozen=await contract(fixture), canonical=await contract(reference);
      assert.deepEqual(live,frozen); assert.deepEqual(frozen,canonical);
      measurements.push({case:'style contract',width,contract:live});
    }
  } finally { await fixture.close(); await reference.close(); }
});

test('frozen fixture has zero changed pixels and detects font margin color mutations', async () => {
  const fixture=await context.newPage();
  try {
    for(const [width,height] of [[1440,900],[390,844],[360,800]]) {
      await fixture.setViewportSize({width,height}); await fixture.goto('http://127.0.0.1:33182/dashboard.html');
      const expected=await readFile(join(BASELINE,'dashboard',`${width}x${height}.png`));
      const actual=await screenshot(fixture); await writeFile(join(output,`${width}.png`),actual);
      assert.equal(differentPixels(expected,actual),0);
      for(const [mutation,rule] of Object.entries({font:'font-family:monospace!important',margin:'margin-left:3px!important',color:'color:#0077cc!important'})) {
        const style=await fixture.addStyleTag({content:'.cab-shell .cab-paper h1{'+rule+'}'});
        assert.ok(differentPixels(expected,await screenshot(fixture))>0,mutation+' должна менять пиксели'); await style.evaluate(e=>e.remove());
      }
      assert.equal(differentPixels(expected,await screenshot(fixture)),0);
      measurements.push({case:'exact visual and three mutations',width,changedPixels:0,mutationsRejected:3});
    }
  } finally { await fixture.close(); }
});

test('long Unicode titles remain visible and keyboard reachable on every viewport', async () => {
  for(const [width,height] of [[360,800],[390,844],[1440,900]]) {
    await page.setViewportSize({width,height});
    for(const name of titles) {
      await pool.query('UPDATE projects SET branding=$2 WHERE id=$1',[project,{name}]);
      await page.goto(base+'/dashboard'); await ready(page);
      const card=page.locator(`.cab-wall-card[href="/dashboard/${slug}"]`);
      await expect(card.locator('h3')).toContainText(name.replace(/\s+/g,' '));
      await expect(card).toHaveAccessibleName(new RegExp(name.startsWith('<img')?'img src':name.startsWith('Ж')?'Ж{10}':'Первая строка'));
      assert.equal(await page.evaluate(()=>window.__dashboardXss),undefined);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      const clipping=await card.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight}));
      assert.ok(clipping.scroll<=clipping.width && clipping.scrollHeight<=clipping.height);
      await page.locator('body').click({position:{x:1,y:1}});
      let reached=false;
      for(let i=0;i<20;i++) { await page.keyboard.press('Tab'); if(await card.evaluate(e=>e===document.activeElement)) { reached=true; break; } }
      assert.ok(reached,'Tab должен достичь карточки');
      const outline=await card.evaluate(e=>({style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth}));
      assert.notEqual(outline.style,'none'); assert.notEqual(outline.width,'0px');
      await page.keyboard.press('Enter'); await page.waitForURL(base+'/dashboard/'+slug);
      await expect(page.getByRole('link',{name:'Подтвердить email или запросить новое письмо'})).toBeVisible();
      measurements.push({case:'long title keyboard overflow',width,titleKind:titles.indexOf(name),overflow:false,keyboardNavigated:true});
    }
  }
});
