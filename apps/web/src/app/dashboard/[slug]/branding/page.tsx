import { notFound, redirect } from 'next/navigation';
import { currentAccountId } from '@/lib/current-session';
import { readOwnedBranding } from '@/lib/project-branding';
import { BrandingEditor } from './branding-editor';
import '../../../proofo-forms.css';

export const dynamic = 'force-dynamic';
export default async function BrandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const accountId = await currentAccountId();
  if (!accountId) redirect(`/login?next=/dashboard/${encodeURIComponent(slug)}/branding`);
  const model = await readOwnedBranding(accountId, slug);
  if (!model) notFound();
  return <BrandingEditor slug={model.slug} branding={model.branding} />;
}
