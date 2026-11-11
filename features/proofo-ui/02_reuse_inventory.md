# Proofwall: инвентаризация UI/UX и reuse

Дата: 11.11.2026. Роль: исследователь текущего проекта, без реализации UI.
Модель по переданным параметрам назначения: `gpt-6.1-sol`, reasoning `high`;
отдельный runtime endpoint для подтверждения ID не вызывался.
Объём: исходники страниц, клиентских компонентов, API и тестов; один статический проход.
Proofo здесь не исследуется: сходство, полнота и визуальная точность не утверждаются.
Работа ограничена этим документом; `.env`, секреты, контейнеры и данные не открывались.

## Основание и ограничения

- Прочитаны [AGENTS.md](/home/proofwall/AGENTS.md), [CLAUDE.md](/home/proofwall/CLAUDE.md),
  [workflow](/home/proofwall/docs/development/workflow.md), [core CJM](/home/proofwall/docs/acceptance/core-cjm.md), правила coding-style/security.
- `npm run dz -- recall "Proofwall UI reuse inventory" --project /home/proofwall --limit 3`
  вернул `No matching patterns`: подтверждённых уроков по теме нет.
- Runtime, browser, build и тесты не запускались. Наличие кода означает возможность reuse,
  но не подтверждает работу сценария на данном VPS; core CJM явно требует новой приёмки.
- Перед UI-кодом обязательны анализ референса, конкретный макет и согласование владельца:
  [правило](/home/proofwall/AGENTS.md:40). Этот inventory не является макетом или допуском.

## Страницы и пользовательские сценарии

| Путь / сценарий | Фактическое поведение и компоненты | Reuse / граница |
|---|---|---|
| `/`: landing + регистрация + onboarding | Hero, преимущества, email/password, имя проекта, желаемый slug; проверка slug с debounce 300 мс, busy/errors, переход в проект после регистрации. [page](/home/proofwall/apps/web/src/app/page.tsx:21) | Сохранить API регистрации, slug state machine и атрибуцию; отдельного onboarding wizard нет. |
| `/login` | Email/password, `next`, забытый пароль, условный Яндекс SSO, сообщения ошибок/петли входа. [page](/home/proofwall/apps/web/src/app/login/page.tsx:45), [form](/home/proofwall/apps/web/src/app/login/login-form.tsx:7) | Формы и возврат в целевой маршрут пригодны для нового shell. |
| `/forgot`, `/reset` | Запрос письма восстановления, смена пароля по токену, результат/ошибка. [forgot](/home/proofwall/apps/web/src/app/forgot/forgot-form.tsx), [reset](/home/proofwall/apps/web/src/app/reset/reset-form.tsx) | Действующие отдельные сценарии, не терять при переносе auth. |
| `/dashboard` | Без сессии login; 0 проектов — empty CTA, 1 — redirect, несколько — список slug. [page](/home/proofwall/apps/web/src/app/dashboard/page.tsx:27) | Сохранить три ветки. Отдельного dashboard shell/навигации нет. |
| `/dashboard/[slug]` | Одна длинная карточка: ссылки, script snippet, N3, billing, share, модерация, пароль, platform proof, CSV. [page](/home/proofwall/apps/web/src/app/dashboard/[slug]/page.tsx:34) | Серверные выборки и существующие client blocks можно переносить; секции не являются отдельными routes. |
| `/f/[slug]`: текст | Логотип/цвет/заголовок проекта, имя/роль/текст, счётчик, фото, локальная проверка, success после отправки. [page](/home/proofwall/apps/web/src/app/f/[slug]/page.tsx:23), [SubmitForm](/home/proofwall/apps/web/src/app/f/[slug]/submit-form.tsx:17) | Готовый intake и multipart transport; отображать pending, не обещать немедленную публикацию. |
| `/f/[slug]`: видео | Условная вкладка, запрос камеры/микрофона, запись/preview/отправка; 120 с и 100 MB, ошибки permissions/network/disabled. [tabs](/home/proofwall/apps/web/src/app/f/[slug]/intake-tabs.tsx:10), [recorder](/home/proofwall/apps/web/src/app/f/[slug]/video-recorder.tsx:9) | Reuse при включённой функции; доступность зависит от сервера и браузера. |
| Модерация | Все отзывы, pending первыми; pending/approved/rejected/hidden, кнопки переходов, per-item busy, ошибка, media/source labels. [list](/home/proofwall/apps/web/src/app/dashboard/[slug]/moderation-list.tsx:32) | Логику переходов сохранять. Фильтр, поиск, пагинация и bulk UI в компоненте отсутствуют. |
| Перенос с платформ | Ссылка и/или screenshot, paste, дополнительные поля, pending после сохранения. [PlatformForm](/home/proofwall/apps/web/src/app/dashboard/[slug]/platform-form.tsx:48) | Это ручной перенос доказательства, не автоматический scraper интеграций. |
| CSV import | CSV, mapping колонок, preview с accepted/rejected/sample, отдельное подтверждение, итог inserted/skipped. [ImportForm](/home/proofwall/apps/web/src/app/dashboard/[slug]/import-form.tsx:14) | Сохранить двухшаговую запись и диагностику строк. |
| `/w/[slug]` | SSR approved отзывов, empty state, JSON-LD/canonical/noindex, автор/роль/фото, screenshot/source, demo label, transcript. [wall](/home/proofwall/apps/web/src/app/w/[slug]/page.tsx:31) | Публичный renderer без client hydration; готовая логика публикации/SEO. |
| Внешний widget | Отдельный vanilla TS bootstrap, Shadow DOM, skeleton/empty, safe DOM renderer и badge. [index](/home/proofwall/apps/widget/src/index.ts:43), [render](/home/proofwall/apps/widget/src/render.ts:21) | Reuse как отдельный пакет; React/CSS приложения внутрь не импортировать. |
| Billing в проекте | Free/paid до даты, цена с сервера, 30 дней/продление, busy/error, redirect checkout, request key, новая покупка после отмены. [BillingBlock](/home/proofwall/apps/web/src/app/dashboard/[slug]/billing-block.tsx:15) | Готовый provider-facing flow; отдельной страницы тарифов/истории счетов здесь нет. |
| Share после установки | Домены установок, CTA, явное подтверждение отправки, sent/error. [ShareCta](/home/proofwall/apps/web/src/app/dashboard/[slug]/share-cta.tsx:17) | Сохранить привязку к новой установке домена, подтверждение перед записью. |
| `/partner`, `/partner/dashboard` | Вход секретным токеном; имя, статус кода, регистрации, оплаты, конверсия, начисления. [login](/home/proofwall/apps/web/src/app/partner/login-form.tsx:5), [dashboard](/home/proofwall/apps/web/src/app/partner/dashboard/page.tsx:21) | Отдельная partner cookie/auth, не смешивать с owner session. |
| N3 и agent payments | `/n3/start`, `/n3/verify`, условные promo/status/proof; `/agent-payments` — отдельный сложный поток. [N3Status](/home/proofwall/apps/web/src/app/dashboard/[slug]/n3-status.tsx:5), [agent page](/home/proofwall/apps/web/src/app/agent-payments/page.tsx) | Существуют сверх базового CJM; при включении требуют собственной приёмки. |

## Доступные API: статическая карта

В таблице перечислены обработчики исходников, а не проверенные доступные сетевые endpoints.

| Группа | Метод и путь | Источник / связь с UI |
|---|---|---|
| Auth | POST `/api/auth/register`, `/login`, `/forgot`, `/reset`, `/password` | [register](/home/proofwall/apps/web/src/app/api/auth/register/route.ts:17), [login](/home/proofwall/apps/web/src/app/api/auth/login/route.ts:29), [password](/home/proofwall/apps/web/src/app/api/auth/password/route.ts:34); существующие cookies и ошибки. |
| SSO | GET `/api/auth/yandex/start`, `/callback` | [start](/home/proofwall/apps/web/src/app/api/auth/yandex/start/route.ts:20), [callback](/home/proofwall/apps/web/src/app/api/auth/yandex/callback/route.ts:40). |
| Slug | GET `/api/projects/slug-available?slug=` | [handler](/home/proofwall/apps/web/src/app/api/projects/slug-available/route.ts:15). |
| Отзывы | POST `/api/testimonials`, `/video`, `/platform` | [text/photo](/home/proofwall/apps/web/src/app/api/testimonials/route.ts:65), [video](/home/proofwall/apps/web/src/app/api/testimonials/video/route.ts:15), [platform](/home/proofwall/apps/web/src/app/api/testimonials/platform/route.ts). |
| Модерация/import | POST `/api/testimonials/[id]/moderate`, `/api/import` | [moderate](/home/proofwall/apps/web/src/app/api/testimonials/[id]/moderate/route.ts:21), [import](/home/proofwall/apps/web/src/app/api/import/route.ts:31). |
| Публичное media/widget | GET `/api/photo/[...key]`, `/api/widget/config`; POST `/api/widget/badge-click` | [photo](/home/proofwall/apps/web/src/app/api/photo/[...key]/route.ts:21), [config](/home/proofwall/apps/web/src/app/api/widget/config/route.ts:26), [click](/home/proofwall/apps/web/src/app/api/widget/badge-click/route.ts:25); widget также OPTIONS/CORS. |
| Growth/payment | POST `/api/share`, `/api/checkout`, `/api/webhooks/payment` | [share](/home/proofwall/apps/web/src/app/api/share/route.ts:17), [checkout](/home/proofwall/apps/web/src/app/api/checkout/route.ts:26), [webhook](/home/proofwall/apps/web/src/app/api/webhooks/payment/route.ts:55). |
| Partner/N3 | POST `/api/partner/session`, `/api/n3/proof`; GET `/api/n3/program`, `/api/n3/status` | [partner](/home/proofwall/apps/web/src/app/api/partner/session/route.ts), [N3](/home/proofwall/apps/web/src/app/api/n3/status/route.ts:7). |
| Agent payments | POST `/api/agent-payments/commands`, `/reconcile`, `/webhook`; GET/POST `/human` | [human](/home/proofwall/apps/web/src/app/api/agent-payments/human/route.ts:31), [commands](/home/proofwall/apps/web/src/app/api/agent-payments/commands/route.ts:7). |

Owner dashboard читает БД через server components и `withAccount`, не через публичный REST list.
В просмотренном наборе routes нет общего CRUD API для проектов, формы, branding и wall settings.

## Переиспользуемые слои и реальные пробелы

- Основной reuse — бизнес-логика `apps/web/src/lib`: [project](/home/proofwall/apps/web/src/lib/project.ts),
  [testimonial](/home/proofwall/apps/web/src/lib/testimonial.ts), [moderation](/home/proofwall/apps/web/src/lib/moderation.ts),
  [tariff](/home/proofwall/apps/web/src/lib/tariff.ts), [URLs](/home/proofwall/apps/web/src/lib/urls.ts),
  [widget config](/home/proofwall/apps/web/src/lib/widget-config.ts), [partner](/home/proofwall/apps/web/src/lib/partner.ts).
- `packages/ui` заявлен в архитектурном контексте, но каталога в текущем дереве нет.
  UI primitives представлены CSS classes и локальными React-компонентами, общего component kit нет.
- [globals.css](/home/proofwall/apps/web/src/app/globals.css:12): tokens цветов/радиусов/теней,
  `.stage`, `.card`, `.btn`, `.input`, `.errors`, `.chip`, `.quote`; текущий язык фиолетовый.
  Комментарий файла указывает происхождение от Senja; он не является источником дизайна Proofo.
- [layout](/home/proofwall/apps/web/src/app/layout.tsx) подключает шрифты, metadata, viewport;
  смена токенов и root styles повлияет сразу на auth, dashboard, form, wall и partner.
- [branding](/home/proofwall/apps/web/src/lib/branding.ts:35) читает heading/accent/logo из JSONB,
  валидирует hex/URL. Редактор branding в UI и route записи в просмотренном дереве не найдены.
- Комментарий [form page](/home/proofwall/apps/web/src/app/f/[slug]/page.tsx:3) о неготовом фото устарел:
  [SubmitForm](/home/proofwall/apps/web/src/app/f/[slug]/submit-form.tsx:174) и API уже принимают photo.
- Нет обнаруженных отдельных экранов form builder, wall/widget editor, аналитики owner,
  управления командой и настройки проекта. Потребность в них определяется исследованием Proofo.
- Проекты идентифицируются slug; отдельного сохранённого display name схема dashboard не использует:
  [фактическая модель](/home/proofwall/apps/web/src/app/dashboard/page.tsx:22).
- Wall публикует текст/расшифровку/признак видео, но в просмотренном JSX нет video player:
  [video branches](/home/proofwall/apps/web/src/app/w/[slug]/page.tsx:114).

## Mobile, состояния и риски регресса

- [CSS](/home/proofwall/apps/web/src/app/globals.css:94): fluid padding/type, stage 1180/760/560 px;
  [hero breakpoint](/home/proofwall/apps/web/src/app/globals.css:270) 860 px,
  [wall breakpoint](/home/proofwall/apps/web/src/app/globals.css:322) 720 px; отдельного mobile shell нет.
- Widget имеет отдельные [стили](/home/proofwall/apps/widget/src/styles.ts:14) и вертикальный список;
  desktop/mobile проверить при узкой ширине реального контейнера, а не только viewport.
- Формы содержат labels, required, alert/status, busy; tabs имеют tablist/tab/aria-selected,
  но roving focus/arrow navigation/tab panels в [IntakeTabs](/home/proofwall/apps/web/src/app/f/[slug]/intake-tabs.tsx:22) не реализованы.
- Новый макет обязан явно покрыть empty/loading/success/validation/network/429/disabled,
  истёкшую сессию, чужой slug/404, повтор отправки и длинный пользовательский текст.
- P0: сохранить tenant/RLS и slug→project фильтры: [tenant](/home/proofwall/packages/db/src/tenant.ts),
  [wall query](/home/proofwall/apps/web/src/lib/wall.ts), [widget config](/home/proofwall/apps/web/src/lib/widget-config.ts).
- P0: JSX/textContent и safe JSON-LD; не вставлять отзывы через HTML при визуальном переносе:
  [wall](/home/proofwall/apps/web/src/app/w/[slug]/page.tsx:47), [widget renderer](/home/proofwall/apps/widget/src/render.ts:37).
- P0: server tariff/badge/paid_until, payment idempotency и reuse request key должны сохраниться:
  [billing](/home/proofwall/apps/web/src/app/dashboard/[slug]/billing-block.tsx:23), [tariff](/home/proofwall/apps/web/src/lib/tariff.ts).
- P1: не терять source/demo/transcript labels, preview→confirm CSV, подтверждение share,
  регистрацию UTM, возврат после login и условное скрытие выключенного video/N3.
- P1 mobile: камера/permissions, клавиатура и focus, переполнение URL/snippet, большие screenshots,
  target size, статистика partner и длинная карточка dashboard требуют браузерной проверки.

## Доказательства и следующий допуск

- Существующие тесты для reuse: [register](/home/proofwall/apps/web/tests/register.test.ts),
  [moderation](/home/proofwall/apps/web/tests/moderation.test.ts), [wall](/home/proofwall/apps/web/tests/wall.test.ts),
  [payment](/home/proofwall/apps/web/tests/payment.test.ts), [partner dashboard](/home/proofwall/apps/web/tests/partner-dashboard.test.ts),
  [design tokens](/home/proofwall/apps/web/tests/design-tokens.test.ts), [widget XSS](/home/proofwall/apps/widget/tests/xss.test.ts).
- Найденные browser E2E относятся к [agent payments](/home/proofwall/tests/agent-payments-e2e/README.md);
  наличие этих файлов не доказывает полную E2E-приёмку базового CJM или mobile.
- После анализа Proofo: сопоставить каждый экран/состояние с этой картой → согласовать макет →
  определить недостающие API → реализовывать reuse → проверить core CJM desktop/mobile на тестовой копии.
- Итог текущего прохода: статическая карта готова; приложение и точность воспроизведения не принимались.
