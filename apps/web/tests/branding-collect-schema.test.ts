import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, chmodSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const runnerPath = '../../../scripts/run-branding-collect-preview.mjs';

describe('branding isolated QA', () => {
  it('branding QA runner refuses unsafe configuration', async () => {
    const { assertBrandingCollectQaConfig, buildBrandingCollectQaEnv } = await import(runnerPath);
    const valid = {
      DATABASE_URL: 'postgres://proofwall_ui_test:proofwall-ui-test-db-only@127.0.0.1:33186/proofwall_ui_test',
      BASE_URL: 'http://127.0.0.1:33187',
      S3_ENDPOINT: 'http://127.0.0.1:33188',
      S3_ACCESS_KEY: 'proofwall-ui-test-access',
      S3_SECRET_KEY: 'proofwall-ui-test-secret-only',
      S3_PHOTO_BUCKET: 'proofwall-ui-test-photos',
      S3_REGION: 'us-east-1',
      S3_FORCE_PATH_STYLE: 'true',
      SESSION_SECRET: 'proofwall-branding-test-session-only-32-characters',
    };
    expect(() => assertBrandingCollectQaConfig(valid)).not.toThrow();
    for (const invalid of [
      { DATABASE_URL: 'postgres://qa:qa@database.example/proofwall_ui_test' },
      { DATABASE_URL: valid.DATABASE_URL.replace(/\/proofwall_ui_test$/, '/proofwall') },
      { DATABASE_URL: valid.DATABASE_URL.replace(':33186', ':33182') },
      { BASE_URL: 'https://127.0.0.1:33187' },
      { BASE_URL: 'http://127.0.0.1:33183' },
      { BASE_URL: 'http://127.0.0.1:33187/seed' },
      { S3_ENDPOINT: 'http://storage.example:33188' },
      { S3_ENDPOINT: 'http://127.0.0.1:33188/proxy' },
      { S3_ENDPOINT: 'http://127.0.0.1:33187' },
      { S3_ACCESS_KEY: 'external-key-sentinel' },
      { S3_SECRET_KEY: 'external-secret-sentinel' },
      { S3_PHOTO_BUCKET: 'other-bucket' },
      { S3_FORCE_PATH_STYLE: 'false' },
      { RESEND_API_KEY: 'must-not-enter-child' },
      { NODE_OPTIONS: '--require unsafe' },
    ]) expect(() => assertBrandingCollectQaConfig({ ...valid, ...invalid })).toThrow();
    const testEnv = buildBrandingCollectQaEnv(valid, 'test');
    expect(testEnv.S3_ENDPOINT).toBeUndefined();
    expect(testEnv.VIDEO_INTAKE_ENABLED).toBe('false');
    expect(testEnv.TEST_DATABASE_URL).toBe(valid.DATABASE_URL);
    const e2eEnv = buildBrandingCollectQaEnv(valid, 'e2e');
    expect(e2eEnv.S3_ENDPOINT).toBe(valid.S3_ENDPOINT);
    expect(e2eEnv.AWS_PROFILE).toBeUndefined();
    expect(e2eEnv.NODE_OPTIONS).toBeUndefined();
    const temp = mkdtempSync(resolve(tmpdir(), 'branding-runner-'));
    try {
      mkdirSync(resolve(temp, 'scripts'));
      mkdirSync(resolve(temp, '.secrets'), { mode: 0o700 });
      const entry = resolve(temp, 'scripts/run-branding-collect-preview.mjs');
      writeFileSync(entry, readFileSync(resolve(__dirname, runnerPath), 'utf8'));
      const marker = resolve(temp, 'spawned');
      const preload = resolve(temp, 'observe.mjs');
      writeFileSync(preload, `import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';import {writeFileSync} from 'node:fs';cp.spawn=()=>{writeFileSync(${JSON.stringify(marker)},'observed');throw new Error('observed spawn')};syncBuiltinESMExports();`);
      const file = resolve(temp, '.secrets/branding-collect-test.env');
      const write = (cfg: typeof valid) => { writeFileSync(file, Object.entries(cfg).map(([key, value]) => key + '=' + JSON.stringify(value)).join('\n'), { mode: 0o600 }); chmodSync(file, 0o600); };
      const invoke = (args: string[]) => spawnSync(process.execPath, ['--import', preload, entry, ...args], { env: { PATH: '/usr/bin:/bin', NODE_ENV: 'test' }, encoding: 'utf8' });
      for (const cfg of [{ ...valid, S3_ENDPOINT: 'https://external.example' }, { ...valid, S3_ACCESS_KEY: 'not-synthetic' }]) {
        write(cfg); const result = invoke(['typecheck']);
        expect(result.status).toBe(1); expect(existsSync(marker)).toBe(false);
        expect(result.stdout + result.stderr).not.toContain(cfg.DATABASE_URL);
        expect(result.stdout + result.stderr).not.toContain(cfg.S3_SECRET_KEY);
      }
      write(valid); chmodSync(file, 0o644);
      expect(invoke(['typecheck']).status).toBe(1); expect(existsSync(marker)).toBe(false);
      chmodSync(file, 0o600);
      expect(invoke(['test', '--update-snapshots']).status).toBe(1); expect(existsSync(marker)).toBe(false);
      rmSync(file); symlinkSync(entry, file);
      expect(invoke(['typecheck']).status).toBe(1); expect(existsSync(marker)).toBe(false);
      rmSync(file); write(valid);
      expect(invoke(['typecheck']).status).toBe(1); expect(existsSync(marker)).toBe(true);
    } finally { rmSync(temp, { recursive: true, force: true }); }
  });

  it('branding schema supports legacy and rollback', async () => {
    const { Client } = await import('pg');
    const url = new URL(process.env.TEST_DATABASE_URL ?? 'invalid:');
    if (url.hostname !== '127.0.0.1' || url.port !== '33186' || url.pathname !== '/proofwall_ui_test') throw new Error('Allocated QA database required');
    const client = new Client({ connectionString: url.toString() });
    await client.connect();
    try {
      const tables = (await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).rows.map(row => row.table_name);
      expect(tables).toEqual(expect.arrayContaining(['projects', 'testimonials', 'email_verification_tokens']));
      const grants = await client.query("SELECT has_table_privilege('app_authenticated','projects','SELECT,UPDATE') AS owner_grants");
      expect(grants.rows[0].owner_grants).toBe(true);
      const account = (await client.query("INSERT INTO accounts(email,password_hash) VALUES(gen_random_uuid()::text||'@example.test','synthetic') RETURNING id")).rows[0].id;
      const temporary = mkdtempSync(resolve(tmpdir(), 'branding-old-reader-'));
      try {
        const project = (await client.query('INSERT INTO projects(account_id,slug,branding) VALUES($1,gen_random_uuid()::text,$2) RETURNING id,slug,branding', [account, { heading: 'Legacy', accent_color: '#123456', logo_url: 'http://old.example/logo', name: 'Keep', unknown: { retained: true } }])).rows[0];
        process.env.DATABASE_URL = url.toString();
        const { patchOwnedBranding } = await import('../src/lib/project-branding.ts' as string);
        const saved = await patchOwnedBranding(account, project.slug, { heading: 'New writer heading', accent_color: '#ABCDEF', logo_url: 'https://logo.example.test/image.png', theme: 'dark', review_order: 'oldest', show_platform_labels: false });
        expect(saved.status).toBe(200);
        // Независимый admin client видит committed данные после настоящего writer.
        const updated = (await client.query('SELECT branding FROM projects WHERE id=$1', [project.id])).rows[0].branding;
        expect(updated).toEqual({ name: 'Keep', unknown: { retained: true }, heading: 'New writer heading', accent_color: '#ABCDEF', logo_url: 'https://logo.example.test/image.png', theme: 'dark', review_order: 'oldest', show_platform_labels: false });
        const commit = '4da1c64b6dcc537a412646183344dcb53645ea02';
        const sourcePath = 'apps/web/src/lib/branding.ts';
        const source = execFileSync('git', ['show', commit + ':' + sourcePath], { cwd: resolve(__dirname, '../../..'), encoding: 'utf8' });
        const { transformSync } = await import('esbuild');
        const compiled = resolve(temporary, 'legacy.cjs');
        writeFileSync(compiled, transformSync(source, { loader: 'ts', format: 'cjs', target: 'node22' }).code, { mode: 0o600 });
        const old = createRequire(import.meta.url)(compiled) as { readBranding: (raw: unknown) => unknown };
        expect(old.readBranding(updated)).toEqual({ heading: 'New writer heading', accent_color: '#ABCDEF', logo_url: 'https://logo.example.test/image.png' });
        expect((await client.query('SELECT branding FROM projects WHERE id=$1', [project.id])).rows[0].branding).toEqual(updated);
        writeFileSync(resolve(__dirname, '../../../.secrets/branding-repair-old-reader-provenance.json'), JSON.stringify({ commit, sourcePath, sourceSha256: createHash('sha256').update(source).digest('hex'), executed: true, currentWriterStatus: saved.status, oldReaderFields: 3, persistedNewSettings: true }, null, 2), { mode: 0o600 });
      } finally { await client.query('DELETE FROM accounts WHERE id=$1', [account]); rmSync(temporary, { recursive: true, force: true }); }
    } finally {
      try { const { closePool } = await import('@proofwall/db'); await closePool(); }
      finally { await client.end(); }
    }
  });
});
