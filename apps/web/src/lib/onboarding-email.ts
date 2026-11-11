import { isIP } from 'node:net';
import type { EmailMessage } from './email';
import type { ProjectUrls } from './urls';

function validOrigin(value: string): string | null {
  if (/[\x00-\x20\x7f]/.test(value)) return null;
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
    if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || u.pathname !== '/') return null;
    if (host === 'localhost' || host.endsWith('.localhost') || !host.includes('.')) return null;
    if (isIP(host) === 6) return null;
    if (isIP(host) === 4) {
      const [a, b] = host.split('.').map(Number);
      if (a === 0 || a === 10 || a === 127 || a! >= 224 ||
        (a === 169 && b === 254) || (a === 172 && b! >= 16 && b! <= 31) ||
        (a === 192 && b === 168) || (a === 100 && b! >= 64 && b! <= 127)) return null;
    }
    return u.origin;
  } catch { return null; }
}

/** Нет localhost fallback даже в dev: письмо может уйти наружу из любого окружения. */
export function transactionalMailOrigin(): string | null {
  const raw = process.env.BASE_URL === undefined ? process.env.NEXT_PUBLIC_BASE_URL : process.env.BASE_URL;
  return typeof raw === 'string' && raw !== '' ? validOrigin(raw) : null;
}

export function normalizeProjectDisplayName(value: unknown, slug: string): string {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 120) : slug;
}

export function emailVerificationUrl(origin: string, token: string): string {
  if (!validOrigin(origin) || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('invalid verification URL');
  return `${new URL(origin).origin}/verify-email#token=${encodeURIComponent(token)}`;
}

const escape = (value: string): string => value.replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const subjectName = (value: string): string => value.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ').slice(0, 120);
const link = (url: string, title: string): string => `<a href="${escape(url)}" style="color:#c8492f;word-break:break-word">${title}</a>`;
const button = (url: string, title: string): string => `<a href="${escape(url)}" style="display:inline-block;background:#c8492f;color:#fff;border-radius:8px;padding:14px 20px;text-decoration:none;font-weight:bold">${title}</a>`;
function shell(title: string, content: string): string {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head><body style="margin:0;background:#f2ede3;color:#29251f;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:auto;background:#fff;border-radius:16px"><tr><td style="padding:32px"><p style="color:#c8492f;font-size:20px;font-weight:bold;margin:0 0 28px">Proofwall</p><h1 style="font-size:28px;line-height:1.2;margin:0 0 20px;overflow-wrap:anywhere">${escape(title)}</h1>${content}<p style="font-size:12px;color:#766f65;margin-top:32px;line-height:1.5">Если вы не создавали стену и не запрашивали письмо, ничего делать не нужно.</p></td></tr></table></td></tr></table></body></html>`;
}
function verifiedLink(linkValue: string): URL {
  const u = new URL(linkValue);
  if (!validOrigin(u.origin) || u.username || u.password || u.pathname !== '/verify-email' || u.search ||
    !/^#token=[A-Za-z0-9_-]{43}$/.test(u.hash)) throw new Error('invalid verification URL');
  return u;
}

export function projectWelcomeEmail(to: string, name: string, urls: ProjectUrls, verificationUrl: string): EmailMessage {
  const verify = verifiedLink(verificationUrl);
  const wall = new URL(urls.wall_of_love);
  const slug = wall.pathname.slice(3);
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) throw new Error('invalid project URL');
  for (const [value, pathname] of [[urls.wall_of_love, `/w/${slug}`],
    [urls.dashboard, `/dashboard/${slug}`], [urls.submission_form, `/f/${slug}`]]) {
    const u = new URL(value!);
    if (u.origin !== verify.origin || u.username || u.password || u.pathname !== pathname || u.search || u.hash) {
      throw new Error('invalid project URL');
    }
  }
  const title = `Стена «${name}» создана`;
  const text = `${title}\n\nВаши ссылки:\nПубличная стена: ${urls.wall_of_love}\nКабинет и модерация: ${urls.dashboard}\nФорма сбора: ${urls.submission_form}\n\nПодтвердить email (ссылка действует 24 часа): ${verificationUrl}\n\nУже есть отзывы? Импортируйте CSV в кабинете: сначала предпросмотр, затем импорт. После импорта одобрите отзывы для публикации.\n\nЕсли вы не создавали стену, ничего делать не нужно.`;
  return { to, subject: `Ваша стена «${subjectName(name)}» в Proofwall готова`, text,
    html: shell(title, `<p style="line-height:1.6">Сохраните эти ссылки — всё для вашей стены уже под рукой.</p><p>${button(urls.dashboard, 'Открыть кабинет')}</p><p style="line-height:1.8">${link(urls.wall_of_love, 'Публичная стена')}<br>${link(urls.dashboard, 'Кабинет и модерация')}<br>${link(urls.submission_form, 'Форма сбора')}</p><div style="background:#f2ede3;padding:20px;border-radius:10px;margin:28px 0"><h2 style="font-size:18px;margin:0 0 12px">Подтвердите email</h2><p style="line-height:1.5">Ссылка действует 24 часа и используется один раз.</p>${button(verificationUrl, 'Подтвердить email')}</div><h2 style="font-size:18px">Уже есть отзывы?</h2><p style="line-height:1.6">Импортируйте CSV в кабинете: сначала предпросмотр, затем импорт. После импорта одобрите отзывы для публикации.</p>`),
  };
}

export function emailVerificationMessage(to: string, linkValue: string): EmailMessage {
  verifiedLink(linkValue);
  return { to, subject: 'Подтвердите email — Proofwall',
    text: `Подтвердите email: ${linkValue}\n\nСсылка действует 24 часа и используется один раз. Предыдущая ссылка больше не действует. Если вы не запрашивали письмо, ничего делать не нужно.`,
    html: shell('Подтвердите email', `<p style="line-height:1.6">Ссылка действует 24 часа и используется один раз. Предыдущая ссылка больше не действует.</p><p>${button(linkValue, 'Подтвердить email')}</p>`),
  };
}
