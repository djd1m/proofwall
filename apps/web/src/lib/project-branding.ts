import { withAccount } from '@proofwall/db';
import { readBranding, validateBrandingPatch, type ResolvedBranding } from './branding';

export async function readOwnedBranding(accountId: string, slug: string): Promise<{
  slug: string; branding: ResolvedBranding;
} | null> {
  return withAccount(accountId, async client => {
    const { rows } = await client.query<{ slug: string; branding: unknown }>(
      `SELECT slug, branding FROM projects
        WHERE slug = $1 AND account_id = $2 AND deactivated = false`, [slug, accountId],
    );
    return rows[0] ? { slug: rows[0].slug, branding: readBranding(rows[0].branding) } : null;
  });
}

export async function patchOwnedBranding(accountId: string, slug: string, input: unknown): Promise<
  { status: 200; branding: ResolvedBranding } | { status: 400; errors: Record<string, string> } | { status: 404 | 409 }
> {
  const validation = validateBrandingPatch(input);
  if (!validation.ok) return { status: 400, errors: validation.errors };
  return withAccount(accountId, async client => {
    const { rows } = await client.query<{ branding: unknown }>(
      `SELECT branding FROM projects
        WHERE slug = $1 AND account_id = $2 AND deactivated = false FOR UPDATE`, [slug, accountId],
    );
    if (!rows[0]) return { status: 404 };
    const stored = rows[0].branding;
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return { status: 409 };
    const result = await client.query<{ branding: unknown }>(
      `UPDATE projects SET branding = branding || $3::jsonb
        WHERE slug = $1 AND account_id = $2 AND deactivated = false RETURNING branding`,
      [slug, accountId, JSON.stringify(validation.patch)],
    );
    if (!result.rows[0]) return { status: 404 };
    return { status: 200, branding: readBranding(result.rows[0].branding) };
  });
}
