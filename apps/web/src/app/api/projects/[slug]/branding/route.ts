import { NextResponse } from 'next/server';
import { currentAccountId } from '@/lib/current-session';
import { readOwnedBranding, patchOwnedBranding } from '@/lib/project-branding';
import { readBodyAtMost } from '@/lib/request-body';
import { baseUrl } from '@/lib/urls';
import { randomUUID } from 'node:crypto';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ slug: string }> };
function response(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const accountId = await currentAccountId();
    if (!accountId) return response({ error: 'Войдите в аккаунт.' }, 401);
    const model = await readOwnedBranding(accountId, (await params).slug);
    return model ? response({ branding: model.branding }, 200) : response({ error: 'Проект не найден.' }, 404);
  } catch { return response({ error: 'Не удалось загрузить настройки. Попробуйте ещё раз.' }, 503); }
}

export async function PATCH(request: Request, { params }: Context) {
  const correlation = randomUUID();
  // Фиксированные коды и server-generated correlation; никаких данных запроса/исключения.
  const finish = (body: unknown, status: number, code:
    'COMMITTED' | 'AUTH_REQUIRED' | 'ORIGIN_REJECTED' | 'CONTENT_TYPE_REJECTED' |
    'BODY_TOO_LARGE' | 'JSON_INVALID' | 'PATCH_INVALID' | 'NOT_FOUND' |
    'STORED_INVALID' | 'DB_PERMISSION' | 'WRITE_FAILED') => {
    const event = { outcome: status === 200 ? 'committed' : status >= 500 ? 'failed' : 'rejected', status, code, correlation };
    if (status === 200) console.info('branding_patch', event);
    else if (status >= 500) console.error('branding_patch', event);
    else console.warn('branding_patch', event);
    const result = response(body, status);
    result.headers.set('x-request-id', correlation);
    return result;
  };
  try {
    const accountId = await currentAccountId();
    if (!accountId) return finish({ error: 'Войдите в аккаунт.' }, 401, 'AUTH_REQUIRED');
    if (request.headers.get('origin') !== new URL(baseUrl()).origin ||
        request.headers.get('sec-fetch-site') === 'cross-site') return finish({ error: 'Недопустимый источник запроса.' }, 403, 'ORIGIN_REJECTED');
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) return finish({ error: 'Ожидается JSON.' }, 415, 'CONTENT_TYPE_REJECTED');
    const text = await readBodyAtMost(request, 4096);
    if (text === null) return finish({ error: 'Запрос слишком большой.' }, 413, 'BODY_TOO_LARGE');
    let input: unknown;
    try { input = JSON.parse(text); } catch { return finish({ error: 'Не удалось прочитать JSON.' }, 400, 'JSON_INVALID'); }
    const result = await patchOwnedBranding(accountId, (await params).slug, input);
    // withAccount разрешает Promise только после COMMIT.
    if (result.status === 200) return finish({ branding: result.branding }, 200, 'COMMITTED');
    if (result.status === 400) return finish({ errors: result.errors }, 400, 'PATCH_INVALID');
    return finish({ error: result.status === 409 ? 'Сохранённые настройки требуют восстановления.' : 'Проект не найден.' }, result.status, result.status === 409 ? 'STORED_INVALID' : 'NOT_FOUND');
  } catch (error) {
    const permission = error !== null && typeof error === 'object' && 'code' in error && error.code === '42501';
    return finish({ error: 'Не удалось сохранить настройки. Попробуйте ещё раз.' }, 503, permission ? 'DB_PERMISSION' : 'WRITE_FAILED');
  }
}
