import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { parseEnv } from 'node:util';
import { randomUUID, createHash } from 'node:crypto';
const root='/tmp/proofwall-ui-dashboard';
const require=createRequire(root+'/package.json');
const { Pool }=require('pg');
const { hash }=require('@node-rs/argon2');
const { chromium, expect }=await import(root+'/tools/visual/node_modules/playwright/test.mjs');
const { CHROME }=await import(root+'/scripts/capture-proofo-reference.mjs');
const settings=parseEnv(await readFile(root+'/.secrets/dashboard-test.env','utf8'));
const db=new URL(settings.DATABASE_URL),base=new URL(settings.BASE_URL).origin;
assert.equal(db.pathname,'/proofwall_ui_test'); assert.ok(['127.0.0.1','localhost'].includes(db.hostname));
assert.equal(base,'http://127.0.0.1:33181');
const pool=new Pool({connectionString:settings.DATABASE_URL});
const account=randomUUID(),project=randomUUID(),slug='regression-'+randomUUID().slice(0,8);
const email=slug+'@example.test',password='Synthetic-regression-password-831';
const css=await readFile(root+'/apps/web/src/app/dashboard/dashboard.css','utf8');
const results=[]; let browser;
async function measure(page) {
  await page.evaluate(()=>document.fonts.ready);
  return page.evaluate(()=>['body','h1','h2','p','a','button','input','.brand','.stage','.card'].flatMap(selector=>[...document.querySelectorAll(selector)].slice(0,3).map((e,i)=>{
    const s=getComputedStyle(e),r=e.getBoundingClientRect();
    return {selector,i,styles:Object.fromEntries(['fontFamily','fontSize','lineHeight','fontWeight','color','backgroundColor','backgroundImage','backgroundSize','backgroundPosition','margin','padding','border','boxSizing','display'].map(k=>[k,s[k]])),rect:{width:Math.round(r.width*1000)/1000,height:Math.round(r.height*1000)/1000}};
  })));
}
async function login(page) {
  await page.goto(base+'/login?next=/dashboard');
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Пароль',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Войти',exact:true}).click();
  await page.waitForURL(base+'/dashboard');
  await expect(page.locator('.cab-wall-card')).toHaveCount(1);
}
try {
  await pool.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)',[account,email,await hash(password)]);
  await pool.query('INSERT INTO projects(id,account_id,slug,branding) VALUES($1,$2,$3,$4)',[project,account,slug,{name:'Регрессионная стена'}]);
  browser=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
  const context=await browser.newContext({locale:'ru-RU',timezoneId:'UTC',deviceScaleFactor:1,colorScheme:'light'});
  await context.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
  const page=await context.newPage();
  await login(page);
  assert.equal(new URL(page.url()).pathname,'/dashboard'); results.push({case:'single project remains in overview',passed:true});
  for(const width of [360,390,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(base+'/dashboard');
    await page.locator('.cab-wall-card').click();
    await page.waitForURL(base+'/dashboard/'+slug);
    await expect(page.getByRole('link',{name:'Подтвердить email или запросить новое письмо'})).toBeVisible();
    await expect(page.locator('a[href="'+base+'/f/'+slug+'"]')).toBeVisible();
    await expect(page.locator('a[href="'+base+'/w/'+slug+'"]')).toBeVisible();
    await expect(page.locator('pre.snippet')).toContainText('script');
    await expect(page.getByRole('heading',{name:'Отзывы',exact:true})).toBeVisible();
    assert.equal(await page.locator('.proofo-dashboard').count(),0);
    const before=await measure(page); await page.addStyleTag({content:css});
    assert.deepEqual(await measure(page),before);
    results.push({case:'project page styles unaffected by loaded dashboard CSS; recovery collect wall widget moderation present',width,passed:true});
    await page.goto(base+'/login'); const loginBefore=await measure(page); await page.addStyleTag({content:css});
    assert.deepEqual(await measure(page),loginBefore);
    results.push({case:'login styles unaffected by loaded dashboard CSS',width,passed:true});
  }
  for(const column of ['expires_at','revoked_at']) {
    await login(page);
    await pool.query(column==='expires_at'?'UPDATE sessions SET expires_at=now()-interval \'1 day\' WHERE account_id=$1':'UPDATE sessions SET revoked_at=now() WHERE account_id=$1',[account]);
    await page.goto(base+'/dashboard'); assert.equal(new URL(page.url()).pathname,'/login');
    assert.equal(new URL(page.url()).searchParams.get('next'),'/dashboard');
    assert.equal(await page.locator('.cab-wall-card').count(),0);
    results.push({case:column==='expires_at'?'expired session redirect':'revoked session redirect',passed:true});
  }
  const anon=await browser.newContext(); const anonymous=await anon.newPage();
  for(const path of ['/dashboard?fixture=1&accountId=anything&now=2099-01-01','/dashboard?__test=1&demo=1']) {
    await anonymous.goto(base+path); assert.equal(new URL(anonymous.url()).pathname,'/login');
  }
  for(const path of ['/dashboard.html','/__test/dashboard','/dashboard/fixture']) {
    const response=await anon.request.get(base+path,{maxRedirects:0});
    assert.ok([404,307].includes(response.status()));
    assert.ok(!(await response.text()).includes('Тихий берег · демо'));
  }
  results.push({case:'anonymous query and public fixture probes do not reveal fixture or owned data',passed:true});
  for(const font of ['body.woff2','display.woff2']) {
    const response=await anon.request.get(base+'/proofo/'+font); assert.equal(response.status(),200);
    const remote=await response.body(),local=await readFile(root+'/apps/web/public/proofo/'+font);
    assert.equal(createHash('sha256').update(remote).digest('hex'),createHash('sha256').update(local).digest('hex'));
  }
  results.push({case:'HTTP fonts equal manifest assets byte for byte',passed:true});
  await anon.close();
} finally {
  await browser?.close();
  await pool.query('DELETE FROM accounts WHERE id=$1',[account]);
  await pool.end();
  await writeFile('/tmp/proofwall-qe-regression-probe.json',JSON.stringify({results},null,2)+'\n');
}
console.log(JSON.stringify({passed:true,checks:results.length,output:'/tmp/proofwall-qe-regression-probe.json'}));
