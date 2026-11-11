import { withAccount } from '@proofwall/db';
import { isPaid } from './tariff';
import type { DashboardOverviewModel } from '../app/dashboard/dashboard-overview';

interface Row {
  slug: string; branding: { name?: unknown }; tier: string; paid_until: Date | string | null;
  total: string; pending: string; clicks: string; domains: string;
}

function count(value: string): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('Недопустимое значение счётчика');
  return result;
}

export async function getDashboardSummary(accountId: string, now = new Date()): Promise<DashboardOverviewModel> {
  const end = new Date(now.getTime());
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const rows = await withAccount(accountId, async client => (await client.query<Row>(`
    WITH owned AS MATERIALIZED (
      SELECT id, slug, branding, tier, paid_until, created_at
      FROM projects WHERE account_id = $1 AND deactivated = false
    ), reviews AS (
      SELECT t.project_id, count(*) AS total, count(*) FILTER (WHERE t.status = 'pending') AS pending
      FROM testimonials t JOIN owned p ON p.id = t.project_id GROUP BY t.project_id
    ), clicks AS (
      SELECT count(*) AS total FROM analytics_events e JOIN owned p ON p.id = e.project_id
      WHERE e.event_type = 'badge_click' AND e.created_at >= $2 AND e.created_at < $3
    ), domains AS (
      SELECT count(*) AS total FROM widget_installs w JOIN owned p ON p.id = w.project_id
      WHERE w.last_seen_at >= $2 AND w.last_seen_at < $3
    )
    SELECT p.slug, p.branding, p.tier, p.paid_until,
      coalesce(r.total, 0)::text AS total, coalesce(r.pending, 0)::text AS pending,
      c.total::text AS clicks, d.total::text AS domains
    FROM owned p LEFT JOIN reviews r ON r.project_id = p.id CROSS JOIN clicks c CROSS JOIN domains d
    ORDER BY p.created_at, p.id
  `, [accountId, start, end])).rows);
  const projects = rows.map(row => ({
    slug: row.slug,
    name: typeof row.branding?.name === 'string' && row.branding.name.trim() ? row.branding.name : row.slug,
    href: `/dashboard/${encodeURIComponent(row.slug)}`,
    tier: isPaid(row.tier, row.paid_until, end) ? 'paid' as const : 'free' as const,
    reviewSummary: `Всего отзывов: ${count(row.total)} · На проверке: ${count(row.pending)}`,
    activitySummary: 'Открытия: — · Нет данных',
  }));
  const paid = rows.filter(row => isPaid(row.tier, row.paid_until, end)).length;
  const free = projects.length - paid;
  const billingHref = projects[0]?.href ?? '/';
  return {
    wallCount: `Стен: ${projects.length}`,
    billing: {
      label: projects.length === 0 ? 'Нет активных стен' : paid === 0 ? 'Бесплатный' : free === 0 ? 'Платный' : 'Разные тарифы',
      title: 'Тарифы ваших стен', description: `Бесплатных: ${free} · Платных: ${paid}`,
      detail: 'На бесплатной стене показывается Powered by Proofwall. Тариф каждой стены доступен в её кабинете.',
      href: billingHref, action: projects.length ? 'Управление тарифом →' : 'На главную →',
    },
    metrics: [
      { label: 'Открытия стен', value: null }, { label: 'Показы виджета', value: null },
      { label: 'Домены с активностью виджета', value: rows.length ? count(rows[0]!.domains) : 0 },
      { label: 'Переходы по badge', value: rows.length ? count(rows[0]!.clicks) : 0 },
    ],
    metricsNote: 'За 30 дней по обращениям к виджету; один домен с двумя стенами считается дважды. Историческая полнота событий не гарантируется.',
    projects,
  };
}
