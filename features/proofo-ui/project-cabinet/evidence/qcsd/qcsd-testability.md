# QCSD ideation: проверяемость требований

**Результат: CONDITIONAL**, три структурных условия HIGH. Это независимый статический precode review, не приёмка работающего продукта. Configured model `gpt-6.1-terra`, reasoning `xhigh`, `fork_turns=none`; provenance задан конфигурацией запуска, provider telemetry недоступна. Роль `qe-requirements-validator` прочитана полностью из закреплённого upstream commit `98f241fc8b9d48d017cbdb63ab890104e30397d0`; `git show ... | sha256sum` = `a200582b09f8b95d9671089f439135e2de39bf37b1b0da2dc6a89ac6449dc7e6` совпадает с role-references.json. Прочитаны QCSD skill, шаги 02–03, установленный `qe-requirements-validation/SKILL.md` и проектные policy/integration. Claude-only learning-команды здесь не выполнялись: этот запуск через collaboration, по заданию никакой код, provider, сервер или тесты не запускались. Выводы STATIC; хеши получены командами `sha256sum` и `git show ... | sha256sum` (EXECUTED как чтение и измерение, не продуктовая проверка).

## Условия

1. **TST-01 HIGH, STATIC — состояние после мутаций и повторной загрузки.** `05_architecture.md:7–16` и `04_domain_model.md` требуют server projection, сохранения client state/props и progress по persisted items/installs, но не задают момент и механизм согласования после успешных import, moderation и installation, либо точный допустимый refresh пользователем. `ModerationList` инициализирует локальное состояние из `initial` только в `useState` и обновляет только его (`moderation-list.tsx:53–69`); формы после успешного ответа обновляют лишь свой локальный success (`platform-form.tsx:91–100`, `import-form.tsx:26–35`); server `pending`/installs — отдельные первоначальные данные (`page.tsx`). **INFERRED:** повторная передача props/refresh без явной синхронизации не гарантирует согласованность карточек, badge и шагов, причём full reload может стереть draft. Уточнить в architecture/domain и связанных требованиях наблюдаемую границу (включая явно допустимую ручную reload, если она выбрана), обработку изменившегося `initial`, сохранение черновиков при switching/refresh, server-authoritative успех, ошибки/409 и concurrent изменения. В соответствующем уже именованном `project cabinet preserves intake moderation and provenance` в `tools/visual/project-cabinet.e2e.test.mjs` зафиксировать конкретную последовательность: два разных intake, moderation и внешнее изменение/обновление props, проверка persisted records/card/badge/steps до и после оговорённой границы, затем failed mutation без ложного обновления и с сохранением вводимых данных. Условие не требует немедленного обновления, если утверждён другой честный UX.

2. **TST-02 HIGH, STATIC — ошибка SSR и 404 не разведены именованным oracle.** `05_architecture.md:6–9` правильно требует null для absent/foreign/inactive и не подменять query error пустыми данными; `04_domain_model.md` различает query failure и empty. Однако `06_implementation_plan.md:11` называет loader test с owner/foreign/missing/inactive и SQL role/GUC, без инъекции ошибки каждого чтения и независимого наблюдения ordinary HTTP. Уточнить контракт и добавить к `project cabinet loader enforces owner role and active scope` (`apps/web/tests/project-cabinet.test.ts`) и/или именованному live test точные oracle: настоящая ошибка project/items/installs ведёт к наблюдаемой ошибке/5xx или error boundary по выбранному контракту, не 404, не пустому успешному кабинету, не частично достоверному успеху; zero rows для существующего active проекта остаётся 200 с настоящим empty. Не требовать вывода SQL/секретов. В реализации исключить подавление ошибок, определить поведение повторного запроса; отрицательная мутация «catch → null/empty» должна падать.

3. **TST-03 HIGH, STATIC — охват A13 не следует из именованного guard.** `00_complexity_assessment.md`, A13 обещает запрет реальных provider calls и отказ outbound quarantine при escape; `05_architecture.md:28` требует synthetic-only/no external providers. `06_implementation_plan.md:10,17` объявляет A13 покрытым guard `branding QA runner refuses unsafe configuration` в `apps/web/tests/branding-collect-schema.test.ts`. Его статическое содержимое проверяет allowlist env, нормализацию, безопасность файла и отказ до spawn; это не проверка реального outbound пути. Нужна привязка к уже запланированному тестовому файлу и **именованному oracle** с чёткой границей наблюдения: как изолируются и перехватываются попытки email/payment/STT/storage в browser и server процессе, какой отрицательный synthetic sentinel демонстрирует срабатывание и как учитывается недоступное наблюдение; если наблюдение части процесса отсутствует, явно ограничить claim, обеспечить подтверждаемое исключение вызовов другим способом и не маркировать непроверенное как pass. Существующий config guard сохранить отдельно. Не призываем делать реальные запросы.

Все три условия привязаны к измеренным architecture/domain/complexity, план и существующие файлы — дополнительные источники; план не входит в восемь measured paths. Pending owner decision не является продуктовым дефектом: CP0 правильно блокирует product source writes до одобрения точного proposal и invariant regions. Условия не подменяют этого решения.

## Явный счёт и traceability

Рабочий score **85/100 = 34/40**: единица анализа — 10 нормативных PC; по 4 бинарных признака: P = позитивный наблюдаемый исход, E = предусмотрены отрицательный/граничный случай, N = в плане назван тест и путь для основной проверки, L = конкретна значимая граница жизненного цикла/ошибки. 1 означает, что признак задан в спецификации плюс связанном плане; 0 — обнаруженная выше существенная неопределённость. Это ручная оценка требований, не результат тестов и не официальная взвешенная INVEST/SMART формула upstream.

| PC → FR | P E N L | Сумма/4 | Основной плановый named oracle / ограничение |
|---|---:|---:|---|
| PC-01 → 301 | 1 0 1 0 | 2 | loader owner role/active; нет injected SSR failure и его HTTP исхода (TST-02) |
| PC-02 → 302 | 1 1 1 1 | 4 | ordinary persisted cabinet; existing dashboard-onboarding test |
| PC-03 → 303 | 1 1 1 0 | 3 | preserves intake moderation and provenance; refresh/initial (TST-01) |
| PC-04 → 304 | 1 1 1 0 | 3 | preserves intake…; reports failed uploads and conflicting moderation; refresh/initial (TST-01) |
| PC-05 → 305 | 1 1 1 0 | 3 | exposes links before first review; retains account recovery billing password and share; install projection (TST-01) |
| PC-06 → 306 | 1 1 1 1 | 4 | retains account recovery billing password and share; transport fixtures не provider integration |
| PC-07 → 307 | 1 1 1 1 | 4 | retains account recovery billing password and share; real local synthetic session |
| PC-08 → 308/NFR-301 | 1 1 1 1 | 4 | live project cabinet keeps terracotta chrome and custom public branding; controls remain accessible with long content |
| PC-09 → 309/NFR-302 | 1 1 1 1 | 4 | reference refuses overwrite symlinks and altered source; visual gate rejects font spacing and color drift; fixture imports production view without runtime bypass |
| PC-10 → NFR-303 | 1 1 1 0 | 3 | branding QA runner refuses unsafe configuration; outbound observer не определён (TST-03) |

В именах выше общий live путь `tools/visual/project-cabinet.e2e.test.mjs`, остальные точные пути находятся в `06_implementation_plan.md:10–17`. Наличие именованного будущего oracle не означает его реализации или успеха. Сценарии: **20/20 присутствуют** (по 2 именованных scenario на PC-01…PC-10). Полнота без существенных пробелов по приведённой шкале — **5/10 PC = 50%** (PC-02, 06–09 имеют 4/4; остальные 5 частичны). Это не coverage реализованных тестов. Проверено, что A1–A13 перечислены в плане, но не принимается равенство перечисления и реально подтверждённого покрытия: для A13 есть TST-03. Все 20 exact code targets указаны в конце плана; наличие/выполнение не утверждается.

## Pipeline роли: 13 шагов

Оценки в таблице — экспертная ordinal 0–100 по рассматриваемому артефакту, кроме явно вычисленного testability; не измерения продукта. Блокирующие format/completeness/holistic не провалены: структура есть, 10 PC и 20 сценариев присутствуют, противоречие с владельческим pending отсутствует. Процесс может завершить анализ с CONDITIONAL, но код до устранения условий и CP0 не допускается.

| # | Шаг | Статус | Балл | Находок | Основание |
|---|---|---|---:|---:|---|
| 1 | Format | PASS | 100 | 0 | PC/scenario, FR mapping, plan/test paths присутствуют |
| 2 | Completeness fields | PASS | 100 | 0 | 10/10 PC и 20/20 сценариев имеют структуру |
| 3 | INVEST | WARN | 70 | 1 | ценность и decomposable tasks есть; зависимые PC/неопределённый lifecycle препятствуют полной независимости и sizing |
| 4 | SMART | WARN | 70 | 3 | измеримые контрасты/ширины и действия есть; TST-01–03 не определяют достаточно точное наблюдение |
| 5 | Testability | WARN | 85 | 3 | 34/40 по таблице выше |
| 6 | Vague terms | WARN | 75 | 2 | «сохраняют props/state machines», «errors не empty» без временной и error boundary детализации |
| 7 | Information density | PASS | 90 | 0 | FR привязаны к нормативной дельте, plan содержит реальные действия |
| 8 | Traceability | WARN | 75 | 3 | именованные tests есть; пробелы oracle TST-01–03 |
| 9 | Implementation leakage | WARN | 80 | 1 | сценарии в основном о поведении, некоторые NFR диктуют технические boundary как осознанную security constraint |
| 10 | Domain compliance | PASS | 90 | 0 | сохранены существующие четыре состояния, ручной/CSV intake и единственный платный tier |
| 11 | Dependencies | WARN | 75 | 1 | связи задач заданы, reconciliation mutable props не определён |
| 12 | BDD | WARN | 75 | 3 | 20 исходных сценариев пригодны для уточнения; ниже три точных дополнения |
| 13 | Holistic | PASS | 80 | 0 | precode решение владельца отделено, нет заявления об успешных product tests |

INVEST — V и разбиение на задачи читаются; независимость и оценимость ограничены общим state lifecycle, negotiability ограничена обязанностью сохранить контракты, Small без оценки конкретной команды не доказан. SMART — S/M частичны для указанных условий, A ограничена отсутствием реализации/provider проверки, R есть, T выражено событиями и checkpoint, а не SLA. Время ответа не выдумывалось.

## Предлагаемые BDD-примеры, не исполненные тесты

```gherkin
Scenario: Источником актуального списка остаётся сохранённое состояние
  Given активный проект с открытыми черновиками ручного и CSV ввода
  When владелец успешно добавляет отзыв и выполняет определённое архитектурой обновление
  Then card, badge и completion соответствуют сохранённым данным на оговорённой границе
  And незавершённые данные сохраняются в соответствии с утверждённым контрактом
  When запрос модерации получает 409
  Then не показывается ложный успех и остаётся доступной оговорённая коррекция

Scenario: Ошибка чтения отличается от пустого проекта
  Given активный принадлежащий владельцу проект без отзывов
  When SQL чтение успешно
  Then HTTP показывает пустой список, а не ошибку
  When чтение project, testimonials или installations завершается ошибкой
  Then HTTP даёт выбранный явный error outcome без ложного 404 или empty success

Scenario: Изоляция исходящих вызовов проверяется отдельно от config guard
  Given синтетический runtime и выбранный наблюдатель допустимых процессов
  When подаётся контролируемая попытка запрещённого synthetic outbound
  Then наблюдатель сигнализирует отказ без реального provider call
  And отчёт отмечает ненаблюдаемые области и не записывает их как pass
```

## Входы и ограничения доказательств

Независимое `sha256sum` совпало со всеми 8 строками host manifest (nonce `0fef60e0-1ec5-4cd4-b693-c9991c49a4cc`, revision `a02e007567b6e585aee8f6a15b2d563d21c6bd0e54207cd6ebfb1e43ee0cfa62`): 00 `86e6ca35254d7fe7defc12d068e597b84d3f2b60a21c41d6259582b00bc1007d`; 01 `572d68fb62307f755824d09d1e55cbfe3c2df9389c10de6b165ec2366b660a53`; 02 `d15adf498857d82350df96822626444e896f8451c85c114f3554b64f2d5a6ba0`; ADR-001 `fb4ef2e82a09d3449203691f629b191dd3ad46b155ab6bb234f3296e09f69375`; ADR-002 `68287d023834f6194860bfa3f220cf1a1ef61ff69b805de3918427ccd8c53556`; ADR-003 `1028ab4bfd082c82bc742eb909a368fb0a7739cc5a7bb1167308747c25e97c29`; 04 `c2c6b701b5161b34d910ba002ed4397a3e0bbe9a13db2427c9ef50f4c3546742`; 05 `6e6453b2325ad89f0326cebfda40072470cecf2c65f165d4f9d7987702452a62`.

Дополнительные, не measured prepare: spec `aa16c0134dbd7decdc4e7d1ec8f7c323a0f79df0436a196bb32b87fb1b7e4ff7`; plan 06 `f6a4eb1601e4683a1478ce05130a71ee3d8b54eac926ef97cee843fdc9b87efd`; design adaptation `c83260191723fc8cfe78e387d5429c4cb08021aac2d544484f906b3dabec9143`; preview README `963274ca9b665236f5addbcc8c3942f67472a414a2bfe531605492b170bb1d4c`; requirements validation skill `e2af956e3097a36ac8f796d660a4199cb58857ee65c8db2a8de3b1a2381e4fe8`. Existing components `apps/web/src/app/dashboard/[slug]/`: page `86be10119cd89198d0709fcc90870b1a97a662d0804ef3603e3500841a587ac6`; moderation-list `2491f0adc20556c6b42ecd90d756867d5d68dc0ed277073fbeaf8b3775758a0d`; import-form `eb31877814364a440c84e34a3511c5ca39ed44de73be9f2bb6c7d4491548a947`; platform-form `e7275234e413c2fb34faf0281c903f613e76fc1bd27be458cdd51a92c7fffb14`; billing-block `b4172b4a5e0a91ca7328b97c55142267c99c528b87114293b1f9b5578393a472`; n3-status `76610c6917f4a70d821566ab221f1b08f1cf88ba2a6af6326707dfbe62f5a2ae`; share-cta `9e8b4b7c6ef256f14b850ae2fe7a0ad931448a71b1db65e5e9ba7f4c3613ebb4`; change-password `9992520120a3a879e32ffc9806b80430d2bbf650ea130e8c201e7d2061161d1d`. Guard test/source and skill step paths were read statically; their digests are recorded in the companion entry evidence if measured. No owner approval, active provider interaction, SQL execution, UI test, screenshots or production behavior claimed.

Дополнительные хеши: `apps/web/tests/branding-collect-schema.test.ts` `d7b11d446faf020e13687f47b7f10ae4702b41889f8f06cb7f275afed839a3fa`; `scripts/run-branding-collect-preview.mjs` `d2f3fe6bc480c444de0aadfc1701b42c6b2d2b5bea7ac80f04a981cd4fafdd37`; QCSD `SKILL.md` `4f9958206be90609a06e5709d486d71cccfcf79799ef450278b15e26af8c9227`, steps 02 `512308d211773383249c485402aa7c36f550dad2fc7a6a73b19ca80162347138`, 03 `ddaf64b2bff27081954577b97968f2ce181c41d3f2386364a2de0b9ec311cd5b`; `PROOFWALL-INTEGRATION.md` `8f0c93232987f4a0bf617240ae58456db49cd93658f6210364a44dd0d437b2c0`; `docs/review-policy.md` `cec8a1e6719a70fb00b088b1eacdd2013be33a019e2ba375e8d64e95cca88674`; `docs/model-matrix.md` `d896899d857c56df5c926f7456a8d05496395b15a90221162d415e1a29eb9d3a`; `AGENTS.md` `cdccf7657741755959d31065a3c4da4ef088e6e78b220d119468f3adcd14d4a2`; `role-references.json` `659d064f5f78acfd5511c7aef76816ed58cdf3c524d8e66fd5bca0eefc882707`.

## Focused повторная проверка rework — 2026-11-12

**Результат своей роли: design-условия TST-01, TST-02 и TST-03 независимо подтверждены на ревизии `963294a11da2550521f81059a16fa1fc76420c06623aab200d5f916a6c80c009` / nonce `733ac1ec-9eb4-45bb-bbbc-e8391ed7f4ca`; новых material условий своей роли не обнаружено.** Исходные условия сохранены дословно в JSON, исходный отчёт и прежний показатель выше относятся к первоначальной ревизии; это не повторное измерение runtime. Оценка author new risks и все 8 изменённых design paths прочитаны, авторское `addressed` не использовалось как доказательство closure. Подтверждение `implementationVerified:true` означает только проверку документов и плановых oracle в ideation.

- **TST-01 — подтверждено STATIC.** `04_domain_model.md` и `05_architecture.md:36–40` задают explicit full reload после успешного intake/install с предупреждением о потере drafts, отсутствие искусственного нового item до него, server-confirmed moderation item+badge и сохранение состояния при ошибке/409; changed/same `serverSnapshotRevision` меняет только список либо сохраняет state и intake drafts. Steps остаются навигацией без неподтверждённых completion галочек. PC-04 описывает то же, AM-4 привязывает это к `project cabinet refresh reconciles items counts and installs` в `tools/visual/project-cabinet.e2e.test.mjs`. После reload сохранение drafts не обещается.
- **TST-02 — подтверждено STATIC.** `05_architecture.md:50–52`, domain и PC-01 явно различают успешный отсутствующий owned/active project от ошибки каждого из project/testimonials/widget_installs SELECT; ошибка означает rollback и generic boundary без partial/empty/404, true-empty active возвращает успешный empty. Учтён Next streamed 200 с реально видимым error boundary, отдельно от обычного успеха. Указаны scoped DB fault, restore, повторный запрос и отрицательная мутация catch→null/empty; AM-5 называет `project cabinet read failures do not become empty or not found` в `apps/web/tests/project-cabinet.test.ts` и ordinary live E2E.
- **TST-03 — подтверждено STATIC в объявленных пределах.** A13, `05_architecture.md:28–34`, PC-10 и TASK-QA/AM-6 различают прежний config guard и planned наблюдение контролируемых Node transports/children и browser-context requests. `project QA boundary records and refuses synthetic egress` в `apps/web/tests/project-cabinet-qa-runtime.test.mjs` должен проверять synthetic sentinel, предсетевой отказ, audit и fail-closed при отсутствии guard/ack; email/payment/STT/storage представлены транспортными попытками без реальных providers. Непокрытый native/OS/Chromium-internal транспорт явно не является доказанной изоляцией и не может считаться pass. Универсальный OS firewall этим заключением не подтверждается.

**Доказательства входов.** Независимый `sha256sum` подтвердил все восемь host paths: 00 `b434f62c83e979ade1381e93ebe732d1595ae8add7d8e4eb964ae4e50cafa145`; 01 `b6384fb57634b86fc9233fcf7158d557f8aacc4decb2c26a19084783fd4d9a74`; 02 `6a20012b05384ca0171dcd0a90c93b174a2f8c4ea108b3cc5ed6d980757d84cf`; ADR-001 `cbea146422ab55773792d6dc3c1ebc2636aa846f8793cabf285d817a8fe7270d`; ADR-002 `540b70501147adc6e8535caf2b9edde3c41fdbac403fc039d9d4e4fbf219933d`; ADR-003 `8764ae09f54a8dee1b3c15ed9f1974eebf76ec9b1bcd6dee81261143dc772bab`; 04 `1b1acaad1fd6494eec0afc4715e1dfae65f99d3a51db1feb5fd0906859797adf`; 05 `d8bb12a1f4743d10b1d474e23c3f8fa3dbcc3561736ace9933f73a079dbd782c`. Дополнительно измерены, не включены в host manifest: spec `834c9e8bcd3db6851e3b00e24f7196370c48bf6b3afaef18ffc22aa19a622b40` (совпадает с 01); plan 06 `eaf18bc26b1d0f3b3c4a46233e3bd91f592d661e6b9778d46906e115e967673f`; author delta `63c7a70afa39110b32d42be26957feb071abaaefc981d9b5a4154bf3ed45501a`; actual rework handoff `5ee3a77dceebca471106c5de040ca6a6fec9d0941b76c2b103c26fcd09f82418`; initial own entry `f44dd8f1bb1248a0fef6a3ecc2fbfd35adb4bf47670d886b8a21791d7b891b97`. План содержит 24 named targets и AM-4/5/6; полную работоспособность или достаточность других ролей оценивают их владельцы.

Владелец пока не одобрил точные proposal bytes/filled states/regions; CP0 остаётся открытым. K1/K2/source admission, продуктовый код, тесты, серверы, DB fault и сетевые probes в этой проверке не выполнялись. Результат не является допуском к коду или доказательством работающих guard/reload/error boundaries. В `deltaVerification` revision помещена в evidence, поскольку фактический native checker принимает только поля classification/evidence/implementationVerified; каждая condition verification содержит отдельное поле revision.
