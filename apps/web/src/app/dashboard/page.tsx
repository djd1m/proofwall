import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentAccountId } from '@/lib/current-session';
import { getDashboardSummary } from '@/lib/dashboard-summary';
import { DashboardOverview } from './dashboard-overview';
import './dashboard.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Кабинет — Proofwall', robots: { index: false } };

export default async function DashboardIndex() {
  const accountId = await currentAccountId();
  if (!accountId) redirect('/login?next=/dashboard');
  return <DashboardOverview model={await getDashboardSummary(accountId)} />;
}
