import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
const root='/tmp/proofwall-ui-dashboard';
const require=createRequire(root+'/package.json');
const {Pool}=require('pg'); const {hash}=require('@node-rs/argon2');
const {chromium,expect}=createRequire(root+'/tools/visual/package.json')('playwright/test');
const {CHROME}=await import(root+'/scripts/capture-proofo-reference.mjs');
const env=parseEnv(await readFile(root+'/.secrets/dashboard-test.env','utf8'));
const db=new URL(env.DATABASE_URL); assert.equal(db.pathname,'/proofwall_ui_test'); assert.equal(db.hostname,'127.0.0.1');
assert.equal(env.BASE_URL,'http://127.0.0.1:33181');
const base=env.BASE_URL, pool=new Pool({connectionString:env.DATABASE_URL});
const account=randomUUID(),foreign=randomUUID(),p=randomUUID(),q=randomUUID(),inactive=randomUUID(),other=randomUUID();
const prefix='integration-'+randomUUID().slice(0,8),slug=prefix+'-own',email=prefix+'@example.test',password='Synthetic-only-integration-465';
const report={reviewer:'qe-integration',timestamp:new Date().toISOString(),base,privilegeMutations:false,checks:[],styles:[],cleanup:false};
let browser;
function pass(name,detail){report.checks.push({name,passed:true,detail});}
async function styles(page){await page.evaluate(()=>document.fonts.ready);return page.evaluate(()=>{const els=[document.body,document.querySelector('main'),document.querySelector('h1'),document.querySelector('.brand'),document.querySelector('.card'),document.querySelector('.btn')];return els.map(el=>{if(!el)return null;const c=getComputedStyle(el);return Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','color','backgroundColor','backgroundImage','margin','padding','borderRadius','width'].map(k=>[k,c[k]]));});});}
try {
  const passwordHash=await hash(password);
  await pool.query('BEGIN');
  for(const [id,mail] of [[account,email],[foreign,prefix+'-foreign@example.test']])await pool.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)',[id,mail,passwordHash]);
  for(const [id,owner,s,title,deactivated] of [[p,account,slug,'Интеграция — собственная стена',false],[q,account,prefix+'-second','Вторая собственная стена',false],[inactive,account,prefix+'-inactive','Скрытая неактивная',true],[other,foreign,prefix+'-foreign','Чужая приватная стена',false]]){
    await pool.query('INSERT INTO projects(id,account_id,slug,branding,deactivated) VALUES($1,$2,$3,$4,$5)',[id,owner,s,{name:title},deactivated]);
    for(const status of ['pending','approved','rejected','hidden'])await pool.query("INSERT INTO testimonials(project_id,author_name,text,status,created_at) VALUES($1,'Синтетический автор','Синтетический отзыв',$2,'2020-01-01')",[id,status]);
    await pool.query("INSERT INTO analytics_events(project_id,event_type,created_at) VALUES($1,'badge_click',now()-interval '1 day')",[id]);
    await pool.query("INSERT INTO widget_installs(project_id,domain,last_seen_at) VALUES($1,'integration.example.test',now()-interval '1 day')",[id]);
  }
  await pool.query('COMMIT');
  browser=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:900},locale:'ru-RU',timezoneId:'UTC',deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce'});
  const blocked=[];await context.route('**/*',route=>{const url=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(url.hostname))return route.continue();blocked.push(url.origin);return route.abort();});
  const page=await context.newPage();
  await page.goto(base+'/dashboard?fixture=1&accountId='+foreign);
  assert.equal(new URL(page.url()).pathname,'/login');assert.equal(new URL(page.url()).searchParams.get('next'),'/dashboard');
  pass('No-session and query override','Anonymous request redirects to /login?next=/dashboard; no summary rendered.');
  await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Пароль',{exact:true}).fill(password);await page.getByRole('button',{name:'Войти',exact:true}).click();await page.waitForURL(base+'/dashboard');
  await expect(page.locator('.cab-wall-card')).toHaveCount(2);assert.deepEqual(await page.locator('.cab-metrics b').allTextContents(),['—','—','2','2']);
  await expect(page.locator('.cab-card-bottom').first()).toContainText('Всего отзывов: 4 · На проверке: 1');await expect(page.locator('body')).not.toContainText('Чужая приватная стена');await expect(page.locator('body')).not.toContainText('Скрытая неактивная');
  pass('Ordinary login → SSR → actual DB','2 own active projects, all-time 4/1, unknown metrics —/—, current 2/2; foreign/inactive absent.');
  const css=await readFile(root+'/apps/web/src/app/dashboard/dashboard.css','utf8');
  for(const [width,height]of [[1440,900],[390,844],[360,800]]){
    await page.setViewportSize({width,height});await page.goto(base+'/dashboard');
    await page.locator('.cab-wall-card[href="/dashboard/'+slug+'"]').click();await page.waitForURL(base+'/dashboard/'+slug);
    await expect(page.getByRole('link',{name:'Подтвердить email или запросить новое письмо'})).toBeVisible();
    await expect(page.locator('pre.snippet')).toContainText('script');assert.equal(await page.locator('.proofo-dashboard').count(),0);
    const before=await styles(page);const injected=await page.addStyleTag({content:css});const retained=await styles(page);assert.deepEqual(before,retained);await injected.evaluate(e=>e.remove());
    report.styles.push({width,height,projectRouteStylesUnaffected:true,before,withDashboardStyles:retained});
  }
  pass('Scoped CSS + real project navigation','At 1440/390/360, card opens actual project; project computed body/main/h1/brand/card/button styles unchanged even with dashboard stylesheet present.');
  await page.goto(base+'/dashboard/'+slug+'?email_delivery=not_configured');await expect(page.getByRole('status')).toContainText('Отправка писем пока не настроена');
  await page.getByRole('link',{name:'Подтвердить email или запросить новое письмо'}).click();await page.waitForURL(base+'/verify-email');await expect(page.locator('body')).toContainText(email);
  pass('Email delivery/recovery','Actual project not_configured notice is visible; recovery link opens /verify-email for current account, no mail submitted.');
  for(const path of ['/f/'+slug,'/w/'+slug]){const response=await page.goto(base+path);assert.equal(response.status(),200);}
  pass('Public links','Owned project collection form and wall both resolve HTTP 200.');
  const foreignResponse=await page.goto(base+'/dashboard/'+prefix+'-foreign');assert.equal(foreignResponse.status(),404);await expect(page.locator('body')).not.toContainText('Чужая приватная стена');
  pass('Foreign project refusal','Authenticated cross-account project URL returns HTTP 404 without title.');
  for(const path of ['/dashboard.html','/__test/dashboard','/dashboard/dashboard.html']){const r=await page.goto(base+path);assert.equal(r.status(),404);}
  pass('Fixture is not a Next route','/dashboard.html, /__test/dashboard and /dashboard/dashboard.html return HTTP 404.');
  await pool.query("UPDATE projects SET branding=$2,tier='paid',paid_until=now()+interval '1 day' WHERE id=$1",[p,{name:'Обновлено из БД'}]);await page.goto(base+'/dashboard');await expect(page.locator('.cab-subscription')).toContainText('Бесплатных: 1 · Платных: 1');await expect(page.locator('.cab-wall-card[href="/dashboard/'+slug+'"]')).toContainText('Обновлено из БД');
  pass('Read after own DB update','Fresh HTTP overview reflects changed stored title and effective paid state.');
  await pool.query('UPDATE sessions SET revoked_at=now() WHERE account_id=$1',[account]);await page.goto(base+'/dashboard');assert.equal(new URL(page.url()).pathname,'/login');await expect(page.locator('.cab-wall-card')).toHaveCount(0);
  pass('Revoked real session','Revocation of own issued session redirects to login and renders no cards.');
  await pool.query("UPDATE sessions SET revoked_at=NULL,expires_at=now()-interval '1 minute' WHERE account_id=$1",[account]);await page.goto(base+'/dashboard');assert.equal(new URL(page.url()).pathname,'/login');
  pass('Expired real session','Expired own issued session redirects to login.');
  assert.deepEqual(blocked,[]);pass('External service boundary','No external browser requests were attempted in the exercised flow.');
}catch(error){report.failure={name:error.name,message:error.message};process.exitCode=1;}
finally{await browser?.close();await pool.query('ROLLBACK');await pool.query('DELETE FROM accounts WHERE id=ANY($1::uuid[])',[[account,foreign]]);await pool.end();report.cleanup=true;await writeFile(root+'/features/proofo-ui/evidence/qe-integration-http.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks.length,cleanup:report.cleanup,failure:report.failure??null}));}
