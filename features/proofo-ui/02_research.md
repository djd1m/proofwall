# Reuse: dashboard

Дата: 2026-11-11. Основание — прочитанный исходный код этой worktree, не архивные статусы.

| Источник | Наблюдение | Решение |
|---|---|---|
| `apps/web/src/app/dashboard/page.tsx` | currentAccountId; withAccount; active filtering; single project redirect | Сохранить session/RLS/active, заменить redirect на overview |
| `packages/db/src/tenant.ts` и migration 007 | SET LOCAL ROLE app_authenticated + локальный account GUC; RLS на projects/testimonials/events/installs | Переиспользовать без новой роли и BYPASSRLS |
| migrations 003, 004, 018 | slug, branding, free/paid, paid_until; testimonials statuses; events; widget_installs | Новый read model, без миграции |
| `apps/web/src/lib/register.ts` | display name хранится в branding.name | Читать существующее поле, не запрашивать projects.name |
| `apps/web/src/lib/tariff.ts` | isPaid fail-closed, срок обязателен | Единственный источник effective tier |
| `apps/web/src/app/dashboard/[slug]/page.tsx` | moderation, ссылки, billing, email notice/recovery | Сохранить route и имеющиеся компоненты |
| `apps/web/src/app/api/widget/config/route.ts` | badge_impression лишь при badge_required | Не считать общими widget impressions |
| `apps/web/src/lib/widget-install.ts` | last_seen_at обновляется на повторном config; pair unique | Вычислимы наблюдённые пары project/domain по config-запросам; текущая установка не доказана |
| `apps/web/src/app/api/widget/badge-click/route.ts` | badge_click пишется в analytics_events | Считать логированные события; не обещать уникальных людей |
| `features/proofo-ui/preview/cabinet.js` | dashboard exact markup и literal demo тексты | JSX view с той же DOM структурой и типизированными props |
| `features/proofo-ui/preview/cabinet.css`, `style.css`, fonts | Геометрия, цвета, body/display шрифты | Скопировать релевантный CSS с локальной областью, byte-copy fonts |
| `apps/web/tests/dashboard-onboarding.test.ts` | DB fixture + cookies mock + SSR static markup | Reuse test pattern; existing regression обязателен |
| `apps/web/vitest.config.ts` | TSX поддержан через Vitest, alias @proofwall/db/@ | Использовать имеющийся test runner |

## Пробелы, которые нельзя закрыть словами

В коде нет измерения wall opens и всех widget impressions. Добавлять collectors ради
заполнения карточек не требуется этому инкременту: показываем unknown. Отдельного
названия в projects нет. Ограничения Free 12, один проект и тарифы Start/Pro взяты
из макета, не из собственного тарифного модуля. Logout route не найден; координатор
принял отсутствие этого нового действия в dashboard scope.

## Выбор средств

Нового продуктового OSS или external API не нужно. Local visual tooling изолирован
в `tools/visual`: Playwright 1.65.0, pixelmatch 8.0.0, pngjs 7.0.0, lockfile;
версии и npm metadata проверены инженером baseline (результаты фиксируются его report).
Root package/workspaces не изменяются. Для fixture используется имеющийся Vitest
и react-dom/server через React.createElement, в .test.ts по существующему include.

Архитектурные варианты и ограничения представлены в ADR-001 и ADR-002.
Никакие отсутствующие измерения production, независимые отзывы или external research
этот reuse inventory не объявляет выполненными.

QCSD уточнил reuse boundary: существующие RLS tests не покрывают analytics_events;
нужен прямой unscoped tenant-negative SELECT и проверка role/GUC. `globals.css` и
root layout влияют на body вне crop, поэтому fixture обязана загружать тот же global
CSS перед dashboard CSS; отдельное оформление synthetic body не доказывает live SSR.
