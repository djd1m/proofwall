import { afterAll, beforeEach, expect, it, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
vi.stubGlobal('React', React);
const state = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], account: 'owned', error: false, calls: 0, refresh: vi.fn() }));
vi.mock('@proofwall/db', () => ({ withAccount: async (_id: string, fn: Function) => fn({ query: async () => {
  state.calls++; if (state.error) throw new Error('synthetic storage failure'); return { rows: state.rows };
} }) }));
vi.mock('../src/lib/current-session', () => ({ currentAccountId: async () => state.account || null }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error('redirect:'+url); }, useRouter: () => ({ refresh: state.refresh }) }));
const { getDashboardSummary } = await import('../src/lib/dashboard-summary.ts' as string) as typeof import('../src/lib/dashboard-summary');
const { DashboardOverview } = await import('../src/app/dashboard/dashboard-overview.tsx' as string) as typeof import('../src/app/dashboard/dashboard-overview');
import DashboardIndex from '../src/app/dashboard/page';
const { default: DashboardOverviewError } = await import('../src/app/dashboard/error.tsx' as string) as typeof import('../src/app/dashboard/error');
const now = new Date('2026-11-11T12:00:00Z');
const row = (extra = {}) => ({ slug: 'owned-wall', branding: {}, tier: 'free', paid_until: null, total: '4', pending: '1', clicks: '0', domains: '0', ...extra });
beforeEach(() => { state.rows = []; state.error = false; state.calls = 0; state.account = 'owned'; state.refresh.mockClear(); });
afterAll(() => vi.unstubAllGlobals());
it('uses stored branding name and slug fallback', async () => {
  state.rows = [row({ branding: { name: '<script>alert(1)</script>' } }), row({ slug: 'fallback', branding: { name: '  ' } }), row({ slug: 'numeric', branding: { name: 7 } })];
  const model = await getDashboardSummary('owned', now);
  expect(model.projects.map(p => p.name)).toEqual(['<script>alert(1)</script>', 'fallback', 'numeric']);
  const html = renderToStaticMarkup(React.createElement(DashboardOverview, { model }));
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;'); expect(html).not.toContain('<script>');
  expect(html).toContain('href="/dashboard/fallback"'); expect(html).toContain('Всего отзывов: 4 · На проверке: 1');
});
it('shows unknown metrics without fabricated zero', async () => {
  state.rows = [row()]; const model = await getDashboardSummary('owned', now);
  expect(model.metrics.map(m => m.value)).toEqual([null, null, 0, 0]);
  const html = renderToStaticMarkup(React.createElement(DashboardOverview, { model }));
  expect(html.match(/<b>—<\/b>/g)).toHaveLength(2); expect(html).toContain('Нет данных');
  expect(html).not.toMatch(/990|до 12|Start|Proofo/);
});
it('uses effective paid status at one fixed instant', async () => {
  state.rows = [row({ tier: 'paid', paid_until: '2026-11-12' }), row({ tier: 'paid', paid_until: now }), row({ tier: 'paid', paid_until: 'invalid' }), row({ tier: 'free', paid_until: '2099-01-01' })];
  const model = await getDashboardSummary('owned', now);
  expect(model.projects.map(p => p.tier)).toEqual(['paid', 'free', 'free', 'free']);
  expect(model.billing.label).toBe('Разные тарифы'); expect(model.billing.description).toBe('Бесплатных: 3 · Платных: 1');
});
it('renders zero one and many owned projects without a single-project redirect', async () => {
  for (const n of [0, 1, 3]) {
    state.rows = Array.from({ length: n }, (_, i) => row({ slug: `wall-${i}` }));
    const html = renderToStaticMarkup(await DashboardIndex());
    expect(html.match(/class="cab-wall-card"/g)?.length ?? 0).toBe(n);
    if (!n) { expect(html).toContain('У вас нет активных стен.'); expect(html).toContain('href="/"'); }
  }
  state.account = ''; state.calls = 0;
  await expect(DashboardIndex()).rejects.toThrow('redirect:/login?next=/dashboard'); expect(state.calls).toBe(0);
});
it('returns empty accounts to home without promising wall creation', async () => {
  const model = await getDashboardSummary('owned', now);
  expect(model.projects).toEqual([]);
  expect(model.billing.label).toBe('Нет активных стен');
  expect(model.billing).toMatchObject({ href: '/', action: 'На главную →' });
  const html = renderToStaticMarkup(React.createElement(DashboardOverview, { model }));
  expect(html).toContain('У вас нет активных стен.');
  const navigation = [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gs)]
    .map(([, href, content]) => ({ href, label: content!.replace(/<[^>]*>/g, '') }));
  expect(navigation.filter(link => link.label === 'На главную →')).toEqual([
    { href: '/', label: 'На главную →' },
    { href: '/', label: 'На главную →' },
  ]);
  expect(navigation.some(link => /созда(?:ть|ние).*(?:стен|проект)/i.test(link.label))).toBe(false);
  expect(html).not.toContain('нет ни одной стены');
});
it('propagates storage failures and provides a safe reset control', async () => {
  state.error = true; await expect(DashboardIndex()).rejects.toThrow('synthetic storage failure');
  const reset = vi.fn(); const view = DashboardOverviewError({ error: new Error('private SQL'), reset });
  const html = renderToStaticMarkup(view); expect(html).toContain('Повторить'); expect(html).not.toContain('private SQL');
  const main = React.Children.only(view.props.children) as React.ReactElement<any>;
  const article = React.Children.only(main.props.children) as React.ReactElement<any>;
  const button = React.Children.toArray(article.props.children).find((child: any) => child.type === 'button') as React.ReactElement<any>;
  button.props.onClick(); expect(reset).toHaveBeenCalledOnce(); expect(state.refresh).toHaveBeenCalledOnce();
});
it('fixture uses the production dashboard view without a route override', () => {
  // Дополнительная проверка границы к реальному HTTP auth/visual E2E.
  const fixture = readFileSync('tests/dashboard-visual-fixture.test.ts', 'utf8');
  expect(fixture).toContain('React.createElement(DashboardOverview, { model })');
  expect(fixture).toContain('src/app/globals.css'); expect(fixture).toContain('src/app/dashboard/dashboard.css');
  expect(readdirSync('src/app/dashboard')).not.toContain('dashboard.html');
});
