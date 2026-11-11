# Независимое QE: регрессия dashboard

**Текущий результат focused verification: clean**, revision `06f4dce82d3e419861bced5377c6c71ae2fc9a42d87f12c219fee9d2dc1c1840`, nonce `690f6976-08de-4023-9747-5782b9c1c20f`. Новая структурная дельта независимо проверена; собственные initial conditions остаются `[]`. Подробности в последнем разделе. Ниже сохранён initial review, включая его неуспешный первый test run и тогдашнее отсутствие coverage; актуальное измерение покрытия приведено в focused-разделе.

Вердикт роли **qe-regression: clean**. Новых подтверждённых дефектов в проверенном dashboard scope не обнаружено. Это initial review, без проверки авторского rework и без закрытия находок других ролей; решение всей QE-конвергенции принимает общий gate.

Дата: 2026-11-11. Reviewer: `qe-regression`, family `codex`, отдельная сессия `gpt-6-astra xhigh`; автор приложения — `gpt-6.1-sol high`. Прочитаны AGENTS, CLAUDE, workflow, core CJM, review policy/model matrix, применимые testing/security/fallback rules, Direct integration, полные `regression-testing/SKILL.md` и `qe-coverage-analysis/SKILL.md`, requirements, OpenSpec delta, ADR-001/002, architecture, implementation plan, actual diff, новые app/test/harness files.

Привязка: revision `4fb5f45771da845cfb31b82638322ed64f90d265402c5ac42f99e9125c77a72c`, nonce `c31c4bbe-bef2-49ee-9d89-863decf9f99b`. До и после проверки SHA-256 всех 30 manifest paths совпали. Base Git HEAD: `cd7ecb481f1ec6370f8e1d617d2c7e18528a964e`. [Аудит snapshot, зависимостей и логов](qe-regression-artifacts/audit.json).

## Impact и выбор проверок

Единственный изменённый существующий app-файл — `apps/web/src/app/dashboard/page.tsx`: прежний single-project redirect намеренно удалён согласно FR-001, сохранены force-dynamic, noindex, session guard и `/login?next=/dashboard`. Новые read model, pure view, scoped CSS, fonts и error boundary относятся к dashboard. `error.tsx` также может обслуживать ошибки вложенного project route; успешная project page и её действия сохранены. Fixture существует в отдельном localhost renderer, не в Next router.

Побайтно с HEAD совпали project page, `globals.css`, root layout, session/register/login/tariff/storage helpers, DB entry и root lockfile. Auth/API, storage, worker, transcribe, widget source и другие продуктовые модули отсутствуют в source diff. Черновики будущих branding/collect вне review scope.

| Приоритет | Выбор | Причина и исполнение |
|---|---|---|
| mustRun | `dashboard-overview.test.ts`, `dashboard-overview-db.test.ts`, `dashboard-visual-fixture.test.ts` | Прямое изменение SSR, SQL, RLS, metrics, tiers, XSS, 0/1/N и fixture. Выполнены. |
| mustRun | `dashboard-onboarding`, `register`, `login`, `login-route`, `auth-primitives`, `email-verification`, `onboarding-email/routes`, `tariff`, `widget-config/install`, `urls` | Транзитивные контракты входа, existing project page/email recovery, ссылок и effective billing. Выполнены в full-web. |
| mustRun | Пять browser cases без permission mutations + собственный browser probe | Живой SSR/session, exact fixture, live/fixture styles, keyboard, long titles, adjacent CSS и expiry/revocation. Выполнены. |
| mustRun | Typecheck; `proofo-visual-paths.test.mjs` | Контракт props/module imports и безопасность новых visual scripts. Выполнены. |
| shouldRun | Остальная web-suite: SSO, password recovery/change, moderation, wall, collect/testimonial, payment/partner, mocked storage | Проверяет соседние use cases при малой стоимости. Выполнена целиком. |
| canSkip | Внешние S3/почта/платежи, service/worker/transcribe integration, отдельный полный widget release E2E | Эти реализации и конфигурация не изменены, dashboard их не вызывает. Не подставлялись реальные credentials. Три существующих S3-теста остаются skipped. |
| Отдельное ограничение | Два browser permission-failure/retry кейса | Не запускались по явному запрету REVOKE/GRANT для этой роли; они не включены в мои 5/5. |

## Фактически исполненные проверки

Все команды выполнялись в `/tmp/proofwall-ui-dashboard` проектным Node 22.23.4. Safe runner программно прочитал `.secrets/dashboard-test.env`, ограничил DB до локальной `proofwall_ui_test` и удалил credentials внешних storage/mail/billing. Значения файла не печатались.

1. `node_modules/.bin/node scripts/run-dashboard-preview.mjs test --maxWorkers=2 --minWorkers=1`: **exit 1**, 921 passed, 1 failed, 3 skipped; 53 test files, 41.62s. Ошибка `reads the whole dashboard in one data statement`: spy увидел 0 вызовов. [Исходный полный лог](qe-regression-artifacts/vitest.log) сохранён без переименования результата в success.
2. Во время этого прогона координатор готовил внешний baseline dependency artifact. После завершения independently checked `require.resolve('pg')`/realpath из web, db и agent-payments указывают на один `/tmp/proofwall-dashboard-baseline-external/node_modules/pg/lib/index.js`. Исходники snapshot не изменились. Повтор только затронутой DB-suite через тот же safe runner: **exit 0, 6/6**, 817ms, [лог](qe-regression-artifacts/db-rerun.log). Первый failure классифицирован как transient instrumentation/setup failure; история разрешения модулей до сбоя не записывалась, поэтому одной временной корреляции не приписывается абсолютная причинная доказанность. Непрошедший полный запуск не объявляется единым «922/922 pass».
3. `node_modules/.bin/node --test --test-name-pattern='dashboard requires|zero and single|live dashboard and fixture|frozen fixture|long Unicode' tools/visual/dashboard.e2e.test.mjs`: **exit 0, 5/5**, 26.57s. [Лог](qe-regression-artifacts/browser.log), [измерения](qe-regression-artifacts/browser-measurements.json). У three viewport fixture ноль отличающихся пикселей; font/margin/color изменения обнаружены во всех трёх размерах. Никаких изменений frozen baseline.
4. [Собственный probe](qe-regression-artifacts/probe.mjs), **exit 0, 11 проверок**: обычный login и single-project overview; переход в project с email recovery, collect/wall links, widget snippet, moderation heading; отсутствие CSS leakage в project/login при 360/390/1440; истёкшая и отозванная собственная session; анонимные fixture/query probes; побайтовые HTTP-font hashes. [Результаты](qe-regression-artifacts/probe.json). Только собственные UUID seed/cleanup. Исходный вспомогательный geometry probe отклонил float разницу 0.000031px; [первоначальный лог](qe-regression-artifacts/probe-initial.log) сохранён. В итоговом probe геометрия округлена до 0.001px, computed CSS сравнивается точно. Это не ослабляет exact visual baseline: её pixel comparison остаётся нулевой.
5. `node_modules/.bin/node scripts/run-dashboard-preview.mjs typecheck`: **exit 0**, [лог](qe-regression-artifacts/typecheck.log). Отдельного lint script у web нет.
6. `node_modules/.bin/node --test scripts/proofo-visual-paths.test.mjs`: **exit 0, 7/7**, [лог](qe-regression-artifacts/visual-paths.log). Проверены baseline/output symlink refusal, fresh-output semantics, absence of demo-only elements.

## Критические пути и дифференциальное покрытие

| Требование/путь | Независимое доказательство | Ограничение |
|---|---|---|
| FR-001: 0/1/N, no redirect, no session | Unit/DB + browser + own session probe | Отсутствующая, expired и revoked session проверены отдельно. |
| FR-002: tenant/active scope | DB A/B tests, real role/GUC/no BYPASSRLS/no ownership/unscoped SELECT; browser foreign route 404; source withAccount | В этой роли не проводился новый mutation campaign security authority. |
| FR-003/006: counts, границы, all-time statuses, names/XSS | DB fixed now: start inclusive/end exclusive, foreign/inactive exclusion, per-pair domains; unit SSR + browser reload/HTML-like titles | Это проверка сценариев, не исчерпывающий перебор всех SQL/JS ветвей. |
| FR-004: unknown/zero/error | Unit rejects DB error, unknown != 0, safe error text, refresh+reset handler | Живой отказ зависимости и retry через permission change здесь намеренно не повторены. |
| FR-005: per-project effective tariff | Unit paid/expired/invalid/free + existing tariff12 + live downgrade/reload | Реальный checkout не запускался. |
| FR-007: project/email recovery | Existing dashboard-onboarding2, onboarding/email/password/login tests, live navigation and persistent recovery link | Отправка реальных писем исключена. |
| FR-008/009: fixture isolation/styles/fonts | 3-size exact pixels, three mutation types, path guards; source boundary + anon HTTP/query probes; fonts byte equality | HTTP probes конечны; отсутствие любых overrides дополнительно проверено source review. |
| FR-010: keyboard/mobile/long names | 360/390/1440 × Unicode/multiline/HTML-like names, Tab/focus/Enter, overflow; own adjacent CSS probe | Chromium; другие браузеры и screen reader не проверялись этой ролью. |

Новые web suites содержат **14 test cases**: 7 unit/SSR + 6 DB + 1 fixture. В полном прогоне 13 новых cases прошли сразу, один DB instrumentation case прошёл при affected rerun; **908 существующих web cases** прошли в полном прогоне, 3 существующих S3 cases skipped. Browser cases и probe assertions учитываются отдельно и не складываются в процент покрытия кода.

**Statements/branches/functions/lines/new-code/differential coverage = не измерены (`null`)**. В workspace нет Istanbul/lcov/coverage-summary artifacts, coverage-конфигурации Vitest и разрешимых `@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `c8`. История `qe-coverage-analysis/run-history.json` пуста. Сравнимого instrumented base/head нет; снижение покрытия на N% или соблюдение порогов 80/90% не доказаны. Установка новых зависимостей и запись history не выполнялись согласно границе роли. Таблица выше — трассировка реально выполненных критических сценариев, не line/branch coverage.

## Остаточные границы и вывод

Продуктовые source, plan, host/history и frozen reference не менялись. Проверки использовали существующий локальный production Next server на 33181 и isolated fixture server на 33182; отдельную сборку и запуск серверов эта роль не производила. Внешние сервисы, production, deploy и ручная приёмка владельцем не проверялись. Не выполнялись REVOKE/GRANT, коммиты или публикация.

AQE runtime 3.15.19 доступен. CLI memory pattern lookup в `learning` вернул 0 entries; результаты не выдаются за применённую память. `dz recall` прочитан; урок о подписи пустого состояния проверен по текущему коду и тестам, не использован вместо доказательства.

Новых условий от `qe-regression` нет. Вердикт clean означает отсутствие собственных подтверждённых регрессионных findings на указанном snapshot при раскрытых ограничениях. Он не отменяет findings других независимых ролей и не является разрешением на production-поставку.

## Focused delta verification — 2026-11-11, после native repair

Новый snapshot: revision `06f4dce82d3e419861bced5377c6c71ae2fc9a42d87f12c219fee9d2dc1c1840`, nonce `690f6976-08de-4023-9747-5782b9c1c20f`. Прочитан фактический [author handoff](dashboard-final/qe-author-delta.json), current host и initial собственный audit. **30/30 текущих SHA совпадают**; относительно initial изменились ровно три dashboard test files и implementation plan. Production source, CSS, fonts, browser harness и нормативные требования неизменны.

Собственная побайтовая проверка дельты: удаление только нового authority-test и обратная замена явных dynamic imports в памяти восстанавливают SHA каждого initial test-файла. Удаление только нового раздела о font twins восстанавливает initial SHA плана. Это подтверждает сохранность прежних assertions, fixture literals и всех остальных plan-условий. Все четыре `TWIN_NOT_A_TARGET` реально побайтно равны соответствующему runtime font; исходные 18 targets сохранены. [Протокол проверки](</tmp/proofwall-qe-regression-focused-binding.json>), SHA-256 `4c9cae06bd7ccf8e791fe27563d68cb7f927a5d493b1bf0a19650bd88fc3f15e`.

Структурная классификация автора корректна: меняется исполняемая защита от регрессии и область планового C9 scan. Новый observer перехватывает фактический `WITH owned` через `Client.prototype.query`, исполняет исходный native query с исходными аргументами и возвращает неизменённый result. Наблюдения before/after используют тот же `this`; для A и B проверяются role/GUC/BYPASSRLS/владельцы четырёх таблиц, одинаковые backend PID и transaction ID. Observer очищается в `finally`. Отдельные unscoped RLS и single-data-statement tests сохранены. Импорты с `.ts/.tsx` остаются точными строковыми путями, type imports стираются; новые runtime overrides, suppression или изменения classifier отсутствуют. SQL observer существует только в тесте и не добавляет product-запросов.

Регрессионный риск этой дельты — загрузка модулей и общая identity `pg` для spy, а не новое поведение UI. Самостоятельно проверено разрешение `pg` из web/db/agent-payments: один realpath `/tmp/proofwall-dashboard-baseline-external/node_modules/pg/lib/index.js`. Новых production имён/экспортов нет; K1 pre-creation заново не объявлялся.

### Независимые focused прогоны

| Проверка | Команда/доказательство | Результат |
|---|---|---|
| Прямые и соседние контракты | `node_modules/.bin/node scripts/run-dashboard-preview.mjs test tests/dashboard-overview-db.test.ts tests/dashboard-overview.test.ts tests/dashboard-visual-fixture.test.ts tests/dashboard-onboarding.test.ts tests/tariff.test.ts --maxWorkers=2 --minWorkers=1` | **exit 0; 29/29**, 5 suites, 0 skipped; 2.63s. DB authority/unscoped/one statement входят в 7 DB cases. [Лог](</tmp/proofwall-qe-regression-focused-tests.log>), SHA `65d7f10bf9f61d906e638742f4ed2419c613727c08236b3ec026a651e9aef4d5`. |
| Typecheck | `node_modules/.bin/node scripts/run-dashboard-preview.mjs typecheck` | **exit 0**, [пустой stdout/stderr](</tmp/proofwall-qe-regression-focused-typecheck.log>). |
| Реальный K2 | `node_modules/.bin/node .agents/skills/feature-adr/scripts/check-plan-completeness.mjs features/proofo-ui --tier=L --require-requirements --acid=A1,A2,A3,A4,A5,A6,A7` | **exit 0; 0 failures, 0 warnings, 0 skips**; 18 targets, 0 unlisted byte-identical twins. [Лог](</tmp/proofwall-qe-regression-focused-k2.log>), SHA `b27d7652ca3a4377d10a52359304f466315bd463cb3f3e59635ebe83e8ae7a21`. |
| Независимый реальный V8 coverage | `/tmp/proofwall-ui-dashboard/node_modules/node/bin/node /tmp/proofwall-ui-dashboard/apps/web/node_modules/vitest/vitest.mjs run --config /tmp/proofwall-qe-regression-coverage-X0je2S/config.mjs`, cwd `apps/web` | **exit 0; 15/15** в 3 suites, 0 skipped; 2.33s. [Metadata](</tmp/proofwall-qe-regression-coverage-X0je2S/metadata.json>), [лог](</tmp/proofwall-qe-regression-coverage-X0je2S/run.log>). |

Full-web повторно не запускался: новая дельта ограничена тестами/планом; прежняя broad regression и текущие focused checks дают подходящее покрытие риска. Сообщённые координатором 923 passed/3 skipped не выдаются за мой повторный full run. Browser/visual/a11y/operations и permission mutations не повторялись; product/browser bytes совпадают с initial snapshot. Проверка чужих исходных условий остаётся у их владельцев, мои `conditions`/`verifications` остаются пустыми.

### Актуальное coverage и его границы

Самостоятельно проверены SHA всех 10 author coverage artifacts, семь source/test before/after bindings, SHA фактического config из записанного argv и сохранённой копии. Воспроизведение использовало тот же реальный `@vitest/coverage-v8@2.1.9`, Vitest 2.1.9, Node 22.23.4, automatic JSX, `all:true`, те же четыре полных production files и три test files. Единственное изменение временного config — `reportsDirectory` на новый `/tmp` каталог. Только loopback `proofwall_ui_test` переменные программно переданы subprocess; значения не напечатаны, fixture output не задан. Все семь input SHA совпали до/после и с текущим snapshot.

Повторный raw `coverage-final.json`, `coverage-summary.json` и `lcov.info` **побайтно совпали** с сохранёнными [raw данными](dashboard-final/coverage/raw/coverage-summary.json). Их SHA соответственно: `998b2dce34bdce888ffd6cf774cb06f8402898ceeafe8a651ade3cbc408a635d`, `6714d429c615e30c9bfccf0e49dbda3d05d81dede46ed2ccd7fd97ae53f3c877`, `d7d9d16c9f8085e4173ef00e8ee850795984946bc91e1b8cbdb6a52106d80f50`. Числители/знаменатели пересчитаны из raw counters и LCOV, а не из числа пройденных tests.

| Область | Lines | Statements | Functions | Branches |
|---|---|---|---|---|
| Четыре production файла целиком | 91/91, 100% | 91/91, 100% | 6/6, 100% | 40/42, 95.23% |
| `dashboard-summary.ts` | 39/39, 100% | 39/39, 100% | 2/2, 100% | 24/26, 92.30% |
| `page.tsx` | 8/8, 100% | 8/8, 100% | 1/1, 100% | 4/4, 100% |
| `error.tsx` | 12/12, 100% | 12/12, 100% | 2/2, 100% | 3/3, 100% |
| `dashboard-overview.tsx` | 32/32, 100% | 32/32, 100% | 1/1, 100% | 9/9, 100% |

Пороги текущего scoped run (80% общий scope, 90% каждый critical summary/page/error) выполнены. Две непокрытые ветви честно сохранены: `count()` defensive throw при невалидном счётчике, L12; label «Платный» для только paid walls, L53. Это остаточные тестовые пробелы, не новая production-регрессия данной дельты. CSS, SQL engine semantics, внешние DB/session/tariff helpers, browser error recovery и сила assertions не входят в эти проценты. **Differential coverage/trend относительно instrumented pre-feature base всё ещё не измерены**; 100% lines нельзя выдавать за отсутствие падения покрытия или полное покрытие всех бизнес-ветвей.

Bound installed discrimination report самостоятельно прочитан: `measurementValid=true`, три `DISCRIMINATES_VIA_ERROR`, baseline file-load failures соответствуют отсутствующим feature modules, каждый TIP control зелёный 7/7/1. Это ограниченное свидетельство различия загрузки base/tip, не красные бизнес-assertions baseline. Эта роль не запускала classifier повторно и не присваивает себе closure `QE-PRIMARY-1`; существующий onboarding остаётся preservation evidence, а не дискриминирующим тестом новой feature. Аналогично новый authority-test проверен исполнением и кодом, но closure исходного `QE-RISK-1` принадлежит его originating reviewer.

**Итог focused review:** actual author assessment проверен; `deltaVerification.classification=structural`, `implementationVerified=true`. Собственные initial conditions `[]` сохранены, новых подтверждённых регрессионных рисков не выявлено, verdict **clean**. Новые ограничения покрытием и зависимостями раскрыты выше. В репозитории эта роль обновила только собственные `qe-regression.md` и `qe-regression-entry.json`; app/plan/host/history/общий receipt не изменяла.
