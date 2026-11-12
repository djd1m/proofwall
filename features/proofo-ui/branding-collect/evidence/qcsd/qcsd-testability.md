# Независимая проверка требований и тестируемости

Исторический первичный результат: роль `qcsd-testability`, family `codex`; первоначальный host revision: `d9651734b548b96b1cb5259cf415c5fdba72d7be307dc1ceb2ee3e39ff2a1792`, nonce `247625c6-989d-4f99-9e62-197821099938`. Первичное решение роли: **conditional** из-за TESTABILITY-01; последующую проверку исправления см. в конце отчёта. Это не общий verdict swarm, не K1/K2, не приёмка реализации и не оценка автора.

Проверены документы 0–6, четыре ADR, все 13 активных требований OpenSpec (SHA-256 `d44db664a995073584272ee3f743017d09b6549624b39f58a2001be7649e9b24`), Direct QE и профиль требований; использован статический код текущего worktree. Ни нижеописанные будущие проверки, ни runtime продукта не запускались. 30 target-путей плана рассмотрены как ограниченный inventory, не как созданные файлы. Существующие и планируемые проверки различаются ниже.

## Находка TESTABILITY-01 — HIGH, structural

FR-205 одновременно требует trim-длину имени 2–80, исходное сохранение, совпадение UI/server и отказ `name 1/81` без уточнения, что длина измеряется после trim. Действующий `apps/web/src/lib/testimonial.ts:validateTextSubmission` считает `input.name.trim().length`, сохраняя исходное имя. Действующий `apps/web/src/app/f/[slug]/submit-form.tsx` применяет `maxLength=80` к исходной строке. Например, пробел + 80 букв + пробел: исходная длина 82, после trim 80; сервер принимает, через обычный текущий input ввести нельзя. Аналогично HTML minlength по исходной строке не воспроизводит отказ имени из одного символа с окружающим пробелом. Сценарий `name 81 → 400` ложен для 81 исходной позиции, если после trim их не больше 80.

Нужно согласовать проверяемое поведение: сохранить trim-контракт и исходный текст, устранить raw maxlength как препятствие допустимому вводу, явно определять 1/81 **после trim**. В запланированном browser и прямом HTTP тестах проверить валидное padded имя (после trim 80, после 201 в БД байт-в-байт исходное значение), trim-длину 1 и 81 (400, запись и upload отсутствуют), а также видимые ошибки и сохранение draft. Если выбирается другая политика raw длины, она требует явного изменения существующего HTTP контракта и совместимости, а не молчаливого UI ограничения. Эта проверка — требование к будущим тестам, не выполненный тест.

## SMART/GWT и измерение

Специфичность и измеримость сильны для статусов, шести полей, порядка `created_at,id`, 50 записей, 4096 bytes, MIME/5 MiB, прав/RLS и визуальных размеров; релевантность связана с владельцем, посетителем и читателем. Достижимость зависит от создания изолированного окружения и отсутствующих ещё production components/tests; оценка часов не является доказанным сроком. В 12 из 13 requirement blocks есть достаточно определённый основной GWT для проектирования положительного и отрицательного теста; FR-205 учитываю как неоднозначный из-за TESTABILITY-01. Это **92% полноты основных сценариев (12/13)** по собственной бинарной рубрике, не покрытие тестами и не вывод, что все подпункты реализованы.

| Принцип | 0–100 | Основание и остаточная неопределённость |
|---|---:|---|
| Наблюдаемость | 82 | HTTP/status, persisted state, реальные SQL role/GUC, DOM и local S3 requests; инструменты ещё предстоит написать |
| Управляемость | 82 | Изолированные database, local S3 failure/recovery, sessions и mutations описаны; обеспечение ресурсов ещё не доказано |
| Декомпозиция | 84 | Читатель/validator, route, pure views, widget и live E2E разделены |
| Простота | 80 | Reuse JSONB/intake; 30 targets и отдельный runner добавляют координацию |
| Стабильность | 78 | Frozen artifacts фиксированы, но фактический pixel gate зависит от воспроизводимой среды |
| Информация | 83 | FR/spec/ADR/план, реальные источники и expected boundaries доступны |
| Коммуникация | 75 | TESTABILITY-01 создаёт различающиеся ожидаемые результаты UI и HTTP |
| Связь с прежней работой | 86 | Существуют tenant wrapper, intake/storage и visual script; их наличие не доказывает новый эффект |
| Время | 65 | 6–9 часов — оценка, ресурсы и фактическая длительность не установлены |
| Ответственность | 78 | Confirmation и роли названы, реальные будущие исполнение и closure не установлены |

Среднее арифметическое **79/100** (округлено, оценка design testability, не качество продукта). Числа — экспертные оценки по приведённым основаниям; они не являются результатами runtime/test coverage. Direct skill определяет 70+ как порог testability GO, однако отдельное structural HIGH условие остаётся открытым; общий swarm decision определяется координатором по всем ролям и установленному gate.

## FR → ADR Confirmation → будущий тест

Все проверки в таблице запланированы, не выполнены. Пути тестов — из 30 targets плана; существование некоторых тестовых файлов само по себе не подтверждает наличие будущих случаев.

| Требование | ADR / Confirmation | Планируемое проверяемое доказательство |
|---|---|---|
| FR-201 | 001, atomic merge/tenant | `project-branding.test.ts`: сохранение name/unknown keys, concurrent dirty fields, 400/409 без частичной записи, commit до success |
| FR-202 | 001, HTTP legacy browser flow | `branding.test.ts` и `branding-collect.e2e.test.mjs`: валидатор + обычный login, изменённая тема при старом HTTP logo, PATCH без logo, reload и публичный эффект; новое HTTP → ошибка и прямой HTTP 400 |
| FR-203 | 002 / сохранение источника и стабильный public reader | `widget-config.test.ts`: 51 одинаковых created_at, foreign/pending, newest 50 и перестановка тех же ID; `wall.test.ts`: полный approved набор и tie-break |
| FR-204 | 002, source/badge invariant | `wall.test.ts`, `widget-branding.test.ts`, live E2E: toggle, neutral marker, screenshot даже при URL, неизменные source/text и server badge |
| FR-205 | 003 / реальный browser workflow; 004 / SDK | `branding-collect.e2e.test.mjs`: JSON/multipart, pending/audit, границы/MIME, настоящий local SDK; уточнить TESTABILITY-01 и прямой HTTP bypass отдельно от браузера |
| FR-206 | 003/004 / honest live path | `branding-collect.e2e.test.mjs`: 503, rollback квоты, draft/file и retry, 201-only, 429/network, revoke blob, approve→wall/widget; не утверждать exactly-once или approved-only photo URL |
| FR-207 | 003 / production model отделён от frozen | Live E2E: нет неподдержанных обещаний и video control при false; text/photo отправляется настоящим маршрутом |
| FR-208 | 003 / same-component offline + live | `branding-collect-visual-fixture.test.ts`, `render-branding-collect-fixture.mjs`: эти же production views с literal model вне Next, 2 экрана × 3 размера, DPR1, strict zero; font/margin 3px/color mutants должны падать; baseline неизменен; реальный E2E отдельно |
| FR-209 | 001 / actual owner statements | `project-branding.test.ts`: same client/transaction SELECT и UPDATE с `current_user` и owner GUC; withService mutant при сохранённом account WHERE должен падать; 401/404/403/415/413, denied grant rollback и 503 |
| FR-210 | 003 / production workflow | `branding-collect.e2e.test.mjs`: обычный login → project keyboard link → owned page → Save/reload → back, чужой/inactive адрес отказ; без seed HTTP и auth bypass |
| NFR-201 | 002/003 / обе публичные поверхности | Запланированные wall/widget и browser assertions: light/dark, #FFFFFF/#000000, ≥4.5:1, focus/error, Shadow DOM и gzip ≤30 KB |
| NFR-202 | 001/003 / legacy и честные evidence | `branding-collect-schema.test.ts`: fresh isolated DB + existing migrations, `{}`, unknown keys, rollback old reader, revoked grant; widget old/malformed DTO; отдельные evidence для последующих gates |
| NFR-203 | 004 / local real adapter and refusal | `branding-collect-schema.test.ts` и E2E: unsafe config отказ до spawn; local SDK PUT/GET bytes, 503→retry, запрет external traffic, cleanup своих S3/Next handles при partial setup; stable endpoints не трогать |

## Проверенные границы и дальнейшая дискриминация

`packages/db/src/tenant.ts` показывает, что `withAccount` ставит локальную роль и GUC, а `withService` использует bypass-RLS; отдельный probe не доказывает роль фактического SQL. Новая instrumentation должна проверять тот же client/transaction у SELECT и UPDATE и отклонять service-мутант. `request-body.ts` существует для streamed limit; нужны отрицательные HTTP проверки на реально прочитанных байтах и до write.

`testimonial.ts` уже валидирует фото до записи rate-limit event и отзывает event после исключения storage, а `api/testimonials/route.ts` вызывает настоящий `uploadPhoto`. Реальные success/fault/rollback ещё требуют изолированного исполнения. `request.formData()` вызывается до проверки размера файла: файл ≤5 MiB не доказывает ограничение всего multipart body. Это граница evidence, не новая privacy-policy. Ключевой photo route и scoped отказ от новой confidentiality/real email/STT не расширяются этим review.

ADR-004 задаёт fresh PG 33186, app 33187, synthetic S3 33188 и optional fixture 33189 как переназначаемые QA inputs; их доступность и отсутствие конфликтов ещё не установлены. Нужны отдельное создание БД существующими миграциями и owned lifecycle handles, включая cleanup при частичном setup; отсутствие изоляции означает BLOCKED, не pass. `scripts/run-dashboard-preview.mjs` действительно наследует env и удаляет S3, поэтому сам по себе не доказывает новый local SDK путь.

ADR-003 требует именно production components в offline fixture и запрещает HTTP overrides. Визуальная проверка шести точек и мутации не являются доказательством интерактивности, поэтому отдельные браузерные сценарии обязаны выполнять обычные маршруты, настоящий login и публичные последствия. Сравнение ещё не исполнялось; изменение golden для прохождения запрещено.

## Focused origin review исправленного дизайна

**Предыдущая ревизия** `f0f514a4b49206f9acb1f94eeaf385715b76cbd6148128496009c0a05b6c1693`, nonce `3eb0b153-6e79-493d-8be9-5bf9d8e04d09`: TESTABILITY-01 в исправленном дизайне подтверждён как устранённый; первоначальное условие сохранено неизменным в JSON, роль `clean` для собственных условий. Это не общий verdict swarm и не проверка чужих условий. `implementationVerified:true` означает проверку скорректированных требований, ADR, архитектуры и phase artifacts в ideation, не существование реализации или успешные продуктовые тесты.

**EXECUTED:** `git show 98f241fc8b9d48d017cbdb63ab890104e30397d0:.claude/agents/v3/qe-requirements-validator.md | sha256sum` в `/tmp/proofwall-agentic-qe-upstream` выдал `a200582b09f8b95d9671089f439135e2de39bf37b1b0da2dc6a89ac6449dc7e6`, как в `role-references.json`. Определение роли прочитано полностью; его проверки SMART/INVEST, GWT, traceability и структурированный pipeline применены к статическим проектным материалам, без имитации Claude Task или runtime продукта. Вычислены SHA-256 всех девяти файлов host manifest — каждый совпал; SHA активной спецификации `0304e1bcd5331e84f3ecb4925100ce8f31b91c8ee76ae498038a2608e7d33455` совпал с `01_requirements.md`. Никакие product/browser/AT/SQL/S3 тесты в этом review не исполнялись.

**STATIC — TESTABILITY-01:** OpenSpec FR-205 определяет name по `trim().length` в UTF-16 units, сохраняет raw и задаёт отдельные сценарии raw82/trim80 → 201 и точное значение в БД, trim1/81 → client error без fetch и bypass HTTP 400 без testimonial/upload/квоты. `01_requirements.md`, A7, `05_architecture.md` и TASK-6/AM-7 плана закрепляют те же границы и запрет блокирующих raw min/max; в плане mutation raw maxlength или raw validator обязана убить проверку. Текущий `testimonial.ts` проверяет trimmed name, raw role и raw text до blank-normalization роли, затем записывает исходное имя/текст и непустую роль. Browser, direct HTTP и DB assertions остаются будущими.

**STATIC — оценка авторской structural delta и новых рисков:** проект задаёт задержанный ответ Save и запрет изменения всех settings/повторного PATCH, восстановление draft при ошибке и две вкладки с определяемым commit order. Для contrast заданы отдельные роли fill/onAccent/accentText, computed compositing и отрицательный white-heading mutant; для accessibility — names/relations/focus/keyboard и ручной screen-reader; для reflow — ограничение размеров и длинные значения; для logging — явная граница новых диагностик и synthetic legacy output. Сохранено решение о локальном SDK, отдельных процессах и cleanup, frozen zero pixel и обычных маршрутах E2E. Выделенный в авторской оценке невыполняющий 3:1 neutral idle border остаётся открытой оценкой **origin accessibility reviewer**; моё подтверждение design delta не заменяет его решения и не утверждает AA compliance. Новых самостоятельных условий testability по рассмотренной дельте не обнаружено; реальная среда, сценарии и ручные проверки ещё не доказаны.

### Последовательная адаптация 13 шагов роли

Показатели ниже — экспертные design scores 0–100 по текущей ревизии; `PASS` означает достаточную для проектирования определённость соответствующего аспекта, а не готовность продукта. Findings count — количество новых условий этой роли, не число чужих открытых условий. Ниже ни один шаг не выдаётся за выполненный автоматический продуктовый gate.

| Шаг | Статус | Балл | Новых условий | Основание |
|---|---|---:|---:|---|
| 1 Format | PASS | 95 | 0 | 13 requirement blocks и сценарии структурированы; существующие K2/OpenSpec результаты автора не переисполнялись |
| 2 Completeness | PASS | 90 | 0 | Акторы, поля, отказы, последствия и границы для проектирования указаны |
| 3 INVEST | WARN | 78 | 0 | Ценность, оценка и проверяемость есть; L требует зависимых задач и координации, независимость/малый размер ограничены |
| 4 SMART | WARN | 84 | 0 | Границы и ожидаемые последствия измеримы; оценка времени не гарантирует срока поставки |
| 5 Testability | PASS | 82 | 0 | Новые точные name corpus и discrimination oracle устраняют прежний разрыв; методы runtime ещё создать |
| 6 Vague terms | WARN | 85 | 0 | Общие слова конкретизированы сценариями; фактическая наблюдаемость и окружение зависят от реализации |
| 7 Information density | PASS | 85 | 0 | Контракты и наблюдаемые oracles представлены без необходимости предположить author intent |
| 8 Traceability | PASS | 88 | 0 | FR → сценарии/задачи, ADR Confirmation → named planned tests; результаты тестов отсутствуют |
| 9 Implementation leakage | WARN | 70 | 0 | Намеренно заданы product boundaries, SQL role, runner и same-component evidence; это архитектурные ограничения, не автоматическая ошибка |
| 10 Domain compliance | PASS | 90 | 0 | Owner/visitor/publication и source/badge обозначены в domain model и сценариях |
| 11 Dependencies | PASS | 85 | 0 | Порядок задач, привязки к изолированным ресурсам и независимому accessibility review явны |
| 12 BDD | PASS | 90 | 0 | Все 13 блоков имеют основной GWT; данные padded и negative bypass теперь определены |
| 13 Holistic coherence | WARN | 78 | 0 | Свой конфликт name устранён; frozen neutral border остаётся вопросом origin accessibility reviewer |

**INFERRED:** совместимость нового UI и server возможна при реализации указанных проверок; статические документы не доказывают, что браузерный input, HTTP route, SQL role или SDK уже исполняются так. Дополнительные числа в таблице не заменяют собственную проверку других ролей, общую консолидацию и future QE.

## Focused проверка owner-approved дельты 2026-11-12

**Ревизия** `7530e37d99132e7af128a3ac107971d97c63fbcaef35ef4f5c2c6ad9cf923374`, nonce `b29efe0f-6017-41c6-a442-464f3ed3263d`: собственный verdict **clean** для исправленного дизайна TESTABILITY-01; исходное условие сохранено в JSON. Это узкая проверка собственного условия и затронутой дельты, не общий QCSD verdict, implementation admission или product/AT pass.

**STATIC:** FR-205 и A7, 01, ADR-003, архитектура и TASK-6/AM-7 по-прежнему задают `name.trim().length` 2–80 UTF-16, raw сохранение, browser + direct HTTP при raw82/trim80, client error и bypass 400 для trim1/81, отсутствие записи/upload/квоты, а также различающий mutant raw maxlength. Условие подтверждено на новой ревизии только по проектным материалам; future tests не исполнены.

**STATIC:** `evidence/design/owner-decision.json` фиксирует ответ «выбери контрастнее», live border `#8e806b` и неизменность frozen reference. FR-208/NFR-201, ADR-003, architecture и TASK-7/8/AM-13 требуют один production view с generic palette props, original `#ddd3c2` в offline literal model и approved palette на обычных live routes. Отдельный планируемый browser oracle проверяет computed border/fill/card после compositing, и mutant с возвратом старого цвета обязан провалиться. Шесть zero-diff кадров с original palette запланированы как component/layout proof; они не доказывают pixel identity live UI либо реальный computed contrast. Авторскую оценку новых рисков прочитал: чужой ACCESSIBILITY-01 остаётся предметом решения его origin reviewer. Новых собственных условий по этой дельте не выявлено.

**EXECUTED:** SHA-256 всех девяти manifest-файлов совпали с `owner-approved-prepared.json`; SHA активного OpenSpec `2e9966d6e9eb55e24b992ede14761eb086ce64ecf181ca208bf5d969c359cc75` и плана `9375188bbaf43d77c39edd6d4ba0b0c8a1f9d564df359678cfcf695ed84e188c` совпали с author-delta и mapping. Полное pinned определение `qe-requirements-validator` перечитано из git commit `98f241fc8b9d48d017cbdb63ab890104e30397d0`; его SHA-256 `a200582b09f8b95d9671089f439135e2de39bf37b1b0da2dc6a89ac6449dc7e6` совпал с `role-references.json`. Команды продуктовых, browser, SQL, S3, screen-reader и визуальных тестов в ходе этой проверки не выполнялись.
