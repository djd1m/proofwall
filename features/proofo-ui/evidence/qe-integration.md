# Независимое QE интеграции dashboard

**Актуальный focused product review, 11.11.2026:** clean на revision `06f4dce82d3e419861bced5377c6c71ae2fc9a42d87f12c219fee9d2dc1c1840`, nonce `690f6976-08de-4023-9747-5782b9c1c20f`. Author assessment независимо проверен; structural delta implementationVerified=true. Собственный повтор: 17/17 tests и typecheck exit 0; 30/30 snapshot hashes совпадают. Новых условий данной роли нет. Подробности текущего focused review — в заключительном разделе; ниже сохранена история initial review.

## Initial review: исходная ревизия

Дата: 11.11.2026. Роль: `qe-integration`, family `codex`; новая сессия `gpt-6-astra xhigh` по dispatch, автор реализации `gpt-6.1-sol high`. История написания реализации не передавалась. Вывод: **clean в пределах данной роли**, новых самостоятельных условий нет. Это не общий GO и не production-приёмка; замечания остальных ролей сохраняются у их авторов.

Привязка: revision `4fb5f45771da845cfb31b82638322ed64f90d265402c5ac42f99e9125c77a72c`, nonce `c31c4bbe-bef2-49ee-9d89-863decf9f99b`. SHA-256 всех 30 manifest paths независимо сверены до и после проверки: расхождений нет. Код, план, baseline, host, history и общий receipt не изменялись. Branding/collect drafts не входили в scope.

## Источники и метод

Прочитаны AGENTS/CLAUDE, workflow, review-policy/model-matrix, core-CJM, применимые security/coding/testing rules, Direct integration protocol, полные `enterprise-integration-testing/SKILL.md` и `qe-coverage-analysis/SKILL.md`. Сопоставлены `01_requirements.md`, OpenSpec dashboard-overview, оба ADR, domain model, архитектура и implementation plan с реализацией и тестами. Авторские выводы не использовались вместо чтения кода и запуска проверок.

Локальный AQE CLI действительно доступен: `3.15.19`. Lexical `memory search --pattern '*dashboard*' --namespace learning --json` вернул пустой список; память AQE не объявлена применённой. `dz recall --json` вернул полный текст уроков email recovery и deactivated-only empty state; они проверены по коду и тестам. История coverage пуста; проценты line/branch coverage и тренды не вычислялись. Анализ покрытия здесь сценарный и основан на рисках границ, а не на числах покрытия. Общая history навыка не редактировалась: роль уполномочена писать собственное evidence, не менять общую историю.

## Цепочка интеграции и фактические доказательства

| Граница / требование | Проверенные файлы и сценарий | Результат |
|---|---|---|
| Session → account, FR-001/009 | `apps/web/src/app/dashboard/page.tsx:11–14`; `current-session.ts`; `session.ts`. Вход обычной формой; запрос без cookie и с fixture/account query; revoked/expired выданная сессия | Собственный HTTP: anonymous/revoked/expired возвращаются в `/login?next=/dashboard`, данных нет. Действующая сессия открывает обзор без редиректа в проект |
| Account → RLS → SQL, FR-002 | `dashboard-summary.ts:19–38`; `packages/db/src/tenant.ts`; `dashboard-overview-db.test.ts` | Собственный targeted прогон проверил роль/GUC/non-owner/no-BYPASSRLS и прямые unscoped SELECT четырёх таблиц; A/B и active filters дают ожидаемые карточки и aggregates |
| Единая проекция и метрики, FR-003/004/006 | `dashboard-summary.ts:20–38,58–63`. Один data SQL statement, `[start,end)`, all-time 4 статуса, independent aggregates | DB tests проходят границы окна, одинаковый домен двух проектов, повтор пары, чужие/inactive children, total=4/pending=1. Собственный HTTP подтвердил `—, —, 2, 2` и 4/1 на живом SSR |
| SQL → effective billing/name, FR-005/006 | `dashboard-summary.ts:39–56`, существующий `tariff.ts` | Unit cases valid/expired/invalid/at-now, name fallback и SSR escaping проходят. Собственный HTTP после UPDATE только своих rows показывает новое имя и 1 free/1 paid |
| SSR → pure view, ADR-002 | `dashboard-overview.tsx:14–43`; в view нет cookies/DB/env/network/сырого HTML; import model в loader — `import type` | Live модель не выдаёт demo limit/price или неизвестную метрику за 0. Literal fixture отделена от live loader |
| Overview → real project → email recovery, FR-006/007 | `dashboard-summary.ts:42,49–56`, `dashboard-overview.tsx:33`; неизменённый `[slug]/page.tsx` | Собственный browser открывает точный проект, snippet виден; чужой project URL даёт 404. `email_delivery=not_configured` показывает notice, recovery открывает `/verify-email` с email текущего аккаунта; отправка не инициировалась |
| Project links | Существующие `/f/<slug>`, `/w/<slug>` | Собственный HTTP даёт 200 на обоих адресах синтетического проекта |
| Ошибка → настоящий refresh/reset, FR-004/010 | `error.tsx:7–16`, `tools/visual/dashboard.e2e.test.mjs:151–184`; `dashboard-overview.test.ts` | Независимый unit повтор подтвердил propagation и оба вызова `router.refresh()`/`reset()`. Проверены исходники и сохранённый свежий root E2E: summary permission failure после валидной session и отдельный session-store failure проходят восстановление кнопкой. REVOKE/GRANT повторно не выполнялись |
| Dashboard CSS → другие страницы, ADR-002 | `dashboard.css:4–14` и scoped selectors | Собственный реальный browser на 1440×900, 390×844, 360×800: из overview открыт project route; computed styles body/main/h1/brand/card/button совпадают до и после дополнительной загрузки того же dashboard CSS. Wrapper отсутствует на project route |
| Fixture ≠ production route, FR-009 | `scripts/render-dashboard-fixture.mjs:11–25`, `dashboard-visual-fixture.test.ts`, app route tree | Static renderer слушает loopback, разрешает только 5 путей; app не читает fixture env/query/header. Собственный HTTP к `/dashboard.html`, `/__test/dashboard`, `/dashboard/dashboard.html` даёт 404; anonymous query override не обходит login |
| Service boundaries, FR-007/009 | Новый loader/view/route, git status существующих packages/services/widget/project modules | Новых обращений к email/payment/storage/STT нет; перечисленные сервисные исходники не изменены. Собственный browser не предпринял ни одного внешнего запроса; это утверждение только о браузерном trace, серверный вывод дополнен чтением исходников |

Точные команды собственного повторного запуска:

```sh
node_modules/.bin/node scripts/run-dashboard-preview.mjs test tests/dashboard-overview.test.ts tests/dashboard-overview-db.test.ts tests/dashboard-onboarding.test.ts
node_modules/.bin/node /tmp/qe-integration-probe.mjs
```

Результаты: **15/15 targeted tests**, **11/11 собственных browser checks**, **3/3 viewport CSS comparisons**. Probe читает только `.secrets/dashboard-test.env` программно, проверяет loopback и имя isolated БД, не печатает окружение, создаёт отдельные UUID accounts/projects и удаляет свои accounts в `finally`. Свой issued session изменяет только через собственный account UUID; общих privileges не меняет. Копия исполнявшегося probe: `qe-integration-http-probe.mjs`. Сырые результаты: `qe-integration-targeted.log`, `qe-integration-http.json`.

## Покрытие и ограничения

Свежие общие root logs прочитаны отдельно: `dashboard-final/web.log` — 922 passed и 3 прежних S3 skipped; `dashboard-final/e2e.log` — 7 passed, 0 skipped. Это просмотренные чужие результаты, не объявленные собственным повтором 925 тестов. Сохранённый E2E и исходники доказывают actual refresh/reset последовательность; данная роль не воспроизводила REVOKE/GRANT, чтобы не конфликтовать с отдельными мутациями БД.

Новые интеграционные дефекты не обнаружены. Мутационная достаточность привязки actual summary к `withAccount` и полнота dependency/baseline guards не объявляются закрытыми этим clean: эти области остаются в формальных условиях `qe-risk`/`qe-primary`. Текущая реализация действительно вызывает `withAccount`; проверка самого wrapper и успешные aggregate tests не равнозначны доказательству того, что любая замена authority будет отклонена тестами.

Доказательство CSS isolation относится к вычисленным стилям перечисленных элементов и трём размерам viewport; это не полный pixel diff project page. Static fixture служит отдельному визуальному контракту и не засчитана как session/SQL integration. Общий accessibility/manual brand review, frozen visual acceptance и доступность S3 здесь не переоценивались. Внешние письма/платежи/STT/production не вызывались, новый private staging на 33183 не проверялся. Привязка frozen manifest подтверждает перечисленные 30 файлов, не даёт автоматического охвата не включённых в него dependencies.

Начальный JSON entry записан с `conditions: []`, `verifications: []`, `authorAssessmentChecked: false`, `deltaVerification: null`. При следующем focused review требуется новый фактический author handoff и текущая snapshot-привязка; прежний clean не переносится на изменённые байты автоматически.

## Focused product verification: revision 06f4dce8

Проверка выполнена после реального native round-1 evaluation и prepare-repair. Текущий host прочитан, не изменялся: revision `06f4dce82d3e419861bced5377c6c71ae2fc9a42d87f12c219fee9d2dc1c1840`, nonce `690f6976-08de-4023-9747-5782b9c1c20f`. До и после собственного прогона сверены все **30/30** SHA; расхождений нет. Собственные исходные conditions пусты; `QE-PRIMARY-1` и `QE-RISK-1` не переопределяются и не подписываются за originating reviewers. Formal entry этой роли остаётся clean, conditions/verifications пусты, `authorAssessmentChecked=true` и structural `deltaVerification.implementationVerified=true`.

Прочитан actual `dashboard-final/qe-author-delta.json`, SHA `f82c78020e37e9fefc13e8680d115ba899bc7de970b06729376fafb51cbc2838`, включая author newRisks. Изменения независимо сопоставлены с current files, исходными прочитанными тестами и их initial snapshot SHA. В памяти процесса обращены **только** заявленные import edits и добавление одного authority test; результат побайтово восстановил исходные SHA всех трёх файлов:

| Файл | Initial SHA, восстановленный обращением только declared delta |
|---|---|
| `apps/web/tests/dashboard-overview-db.test.ts` | `e8d0b76cf4c1b7b93631f821c1802d662f17ad5c53b1ce6463c1cb933c98a849` |
| `apps/web/tests/dashboard-overview.test.ts` | `d3baf494d1b180ae9754f95891ca092e4c060d532182a73ebcb5095052ddcbca` |
| `apps/web/tests/dashboard-visual-fixture.test.ts` | `4123bfbf888c331e78bd92594a9a6999f5bed378b736af67a74555382a287669` |

Это сверка точной дельты без редактирования файлов: остальные assertions, test data, all-time/window cases, original RLS proof, single-statement proof и frozen literal model не ослаблены. Production summary/view/page/error/CSS/font bytes соответствуют ранее проверенной реализации; новые пути, permissions или HTTP overrides не вводились.

### Actual authority и границы новой проверки

`dashboard-overview-db.test.ts:64–122` теперь наблюдает именно вызов `getDashboardSummary`, а не отдельно вызванный wrapper. Spy запоминает настоящий `Client.prototype.query`, для `WITH owned` выполняет observer SELECT через исходный метод на том же `this` до и после неизменённого data SQL с исходными args, возвращает исходный result. Для аккаунтов A и B независимо проверяются ровно одно наблюдение, app_authenticated, tenant GUC соответствующего account, отсутствие BYPASSRLS, полный набор четырёх table owners без текущей роли, положительный backend PID и одинаковый transaction ID до/после. `finally` восстанавливает spy. Следующий single-data-statement test выполняется без diagnostic observers и по-прежнему требует ровно один data query.

Новые observer SELECT не меняют production SQL и не ослабляют исходные checks. Их выполнение только в isolated PG tests вместе с `txid_current()` ограничено тестовой транзакцией. Привязка к имени CTE консервативна: изменение распознаваемой структуры приведёт к отказу `observed.length`, а не к зелёному пропуску authority assertions.

Прочитаны реальные mutation/control stdout и exact diff из `/tmp/proofwall-qe-authority-{control,mutant}.log` и `/tmp/proofwall-qe-authority-product-mutant.diff`: control 7 pass; замена только withAccount на withService оставляет account WHERE и даёт 6 pass/1 fail, конкретный assertion `app_service` != `app_authenticated` на новой проверке. Это просмотренный авторский directed mutation, не объявленный собственным мутированием или baseline discrimination. Собственный current source повтор 17/17 отдельно подтверждён ниже; originating risk reviewer отвечает за formal closure его условия.

### Imports, plan и raw proof

Literal dynamic imports содержат точные `.ts`/`.tsx`, `as string` и erased `typeof import` для типов. Нового app feature flag, mock withService export, suppression или classifier patch нет. Собственные SSR/error/unit/fixture проверки проходят с настоящими импортируемыми модулями; unit mock-state и renderer сохраняют ожидаемое поведение.

Plan-before-twin-waiver SHA `b7401a66bc10f02a67e10ff66f64bd5e6e9762173e8b8bb29877762d81731d72` совпадает с initial snapshot. Удаление **только** добавленного раздела о шрифтах из текущего плана даёт точное равенство исходному плану. Все 18 targets сохранены; добавлены ровно четыре reasoned TWIN_NOT_A_TARGET для неизменяемых prototype/baseline fonts. Независимые hashes подтверждают, что runtime/preview/reference body font везде `d46c189e06e905afb249cac3de1e6f532ddc7b7bcf046193027f6bfd22a0d985`, display font — `21f1068a46ae7111c5887098ec1aa173204d0a72585d1f8cff99d38ac3833158`. Это исключение immutable reference из целей правки, не разрешение менять baseline. Проверены actual K1 no-new-names rebind и original-evidence link; raw canonical K2 показывает 0 failure/warning/skip и 18 targets. Новый pre-creation FREE не утверждается.

Из `discrimination-repair.json` SHA `cbfddddfd885193f23bdcf8e0e6fbfe8971d5aab580f8507cd51a946bbe66d59` прочитаны именно результаты base/tip, их stdout/stderr и same-run dependency diagnosis. Для трёх файлов base не может загрузить отсутствующий новый summary/view, TIP исполняет 7/7/1 тестов успешно. `measurementValid=true`, aggregate и три perTest = `DISCRIMINATES_VIA_ERROR`, без CANNOT_ISOLATE. Значение ограничено load-error inference; это не baseline assertion proof и не mutation score. Onboarding остаётся preservation coverage, а не доказательством новой feature. Installed discrimination в этом focused integration ходе заново не запускался; formal closure первичного условия остаётся владельцу `qe-primary`.

Raw coverage сверена по всем SHA из artifact-sha256.json; source/test hashes before/after совпадают с текущими файлами. Config действительно измеряет целиком только четыре product-файла (`all:true`), actual V8 provider, без CSS/существующих helpers/E2E в знаменателе. В raw summary **91/91 lines, 40/42 branches (95.23%), 6/6 functions**; summary **24/26 branches (92.30%)**. В raw coverage-final ровно две непокрытые ветви summary: defensive count throw на L12 и all-paid label на L53. Они раскрыты, не выдаются за покрытые; coverage не заменяет проверку качества assertions. Raw coverage-final SHA `998b2dce34bdce888ffd6cf774cb06f8402898ceeafe8a651ade3cbc408a635d`.

### Собственные повторные проверки и риск

```text
node_modules/.bin/node scripts/run-dashboard-preview.mjs test \
  tests/dashboard-overview.test.ts tests/dashboard-overview-db.test.ts \
  tests/dashboard-visual-fixture.test.ts tests/dashboard-onboarding.test.ts

dashboard-overview-db: 7 passed
dashboard-overview: 7 passed
dashboard-visual-fixture: 1 passed
dashboard-onboarding: 2 passed
Test Files 4 passed; Tests 17 passed; skipped 0
Start 2026-11-11 20:49:16 UTC; duration 3.73s

node_modules/.bin/node scripts/run-dashboard-preview.mjs typecheck
exit 0, stdout/stderr empty
```

Собственные raw logs оставлены вне product files: `/tmp/qe-integration-focused-product.log`, SHA `ee59f32f78d0214a8933c0c8416447dca5053f032fd9f11360cb0edd44ebb2f1`; `/tmp/qe-integration-focused-typecheck.log`, SHA пустого файла `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. Прочитан root `web-after-repair.log`: 923 pass, прежние 3 S3 skipped; это не собственный полный повтор. REVOKE/GRANT, новые servers, изменение app bytes, credentials output и публикация не выполнялись.

Новых серьёзных интеграционных рисков от delta не выявлено. Author newRisks согласуется с фактическим ограничением изменений тестами/планом; два coverage gaps остаются открыто названными ограничениями, пороги не переопределялись. Session→withAccount→SQL→SSR→project-link цепочка и error/CSS/runtime bytes не менялись, поэтому исходные самостоятельные browser доказательства остаются релевантными к неизменённому runtime; они не объявлены повторно выполненными в этом ходе. Закрытые ops-отчёты не менялись и не используются вместо product convergence. Обновлены только собственные `qe-integration-entry.json` и данный отчёт; host/history/global receipt остаются координатору.
