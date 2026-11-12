// Брендирование формы владельцем (AC FR-002: «логотип, акцентный цвет, заголовок»).
// Хранится в projects.branding jsonb — колонка есть в 003_core.sql, схемы у неё нет,
// поэтому форма значений задаётся здесь.

export interface Branding {
  heading: string;
  accent_color: string;
  logo_url: string | null;
}

export interface ResolvedBranding extends Branding {
  theme: 'light' | 'dark';
  review_order: 'newest' | 'oldest';
  show_platform_labels: boolean;
}

export type BrandingPatch = Partial<ResolvedBranding>;

// Согласованный акцент Proofo для отсутствующего/невалидного оформления.
// Явно сохранённый hex сохраняется, включая прежний фирменный purple.
// Значение передаётся в SSR и widget config, независимо от CSS страницы.
const DEFAULT_ACCENT = '#c8492f';
// Только hex: любое иное значение уехало бы в атрибут style. Проверка — не косметика,
// а граница: строка вроде "red;background:url(javascript:…)" не должна попасть в разметку.
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Абсолютный http(s)-URL. javascript:/data: в src логотипа — вектор исполнения на форме. */
function safeLogoUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function readBranding(raw: unknown): ResolvedBranding {
  const b = (typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const heading = typeof b.heading === 'string' && b.heading.trim() !== '' ? b.heading : 'Оставьте отзыв';
  const accent = typeof b.accent_color === 'string' && HEX.test(b.accent_color) ? b.accent_color : DEFAULT_ACCENT;
  return {
    // heading НЕ экранируем здесь — он попадёт в JSX через {}, React экранирует сам.
    heading: heading.slice(0, 120),
    accent_color: accent,
    logo_url: safeLogoUrl(b.logo_url),
    theme: b.theme === 'dark' ? 'dark' : 'light',
    review_order: b.review_order === 'oldest' ? 'oldest' : 'newest',
    show_platform_labels: typeof b.show_platform_labels === 'boolean' ? b.show_platform_labels : true,
  };
}

function sqlSafe(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code === 0 || (code >= 0xdc00 && code <= 0xdfff)) return false;
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    }
  }
  return true;
}

export function validateBrandingPatch(raw: unknown):
  { ok: true; patch: BrandingPatch } | { ok: false; errors: Record<string, string> } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: { form: 'Ожидается объект настроек.' } };
  }
  const fields = ['theme', 'review_order', 'show_platform_labels', 'accent_color', 'logo_url', 'heading'];
  const entries = Object.entries(raw);
  const errors: Record<string, string> = {};
  const patch: Record<string, unknown> = {};
  if (!entries.length) errors.form = 'Измените хотя бы одну настройку.';
  for (const [key, value] of entries) {
    if (!fields.includes(key)) { errors.form = 'Неизвестная настройка.'; continue; }
    if (typeof value === 'string' && !sqlSafe(value)) {
      errors[key] = 'Недопустимые символы.'; continue;
    }
    if (key === 'theme' && value !== 'light' && value !== 'dark') errors[key] = 'Выберите светлую или тёмную тему.';
    if (key === 'review_order' && value !== 'newest' && value !== 'oldest') errors[key] = 'Выберите порядок отзывов.';
    if (key === 'show_platform_labels' && typeof value !== 'boolean') errors[key] = 'Ожидается переключатель меток.';
    if (key === 'accent_color' && (typeof value !== 'string' || !HEX.test(value))) errors[key] = 'Укажите цвет в формате #RRGGBB.';
    if (key === 'heading' && (typeof value !== 'string' || !value.trim() || value.length > 120)) errors[key] = 'Заголовок: от 1 до 120 символов.';
    if (key === 'logo_url' && value !== null && value !== '') {
      let valid = false;
      if (typeof value === 'string' && value.length <= 2048) {
        try {
          const url = new URL(value);
          valid = url.protocol === 'https:' && url.username === '' && url.password === '';
        } catch { /* явная ошибка поля ниже */ }
      }
      if (!valid) errors[key] = 'Логотип: HTTPS URL без имени пользователя и пароля, до 2048 символов.';
    }
    patch[key] = key === 'logo_url' && value === '' ? null : value;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, patch: patch as BrandingPatch };
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

/** Без surface — ink на accentFill; с surface — accentText на данном фоне. */
export function brandingForeground(accent: string, surface?: string): string {
  const fill = HEX.test(accent) ? accent : DEFAULT_ACCENT;
  const background = surface && HEX.test(surface) ? surface : fill;
  const bg = luminance(background);
  if (surface) {
    const fg = luminance(fill);
    if ((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05) >= 4.5) return fill;
  }
  return (bg + 0.05) / 0.05 >= 1.05 / (bg + 0.05) ? '#000000' : '#ffffff';
}
