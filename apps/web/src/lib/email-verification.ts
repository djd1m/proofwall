import { createHash, randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';

export function hashEmailVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Вызывается только внутри withService. Сети здесь нет. Initial issue — только signup. */
export async function issueEmailVerification(
  client: PoolClient, accountId: string, email: string,
  authority?: { sessionHash: string; ip: string },
): Promise<{ kind: 'issued'; token: string; email: string } |
  { kind: 'verified' } | { kind: 'rate_limited' } | { kind: 'unauthorized' }> {
  await client.query("set local lock_timeout='2s'");
  const account = (await client.query<{ email: string; email_verified_at: Date | null }>(
    'select email,email_verified_at from accounts where id=$1 for no key update', [accountId],
  )).rows[0];
  if (!account || account.email !== email) return { kind: 'unauthorized' };
  if (authority) {
    // Проверка после account lock и session lock: ожидание могло пересечь expiry.
    const session = (await client.query<{ id: string }>(`select id from sessions where account_id=$1
      and token_hash=$2 and revoked_at is null for update`, [accountId, authority.sessionHash])).rows[0];
    if (!session || !(await client.query(`select 1 from sessions where id=$1
      and revoked_at is null and expires_at>clock_timestamp()`, [session.id])).rowCount) {
      return { kind: 'unauthorized' };
    }
  }
  if (account.email_verified_at) return { kind: 'verified' };
  if (authority) {
    const ipHash = hashEmailVerificationToken(authority.ip);
    // Общий IP lock защищает счётчик даже между разными аккаунтами.
    const locked = await client.query<{ ok: boolean }>(
      'select pg_try_advisory_xact_lock(90021,hashtext($1)) as ok', [ipHash]);
    if (!locked.rows[0]?.ok) return { kind: 'rate_limited' };
    const counts = (await client.query<{ account_count: number; ip_count: number; cooldown: number }>(`select
      count(*) filter(where scope='email_verify_account' and key=$1)::int as account_count,
      count(*) filter(where scope='email_verify_ip' and key=$2)::int as ip_count,
      count(*) filter(where scope='email_verify_account' and key=$1
        and created_at>clock_timestamp()-interval '60 seconds')::int as cooldown
      from rate_limit_events where created_at>clock_timestamp()-interval '1 hour'
      and scope in ('email_verify_account','email_verify_ip')`, [accountId, ipHash])).rows[0]!;
    if (counts.account_count >= 5 || counts.ip_count >= 30 || counts.cooldown > 0) return { kind: 'rate_limited' };
    await client.query(`insert into rate_limit_events(scope,key)
      values('email_verify_account',$1),('email_verify_ip',$2)`, [accountId, ipHash]);
  }
  await client.query(`update email_verification_tokens set used_at=clock_timestamp()
    where account_id=$1 and used_at is null`, [accountId]);
  const token = randomBytes(32).toString('base64url');
  await client.query(`insert into email_verification_tokens(account_id,email,token_hash,expires_at)
    values($1,$2,$3,clock_timestamp()+interval '24 hours')`, [accountId, email, hashEmailVerificationToken(token)]);
  return { kind: 'issued', token, email };
}

/** Lock order account → token; compare-and-set и marker коммитятся вместе. */
export async function consumeEmailVerification(client: PoolClient, token: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const hash = hashEmailVerificationToken(token);
  const hint = (await client.query<{ account_id: string }>(
    'select account_id from email_verification_tokens where token_hash=$1', [hash])).rows[0];
  if (!hint) return false;
  await client.query("set local lock_timeout='2s'");
  const account = (await client.query<{ email: string }>(
    'select email from accounts where id=$1 for no key update', [hint.account_id])).rows[0];
  if (!account) return false;
  const claimed = await client.query(`update email_verification_tokens set used_at=clock_timestamp()
    where token_hash=$1 and account_id=$2 and email=$3 and used_at is null
      and expires_at>clock_timestamp() returning id`, [hash, hint.account_id, account.email]);
  if (claimed.rowCount !== 1) return false;
  await client.query('update accounts set email_verified_at=clock_timestamp() where id=$1', [hint.account_id]);
  return true;
}
