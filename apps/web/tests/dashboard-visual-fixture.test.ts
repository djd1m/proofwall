import { expect, it, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { DashboardOverviewModel } from '../src/app/dashboard/dashboard-overview';
const { DashboardOverview } = await import('../src/app/dashboard/dashboard-overview.tsx' as string) as typeof import('../src/app/dashboard/dashboard-overview');
vi.stubGlobal('React', React);

it('renders the frozen literal model through the production view', async () => {
  const model: DashboardOverviewModel = {
    wallCount: '1 стена',
    billing: { label: 'Free · сменить', title: 'Тариф и подписка', description: 'Free · 1 стена · до 12 отзывов',
      detail: 'В виджете остаётся Powered by Proofo. Подписка не подключена, списаний нет.',
      href: '/dashboard/tihiy-bereg-demo', action: 'Перейти на платный →' },
    metrics: ['Открытия стен', 'Показы виджета', 'Сайты с виджетом', 'Переходы по badge'].map(label => ({ label, value: 0 })),
    metricsNote: 'Счётчик начал работать вместе с этой страницей. Исторические значения не восстановлены.',
    projects: [{ name: 'Тихий берег · демо', slug: 'tihiy-bereg-demo', href: '/dashboard/tihiy-bereg-demo',
      reviewSummary: 'Пока пусто', activitySummary: '0 открытий за 30 дней' }],
    secondaryCard: { title: 'Ещё одна стена', description: 'На Free доступна одна стена.', href: '/dashboard/tihiy-bereg-demo',
      action: 'Start — до 10 стен за 990 ₽/мес →', note: 'Создание второй стены не наблюдалось.' },
  };
  const html = renderToStaticMarkup(React.createElement(DashboardOverview, { model }));
  expect(html).toContain('class="proofo-dashboard"');
  expect(html).toContain('Тихий берег · демо');
  const output = process.env.DASHBOARD_FIXTURE_OUTPUT;
  if (!output) return;
  await mkdir(resolve(output, 'proofo'), { recursive: true });
  for (const font of ['body.woff2', 'display.woff2']) await copyFile(resolve('public/proofo', font), resolve(output, 'proofo', font));
  for (const [name, file] of [['globals.css', 'src/app/globals.css'], ['dashboard.css', 'src/app/dashboard/dashboard.css']]) {
    await writeFile(resolve(output, name!), await readFile(resolve(file!)));
  }
  await writeFile(resolve(output, 'dashboard.html'), '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/globals.css"><link rel="stylesheet" href="/dashboard.css"></head><body>'+html+'</body></html>');
});
