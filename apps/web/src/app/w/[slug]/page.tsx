// GET /w/<slug> — публичная «Стена любви» (FR-005, Pseudocode §6).
//
// Серверный рендер без клиентского JS: страница должна читаться поисковиком и открываться
// без гидратации. Экранирование — ЗДЕСЬ (приём хранит разметку побайтово, FR-NFR-SEC-002);
// весь авторский текст выводится через {}, что React экранирует сам. Единственное
// исключение — JSON-LD, см. safeJsonLd.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findProjectBySlug } from '@/lib/project';
import { readBranding, brandingForeground } from '@/lib/branding';
import { buildReviewJsonLd, getApprovedTestimonials, safeJsonLd } from '@/lib/wall';
import { baseUrl } from '@/lib/urls';
import { platformFrom } from '@/lib/platform-proof';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = await findProjectBySlug(slug);
  return {
    title: `Отзывы — ${slug}`,
    // noindex снимается только порогом содержательности (FR-GROWTH-005, ADR-004).
    robots: project?.noindex === false ? undefined : { index: false, follow: false },
    alternates: { canonical: `${baseUrl()}/w/${slug}` },
  };
}

export default async function WallPage({ params }: Params) {
  const { slug } = await params;
  const project = await findProjectBySlug(slug);

  // 404 ТОЛЬКО когда проекта нет. Проект без одобренных отзывов — пустое состояние,
  // и noindex тоже не значит 404: страница всегда доступна людям по прямой ссылке.
  if (!project) notFound();

  const branding = readBranding(project.branding);
  const items = await getApprovedTestimonials(project.id, branding.review_order);
  const pageUrl = `${baseUrl()}/w/${project.slug}`;
  const accent = branding.accent_color;
  const surface = branding.theme === 'dark' ? '#181818' : '#fffdf8';
  const ink = branding.theme === 'dark' ? '#ffffff' : '#181818';
  const accentText = brandingForeground(accent, surface);

  return (
    <main className="stage stage--mid wall-page" data-theme={branding.theme} style={{
      ['--wall-surface' as string]: surface, ['--wall-ink' as string]: ink,
      ['--wall-accent-text' as string]: accentText, ['--wall-fill' as string]: accent,
      ['--wall-on-accent' as string]: brandingForeground(accent),
      ['--wall-edge' as string]: branding.theme === 'dark' ? '#aaaaaa' : '#8e806b',
    }}>
      <style>{`
        .wall-page {background:var(--wall-surface);color:var(--wall-ink);min-width:0;overflow-wrap:anywhere;max-width:760px;width:100%;--text:var(--wall-ink);--ink:var(--wall-ink);--muted:var(--wall-ink);--on-ink:var(--wall-ink);--on-ink-dim:var(--wall-ink)}
        .wall-page .wall,.wall-page .quote,.wall-page .quote__author>span {min-width:0}
        .wall-page .quote,.wall-page .card {background:var(--wall-surface);color:var(--wall-ink);border:1px solid var(--wall-edge)}
        .wall-page .quote__transcript,.wall-page .quote__origin {color:var(--wall-ink)}
        .wall-page a,.wall-page .wallHead__title {color:var(--wall-accent-text)}
        .wall-page .quote__origin a {color:var(--wall-accent-text);text-decoration:underline}
        .wall-page .quote__avatar,.wall-page .chip {background:var(--wall-fill);color:var(--wall-on-accent)}
        .wall-page a:focus-visible {outline:2px solid var(--wall-ink);outline-offset:3px;box-shadow:0 0 0 2px var(--wall-surface)}
        .wall-page .wallHead__logo {max-width:100%;height:auto}
        .wall-page .quote__author {align-items:flex-start}
        .wall-page .quote__role,.wall-page .quote__body,.wall-page .quote__origin,.wall-page .quote__transcript {overflow-wrap:anywhere;word-break:break-word}
      `}</style>
      {items.length > 0 && (
        <script
          type="application/ld+json"
          // Единственный dangerouslySetInnerHTML в приложении. Безопасность держится
          // не на React, а на safeJsonLd — см. комментарий там и тесты wall.test.ts.
          dangerouslySetInnerHTML={{ __html: safeJsonLd(buildReviewJsonLd(project.slug, pageUrl, items)) }}
        />
      )}

      {items.some((t) => t.source === 'demo') && (
        /* ОТМЕТКА ДЕМОНСТРАЦИИ. Не украшение и не перестраховка: сочинённый отзыв,
           выданный за настоящий, — это FTC Rule 16 CFR Part 465, до $53 088 за нарушение
           (см. .claude/rules/security.md §5). Отметка привязана к ДАННЫМ, а не к слагу
           проекта: убрали демо-строки — она исчезла сама, без правки кода, и наоборот
           не забудется, если демо-данные заведут в другом проекте. */
        <p
          className="small"
          role="note"
          style={{
            margin: '0 0 16px', padding: '10px 14px', borderRadius: 10,
            background: surface, color: ink, fontWeight: 600,
          }}
        >
          Демонстрация. Отзывы ниже сочинены для показа витрины и не принадлежат реальным людям.
        </p>
      )}

      <header className="wallHead">
        {branding.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element -- логотип с произвольного домена
          <img src={branding.logo_url} alt="" className="wallHead__logo" />
        )}
        <p className="eyebrow" style={{ color: 'var(--on-ink-dim)' }}>Стена любви</p>
        <h1 className="wallHead__title">Что говорят клиенты</h1>
        <p className="wallHead__count">
          {items.length > 0
            ? `${items.length} ${plural(items.length, 'отзыв', 'отзыва', 'отзывов')}`
            : 'Пока ни одного одобренного отзыва'}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="card">
          <div className="empty">
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>
              Здесь появятся отзывы после проверки владельцем.
            </p>
            <p style={{ margin: '8px 0 0' }}>
              Оставить свой: <code>/f/{project.slug}</code>
            </p>
          </div>
        </div>
      ) : (
        <div className="wall">
          {items.map((item) => (
            <article
              key={item.id}
              className="quote"
              itemScope
              itemType="https://schema.org/Review"
              style={{ ['--quote-accent' as string]: accent }}
            >
              <span className="quote__mark" aria-hidden="true">“</span>

              {item.text && (
                <p itemProp="reviewBody" className="quote__body">{item.text}</p>
              )}

              {item.has_video && item.transcript && (
                <p className="quote__transcript">
                  <span className="chip chip--accent">Машинная расшифровка видео</span> {item.transcript}
                </p>
              )}
              {item.has_video && !item.transcript && (
                <p className="quote__transcript"><span className="chip">🎥 видео-отзыв</span></p>
              )}

              {item.screenshot_object_key && (
                // Снимок экрана — СОДЕРЖИМОЕ карточки, а не аватар: в слоте аватара
                // (38 пикселей, кружок) отзыв с чужой площадки превратился бы в нечитаемую
                // точку. Открывается в полный размер отдельной вкладкой.
                <a
                  className="quote__shot"
                  href={`/api/photo/${item.screenshot_object_key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- наш роут /api/photo:
                      тип определяется по сигнатуре содержимого и отдаётся с nosniff. */}
                  <img
                    src={`/api/photo/${item.screenshot_object_key}`}
                    alt="Снимок отзыва на площадке"
                    loading="lazy"
                  />
                </a>
              )}

              {item.source === 'platform' && (
                // Пометка источника стоит ВСЕГДА у перенесённого отзыва, даже когда ссылки
                // нет: читатель обязан понимать, что смотрит на перенесённое, а не на
                // написанное здесь. Ссылка делает пометку проверяемой, её отсутствие не
                // отменяет обязанности пометить.
                <p className="quote__origin">
                  {!branding.show_platform_labels && <>Перенесённый отзыв{item.source_url && /^https:\/\//i.test(item.source_url) ? ' · ' : ''}</>}
                  {item.source_url && /^https:\/\//i.test(item.source_url) ? (
                    <a href={item.source_url} target="_blank" rel="nofollow noopener noreferrer">
                      {branding.show_platform_labels ? <>Отзыв с {platformFrom(item.source_platform) ?? 'внешней площадки'} →</> : <>Первоисточник →</>}
                    </a>
                  ) : (
                    branding.show_platform_labels ? <>Отзыв с {platformFrom(item.source_platform) ?? 'внешней площадки'}</> : null
                  )}
                </p>
              )}

              {/* Блок автора пропускается целиком, когда имени нет: у отзыва, принесённого
                  снимком, автор виден НА СНИМКЕ, и пустая строка с инициалом-заглушкой
                  сообщала бы читателю несуществующего человека. */}
              {item.author_name !== '' && (
              <footer
                itemProp="author"
                itemScope
                itemType="https://schema.org/Person"
                className="quote__author"
              >
                {item.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- отдаётся нашим
                  // роутом /api/photo с проверкой содержимого и nosniff; next/image
                  // потребовал бы отдельной конфигурации для собственного же пути.
                  <img
                    src={item.photo_url}
                    alt=""
                    className="quote__avatar quote__avatar--photo"
                    loading="lazy"
                    width={38}
                    height={38}
                  />
                ) : (
                  <span className="quote__avatar" aria-hidden="true">
                    {initial(item.author_name)}
                  </span>
                )}
                <span>
                  <strong itemProp="name">{item.author_name}</strong>
                  {item.author_role && (
                    <span itemProp="jobTitle" className="quote__role">{item.author_role}</span>
                  )}
                </span>
              </footer>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="wallFoot">
        Собрано через <a href={baseUrl()}>Proofwall</a>
      </p>
    </main>
  );
}

/** Первая буква имени для аватара-заглушки. Имя авторское — берём безопасно. */
function initial(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}
