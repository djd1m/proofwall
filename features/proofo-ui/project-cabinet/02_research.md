# Reuse и исследование кабинета проекта

Статус: read-only audit на `5513c574c5406e017d3e210ee1c4bb0704752144`; результаты runtime не заявлены.

| Источник | Что подтверждает | Использование |
|---|---|---|
| `apps/web/src/app/dashboard/[slug]/page.tsx` | currentAccountId, withAccount, project/items/installs, deliveryNotice, effective tier, ссылки | Сохранить server boundary и все данные; добавить branding.name и inactive guard, только если не обеспечен политикой |
| `apps/web/src/app/dashboard/[slug]/moderation-list.tsx` | ModerationList, Item | Сохранить network/actions/source media; restyle внутри нового scope |
| `apps/web/src/app/dashboard/[slug]/platform-form.tsx` | PlatformForm | Рабочий ручной intake с provenance/source URL/screenshot; не OCR |
| `apps/web/src/app/dashboard/[slug]/import-form.tsx` | ImportForm | CSV preview/commit, ошибки и duplicates |
| `apps/web/src/app/dashboard/[slug]/billing-block.tsx` | BillingBlock | Текущая effective подписка/checkout, без прототипных Start/Pro обещаний |
| `apps/web/src/app/dashboard/[slug]/change-password.tsx` | ChangePassword | Существующая password mutation и session rotation |
| `apps/web/src/app/dashboard/[slug]/n3-status.tsx` | N3Status | Реальная account capability/status, не выкидывать ради пустого macro |
| `apps/web/src/app/dashboard/[slug]/share-cta.tsx` | ShareCta, Install | Установленные домены, share CTA по фактическому install |
| `apps/web/src/lib/urls.ts` | buildProjectUrls | Настоящий origin, encoded slug, безопасный snippet как текст |
| `apps/web/src/lib/tariff.ts` | isPaid/tierSummary | Просроченная paid → free; данные сервера authoritative |
| `apps/web/src/lib/branding.ts` | parse/resolve существующего branding | title name отдельно от palette; публичный accent не задаёт product chrome |
| `apps/web/src/app/dashboard/dashboard-overview.tsx` | DashboardOverview | Pattern чистого production view; не копировать dashboard в project |
| `apps/web/src/app/dashboard/dashboard.css`, `apps/web/src/app/proofo-forms.css` | Изолированные scope, шрифты/геометрия, contrast palette | Новый `.proofo-project` scope; существующие CSS не менять |
| `scripts/capture-proofo-reference.mjs` | capture/serve/launch/hash/path guards | Reuse helpers для нового read-only source capture; старые constants/manifest не изменять |
| `scripts/run-branding-collect-preview.mjs` | QA allowlist runtime | Reuse только env helpers; existing e2e жёстко выбирает branding suite, generic ports и отсутствие flock требуют нового project runner; exact endpoints/lock/guards описаны в05 |

Frozen source: `features/proofo-ui/reference/dashboard-v3/resources/cabinet.js` функция project, cabinet.css/style.css/fonts. Старый manifest содержит dashboard/branding/collect, project case в нём отсутствует. Original candidate уже captured координатором в `evidence/original-project-reference/`; финальный baseline создаётся отдельно `features/proofo-ui/project-cabinet/reference/project-v1/` путём фиксации этих bytes, без recapture. Никакой автоматической перезаписи baseline.

Macro `https://proofwall.78.17.53.233.sslip.io/__design/proofo/?screen=project` показывает пустое состояние, фиктивные OCR/text/link, отсутствующие populated cards, нереализованные тарифные обещания. Это источник геометрии, а не доказательство backend. Оригинал фиксируется неизменным; конкретная продуктовая адаптация — `design-adaptation.md`.

OSS alternatives не нужны: React/Next, current PostgreSQL/RLS, существующие intake/checkout, Playwright/pixelmatch уже закреплены. Новые пакеты, API, migrations, provider SDK и schema changes отсутствуют.
