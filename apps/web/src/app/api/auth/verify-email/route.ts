import { NextResponse } from 'next/server';
import { withService } from '@proofwall/db';
import { consumeEmailVerification } from '@/lib/email-verification';
import { readBodyAtMost, MAX_JSON_BODY } from '@/lib/request-body';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const headers = { 'Cache-Control': 'no-store' };
  const raw = await readBodyAtMost(request, MAX_JSON_BODY);
  if (raw === null) return NextResponse.json({ error: 'тело запроса слишком большое' }, { status: 413, headers });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { body = null; }
  if (typeof body !== 'object' || body === null || !('token' in body) ||
    typeof body.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.token) ||
    Object.keys(body).length !== 1) {
    return NextResponse.json({ error: 'ссылка недействительна или устарела' }, { status: 400, headers });
  }
  // Это доказательство владения email, не cookie-authorized действие. Почта может
  // быть выключена: уже выпущенные ссылки продолжают действовать до TTL/отзыва.
  const token = body.token;
  const verified = await withService(client => consumeEmailVerification(client, token));
  return NextResponse.json(verified ? { verified: true } : { error: 'ссылка недействительна или устарела' },
    { status: verified ? 200 : 400, headers });
}
