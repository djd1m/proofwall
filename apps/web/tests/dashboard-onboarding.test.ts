import { afterAll, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';
// Vitest здесь сохраняет classic JSX, тогда как Next компилирует automatic runtime.
vi.stubGlobal('React', React);
const state = vi.hoisted(() => ({ token: '' }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: state.token }) }) }));
if (!process.env.TEST_DATABASE_URL) throw new Error('Требуется отдельная TEST_DATABASE_URL');
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.SESSION_SECRET = 'synthetic-dashboard-email-secret';
process.env.BASE_URL = 'https://proofwall.example.test';
const { withService, closePool } = await import('@proofwall/db');
const { registerAccountAndProject } = await import('../src/lib/register');
const { default: DashboardPage } = await import('../src/app/dashboard/[slug]/page');
const { default: VerifyEmailPage } = await import('../src/app/verify-email/page');
afterAll(async () => { vi.unstubAllGlobals(); await closePool(); });

it('кабинет показывает отсутствие письма и постоянный recovery link', async () => {
  const slug = `notice-${randomUUID().slice(0, 8)}`;
  const o = await withService(c => registerAccountAndProject(c, { email: `${slug}@example.test`,
    password: 'synthetic-dashboard-password', desired_slug: slug }));
  if (!o.ok) throw new Error('signup failed'); state.token = o.token;
  const markup = renderToStaticMarkup(await DashboardPage({ params: Promise.resolve({ slug }),
    searchParams: Promise.resolve({ email_delivery: 'not_configured' }) }));
  expect(markup).toContain('Отправка писем пока не настроена');
  expect(markup).toContain('href="/verify-email"');
  expect(markup).toContain('для текущего аккаунта');
  const revisit = renderToStaticMarkup(await DashboardPage({ params: Promise.resolve({ slug }) }));
  expect(revisit).toContain('href="/verify-email"'); // Не зависит от первого письма/redirect query.
  expect(revisit).not.toContain('Отправка писем пока не настроена');
});

it('страница подтверждения показывает email сессии и постоянный вход', async () => {
  const slug = `recipient-${randomUUID().slice(0, 8)}`;
  const o = await withService(c => registerAccountAndProject(c, { email: `${slug}@example.test`,
    password: 'synthetic-dashboard-password', desired_slug: slug }));
  if (!o.ok) throw new Error('signup failed'); state.token = o.token;
  // Fragment token аккаунта A сервер не получает; получатель повторного письма — B.
  const markup = renderToStaticMarkup(await VerifyEmailPage());
  // Hydration показывает recipient внутри client form, initial loaded=false не должен
  // скрывать авторитетную identity или постоянный switch link.
  expect(markup).toContain('Войти в другой аккаунт');
  expect(markup).toContain('href="/login?next=%2Fverify-email"');
  expect(markup).toContain(o.email);
  state.token = '';
  const anonymous = renderToStaticMarkup(await VerifyEmailPage());
  expect(anonymous).toContain('Войти в аккаунт'); expect(anonymous).not.toContain(o.email);
});
