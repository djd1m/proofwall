// FR-005 — публичная стена. Главное здесь — safeJsonLd: это ЕДИНСТВЕННОЕ место
// приложения, где авторский текст попадает внутрь <script>, и React там не защищает.

import { afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import type { WallItem } from '../src/lib/wall';

const DB_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!DB_URL) throw new Error('TEST_DATABASE_URL не задан');
process.env.DATABASE_URL = DB_URL;
process.env.SESSION_SECRET = 'test-secret-at-least-16-chars-long';
process.env.BASE_URL = 'https://proofwall.test';

const { withService, withAccount, closePool } = await import('@proofwall/db');
const { registerAccountAndProject } = await import('../src/lib/register');
const { submitTextTestimonial } = await import('../src/lib/testimonial');
const { applyTransition } = await import('../src/lib/moderation');
// Импорт ДИНАМИЧЕСКИЙ: статический был бы поднят выше присвоения DATABASE_URL,
// и пул в @proofwall/db создался бы без строки подключения (поймано этим же тестом).
const { getApprovedTestimonials, buildReviewJsonLd, safeJsonLd } = await import('../src/lib/wall');

it('platform labels hide names but preserve provenance', async () => {
  const { pool } = await import('@proofwall/db');
  const accountId = randomUUID(), projectId = randomUUID(), slug = 'wall-' + randomUUID().slice(0, 8);
  await pool.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)', [accountId, accountId + '@example.test', 'synthetic']);
  try {
    await pool.query('INSERT INTO projects(id,account_id,slug,branding) VALUES($1,$2,$3,$4)', [projectId, accountId, slug, { show_platform_labels: false, theme: 'dark' }]);
    await pool.query(`INSERT INTO testimonials(project_id,author_name,text,status,source,source_platform,source_url,screenshot_object_key)
      VALUES($1,'Автор','<img src=x onerror=alert(1)>','approved','platform','yandex_maps','https://source.example/review','project-id/shot-id.png')`, [projectId]);
    (globalThis as { React?: typeof React }).React = React;
    const { default: WallPage } = await import('../src/app/w/[slug]/page.tsx' as string);
    const html = renderToStaticMarkup(await WallPage({ params: Promise.resolve({ slug }) }));
    expect(html).toContain('Перенесённый отзыв'); expect(html).toContain('Первоисточник');
    expect(html).not.toContain('Отзыв с Яндекс.Карты');
    expect(html).toContain('https://source.example/review'); expect(html).toContain('/api/photo/project-id/shot-id.png');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;'); expect(html).toContain('data-theme="dark"');
    expect(html).toContain('Proofwall');
  } finally { await pool.query('DELETE FROM accounts WHERE id=$1', [accountId]); }
});

it('wall sorts all approved rows with a stable time and id tie break', async () => {
  const { pool } = await import('@proofwall/db');
  const accountId = randomUUID(), projectId = randomUUID(), slug = 'sort-' + randomUUID().slice(0, 8);
  await pool.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)', [accountId, accountId + '@example.test', 'synthetic']);
  try {
    await pool.query('INSERT INTO projects(id,account_id,slug) VALUES($1,$2,$3)', [projectId, accountId, slug]);
    for (let i = 0; i < 53; i++) await pool.query("INSERT INTO testimonials(project_id,author_name,text,status,created_at) VALUES($1,'Author',$2,'approved','2026-01-01')", [projectId, 'row-' + i]);
    const expected = (await pool.query('SELECT id FROM testimonials WHERE project_id=$1 ORDER BY created_at,id', [projectId])).rows.map(r => r.id);
    expect((await getApprovedTestimonials(projectId, 'oldest')).map(r => r.id)).toEqual(expected);
    expect((await getApprovedTestimonials(projectId)).map(r => r.id)).toEqual([...expected].reverse());
  } finally { await pool.query('DELETE FROM accounts WHERE id=$1', [accountId]); }
});

it('wall renders empty demo video and author proof states without changing metadata meaning', async () => {
  const { pool } = await import('@proofwall/db');
  const accountId = randomUUID(), projectId = randomUUID(), slug = 'states-' + randomUUID().slice(0, 8);
  await pool.query('INSERT INTO accounts(id,email,password_hash) VALUES($1,$2,$3)', [accountId, accountId + '@example.test', 'synthetic']);
  (globalThis as { React?: typeof React }).React = React;
  const { default: WallPage, generateMetadata } = await import('../src/app/w/[slug]/page.tsx' as string);
  const params = { params: Promise.resolve({ slug }) };
  try {
    await pool.query('INSERT INTO projects(id,account_id,slug,branding) VALUES($1,$2,$3,$4)', [projectId, accountId, slug, { logo_url: 'https://logo.example/logo.png' }]);
    expect(renderToStaticMarkup(await WallPage(params))).toContain('Пока ни одного одобренного отзыва');
    expect((await generateMetadata(params)).robots).toMatchObject({ index: false });
    await pool.query(`INSERT INTO testimonials(project_id,author_name,author_role,text,status,source,source_platform,screenshot_object_key,photo_url,video_object_key,transcript)
      VALUES($1,'Автор','Роль','Точный текст','approved','platform','yandex_maps','project-id/screenshot.png','/api/photo/project-id/photo.png','synthetic-video','Точная расшифровка')`, [projectId]);
    await pool.query("INSERT INTO testimonials(project_id,author_name,text,status,source,video_object_key) VALUES($1,'','','approved','demo','synthetic-video')", [projectId]);
    const html = renderToStaticMarkup(await WallPage(params));
    expect(html).toContain('не принадлежат реальным людям'); expect(html).toContain('Машинная расшифровка видео');
    expect(html).toContain('видео-отзыв'); expect(html).toContain('Роль'); expect(html).toContain('/api/photo/project-id/photo.png');
    expect(html).toContain('Отзыв с Яндекс.Карты'); expect(html).toContain('2 отзыва');
    await pool.query('UPDATE projects SET noindex=false,branding=branding||$2::jsonb WHERE id=$1', [projectId, JSON.stringify({ show_platform_labels: false, theme: 'dark' })]);
    const hidden = renderToStaticMarkup(await WallPage(params)); expect(hidden).toContain('Перенесённый отзыв'); expect(hidden).not.toContain('Отзыв с Яндекс.Карты');
    expect((await generateMetadata(params)).robots).toBeUndefined();
    const missing = { params: Promise.resolve({ slug: slug + '-missing' }) };
    await expect(WallPage(missing)).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    expect((await generateMetadata(missing)).robots).toMatchObject({ index: false });
  } finally { await pool.query('DELETE FROM accounts WHERE id=$1', [accountId]); }
});

const item = (over: Partial<WallItem> = {}): WallItem => ({
  id: 'id-1',
  author_name: 'Автор',
  author_role: null,
  text: 'обычный текст',
  transcript: null,
  has_video: false,
  source_platform: null,
  source_url: null,
  screenshot_object_key: null,
  source: 'form',
  photo_url: null,
  created_at: '2026-08-26T10:00:00.000Z',
  ...over,
});

afterAll(async () => {
  await closePool();
});

describe('safeJsonLd — выход из <script> невозможен', () => {
  it('ИНВАРИАНТ: в выводе не остаётся ни одной литеральной угловой скобки', () => {
    const payload = '</script><script>alert(1)</script>';
    const out = safeJsonLd(buildReviewJsonLd('acme', 'https://x/w/acme', [item({ text: payload })]));
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).toContain('\\u003c');
  });

  it('JSON.stringify сам по себе НЕ спасает — это и есть причина существования функции', () => {
    const payload = '</script>';
    // Демонстрация проблемы: голая сериализация оставляет тег закрывающимся.
    expect(JSON.stringify({ t: payload })).toContain('</script>');
    expect(safeJsonLd({ t: payload })).not.toContain('</script>');
  });

  it('экранирует & — иначе HTML-сущности внутри JSON интерпретируются парсером', () => {
    expect(safeJsonLd({ t: 'a & b' })).toContain('\\u0026');
    expect(safeJsonLd({ t: 'a & b' })).not.toContain(' & ');
  });

  it('экранирует U+2028/U+2029 — валидны в JSON, но рвут JS-парсер', () => {
    const out = safeJsonLd({ t: 'a b c' });
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
    expect(out).not.toContain(' ');
    expect(out).not.toContain(' ');
  });

  it('результат остаётся ВАЛИДНЫМ JSON и данные не искажены', () => {
    const payload = '</script><img src=x onerror=alert(1)> & "кавычки"   конец';
    const parsed = JSON.parse(safeJsonLd({ t: payload })) as { t: string };
    // Экранирование не должно менять сами данные — иначе поисковик получит мусор.
    expect(parsed.t).toBe(payload);
  });

  it('имя автора экранируется так же, как текст', () => {
    const out = safeJsonLd(
      buildReviewJsonLd('acme', 'https://x/w/acme', [item({ author_name: '</script>злой' })]),
    );
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out)).toBeTruthy();
  });
});

describe('buildReviewJsonLd — разметка schema.org/Review', () => {
  it('строит ItemList с Review внутри и корректными позициями', () => {
    const ld = buildReviewJsonLd('acme', 'https://x/w/acme', [
      item({ id: 'a', text: 'первый' }),
      item({ id: 'b', text: 'второй' }),
    ]) as any;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('ItemList');
    expect(ld.numberOfItems).toBe(2);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[0].item['@type']).toBe('Review');
    expect(ld.itemListElement[0].item.reviewBody).toBe('первый');
  });

  it('роль автора попадает в jobTitle, а её отсутствие не создаёт пустого поля', () => {
    const withRole = buildReviewJsonLd('a', 'u', [item({ author_role: 'CTO' })]) as any;
    const without = buildReviewJsonLd('a', 'u', [item({ author_role: null })]) as any;
    expect(withRole.itemListElement[0].item.author.jobTitle).toBe('CTO');
    expect(without.itemListElement[0].item.author).not.toHaveProperty('jobTitle');
  });

  it('ТРАНСКРИПТ не попадает в reviewBody — это расшифровка речи, а не отзыв автора', () => {
    const ld = buildReviewJsonLd('a', 'u', [
      item({ text: 'подпись автора', transcript: 'расшифровка речи', has_video: true }),
    ]) as any;
    expect(ld.itemListElement[0].item.reviewBody).toBe('подпись автора');
    expect(JSON.stringify(ld)).not.toContain('расшифровка речи');
  });

  it('datePublished — дата без времени', () => {
    const ld = buildReviewJsonLd('a', 'u', [item()]) as any;
    expect(ld.itemListElement[0].item.datePublished).toBe('2026-08-26');
  });
});

describe('getApprovedTestimonials — инвариант «только approved публичен»', () => {
  it('отдаёт только одобренные и только своего проекта', async () => {
    let n = Date.now().toString(36);
    const setup = await withService(async (c: PoolClient) => {
      const own = await registerAccountAndProject(c, {
        email: `wall-${n}@example.com`,
        password: 'password-long-enough',
        desired_slug: `wall-${n}`,
      });
      if (!own.ok) throw new Error('регистрация');
      const other = await registerAccountAndProject(c, {
        email: `wall2-${n}@example.com`,
        password: 'password-long-enough',
        desired_slug: `wall2-${n}`,
      });
      if (!other.ok) throw new Error('регистрация 2');

      const mine: string[] = [];
      for (const t of ['первый отзыв длиннее десяти', 'второй отзыв длиннее десяти']) {
        const s = await submitTextTestimonial(c, own.slug, `ip-${t.length}-${n}`, {
          type: 'text',
          name: 'Автор',
          text: t,
        });
        if (!s.ok) throw new Error('отзыв');
        mine.push(s.publicId);
      }
      // Чужой проект — свой отзыв, тоже будет одобрен.
      const foreign = await submitTextTestimonial(c, other.slug, `ipf-${n}`, {
        type: 'text',
        name: 'Чужой',
        text: 'чужой отзыв длиннее десяти',
      });
      if (!foreign.ok) throw new Error('чужой отзыв');

      const { rows } = await c.query('select id from projects where slug = $1', [own.slug]);
      return { own, other, mine, foreignId: foreign.publicId, projectId: rows[0].id };
    });

    // Ничего не одобрено — стена пуста.
    expect(await getApprovedTestimonials(setup.projectId)).toHaveLength(0);

    // Одобряем ОДИН свой и чужой.
    await withAccount(setup.own.accountId, (c) =>
      applyTransition(c, setup.mine[0]!, 'pending', 'approved', setup.own.accountId),
    );
    await withAccount(setup.other.accountId, (c) =>
      applyTransition(c, setup.foreignId, 'pending', 'approved', setup.other.accountId),
    );

    const visible = await getApprovedTestimonials(setup.projectId);
    expect(visible.map((v) => v.id)).toEqual([setup.mine[0]]);
  });

  it('текст отдаётся ПОБАЙТОВО — стена получает то же, что приняла форма', async () => {
    const n = Date.now().toString(36) + 'x';
    const payload = '<script>alert(1)</script> & <b>жирный</b>';
    const setup = await withService(async (c: PoolClient) => {
      const own = await registerAccountAndProject(c, {
        email: `raw-${n}@example.com`,
        password: 'password-long-enough',
        desired_slug: `raw-${n}`,
      });
      if (!own.ok) throw new Error('регистрация');
      const s = await submitTextTestimonial(c, own.slug, `ip-raw-${n}`, {
        type: 'text',
        name: 'Автор',
        text: payload,
      });
      if (!s.ok) throw new Error('отзыв');
      const { rows } = await c.query('select id from projects where slug = $1', [own.slug]);
      return { accountId: own.accountId, id: s.publicId, projectId: rows[0].id };
    });

    await withAccount(setup.accountId, (c) =>
      applyTransition(c, setup.id, 'pending', 'approved', setup.accountId),
    );

    const visible = await getApprovedTestimonials(setup.projectId);
    // Данные не тронуты — безопасной их делает РЕНДЕР, а не хранилище.
    expect(visible[0]!.text).toBe(payload);
    // А в JSON-LD этот же текст уже не может закрыть тег.
    expect(safeJsonLd(buildReviewJsonLd('s', 'u', visible))).not.toContain('<script>');
  });
});


describe('Демонстрационные отзывы помечены — FTC 16 CFR Part 465', () => {
  // Сочинённый отзыв, выданный за настоящий, карается штрафом до $53 088. Пометка живёт
  // в ДАННЫХ (source='demo', миграция 016), а не в слаге проекта: убрали демо-строки —
  // отметка исчезла сама; завели демо в другом проекте — появилась там же.
  const read = (rel: string) =>
    readFileSync(path.resolve(__dirname, '../src', rel), 'utf8');

  it('страница стены показывает отметку, когда среди отзывов есть демо', () => {
    const code = read('app/w/[slug]/page.tsx');
    expect(code).toMatch(/items\.some\(\(t\) => t\.source === 'demo'\)/);
    expect(code).toMatch(/не принадлежат реальным людям/);
  });

  it('запрос стены отдаёт source — иначе отметить нечем', () => {
    expect(read('lib/wall.ts')).toMatch(/select id, author_name, author_role, text, transcript, photo_url, source/);
  });

  it('схема допускает demo как отдельный источник, а не подменяет им form', async () => {
    const { rows } = await withService((c) => c.query<{ def: string }>(
      "select pg_get_constraintdef(oid) as def from pg_constraint where conname='testimonials_source_check'"));
    expect(rows[0]?.def).toContain("'demo'");
    expect(rows[0]?.def).toContain("'form'");
  });
});
