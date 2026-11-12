# Независимое QCSD QUALITY: branding + collect

## Focused review решения владельца от 2026-11-12

Собственный verdict **clean**, новых quality-origin conditions нет. Проверен дизайн snapshot `7530e37d99132e7af128a3ac107971d97c63fbcaef35ef4f5c2c6ad9cf923374`, nonce `b29efe0f-6017-41c6-a442-464f3ed3263d`; авторская оценка и структурная дельта самостоятельно сопоставлены. Это не closure чужих условий: ACCESSIBILITY-01 остаётся за origin accessibility reviewer и host evaluate.

- **STATIC:** `evidence/design/owner-decision.json` фиксирует фактический ответ «выбери контрастнее», #8e806b вместо #ddd3c2 и отсутствие разрешения на implementation/closure. `01_requirements.md:60-62,92-94,125-129`, ADR-003:24-54, `05_architecture.md:94-102,148-155`, active FR-208/NFR-201 и TASK-7/8/AM-13 задают live palette через generic props обычных production views и original literal palette для offline render тех же components. Шесть zero-diff кадров сравнивают разметку и layout с reference data, но не доказывают pixel identity живого UI. Отдельный live computed border/fill/card oracle и mutation возврата к старой рамке запланированы и не могут быть заменены frozen pass.
- **EXECUTED:** все 9 файлов owner-approved host manifest хешированы, все digest совпали; SHA-256 active OpenSpec `2e9966d6e9eb55e24b992ede14761eb086ce64ecf181ca208bf5d969c359cc75` совпал с mapping в `01_requirements.md:17`; SHA плана `9375188bbaf43d77c39edd6d4ba0b0c8a1f9d564df359678cfcf695ed84e188c` совпал с handoff. Полный pinned quality role прочитан `git show` commit `98f241fc8b9d48d017cbdb63ab890104e30397d0`; SHA `3e9934cf951a268d56a04459fdcf92ecd91467f3d020e8877694e00cc8bd0407` совпал с `role-references.json`.

`deltaVerification.implementationVerified=true` на фазе ideation обозначает только проверку структурных design artifacts этого snapshot. Product code, browser, visual, accessibility/AT tests и gates этим review не выполнялись; computed ratios в источниках — расчёт дизайна, не измерение product UI. Авторские strict/K2 результаты не переисполнялись и не подменяют origin verification или admission.

## Повторная проверка структурной дельты

Текущий snapshot `f0f514a4b49206f9acb1f94eeaf385715b76cbd6148128496009c0a05b6c1693`, nonce `3eb0b153-6e79-493d-8be9-5bf9d8e04d09`: **clean по собственной роли**, author assessment проверен, design delta независимо проверена. Этот вывод не закрывает других владельцев. ACCESSIBILITY-01 остаётся открытым: противоречие нейтральной границы точного reference и контраста ещё требует решения; ссылки ниже на улучшенные oracles не являются его закрытием или доступностным pass.

- **EXECUTED:** полный pinned `.claude/agents/v3/qe-quality-criteria-recommender.md` прочитан через `git show 98f241fc8b9d48d017cbdb63ab890104e30397d0:<path>` из repo, указанного в role-references; SHA-256 `3e9934cf951a268d56a04459fdcf92ecd91467f3d020e8877694e00cc8bd0407` совпал с записью. Все 9 актуальных manifest hashes пересчитаны и совпали. Active OpenSpec SHA `0304e1bcd5331e84f3ecb4925100ce8f31b91c8ee76ae498038a2608e7d33455` совпал с `01_requirements.md:17`; SHA плана `311645e60b861cfbef90c8ea4f1279adbfc23b5046d5fa1eddfa698ed943fead` совпал с author handoff. Команды не являются продуктовыми тестами.
- **STATIC:** `apps/web/src/lib/testimonial.ts:63-89,124-139` подтверждает чтение исходного контракта: имя измеряется после trim, текст и роль — по raw длине, пустая после trim роль → null; `04_domain_model.md:26-32`, `05_architecture.md:95-105` и FR-205 планируют browser/HTTP и сохранение исходного padded имени. Проверка относится к документированному дизайну и baseline коду; будущий E2E не запущен.
- **STATIC:** `03_adr/001-patch-existing-branding.md:32-46`, `04_domain_model.md:44-50` и FR-201 задают захват dirty payload и блокировку всех полей во время Save, сохранение draft при ошибке и двухвкладочный merge/last-commit oracle. Legacy HTTP и dirty-key ограничения остаются; независимое доказательство реальным браузером предстоит.
- **STATIC:** `03_adr/003-render-production-views-offline.md:20-45,56-68`, FR-208 и `05_architecture.md:80-90` сохраняют 6 same-component frozen сравнений, не обновляя baseline; живые состояния, контраст/reflow/AT отдельно. `01_requirements.md:109-145` и `05_architecture.md:107-154` конкретизируют роли цвета, label/focus и long-value oracles, а также суженную честную область новых логов; неподтверждённый общий AA pass и старый photo logging не объявлены исправленными.
- **STATIC:** FR-203/204/206/207 и `03_adr/002-preserve-provenance-when-hiding-labels.md` сохраняют selected-set ordering, provenance/badge и photo key contract, реальные ограничения video/rating; `03_adr/004-isolate-photo-qa-runtime.md:23-47,58-69` сохраняет local synthetic SDK, отказ unsafe config и cleanup. Объём по плану — 30 targets, 0 новых migrations; исполнение не доказано.

Для ideation значение `implementationVerified: true` означает только независимую проверку изменённых требований, ADR и архитектуры текущего snapshot по контракту 03.5. App/code, browser, visual diff, SQL, accessibility, SDK и product tests не запускались. Результаты strict/K2 в handoff прочитаны как авторские сведения и самостоятельно не переисполнялись; они не являются closure. Наличие остающихся условий и необходимость отдельной проверки Terra/Astra не изменяются.

## Первичный обзор исходного snapshot

Роль `qcsd-quality`, фактическое семейство `codex`, самостоятельная независимая проверка предложенного Astra design; **clean для проверенного design scope**, не решение всего swarm и не разрешение на код. Snapshot подготовлен хостом до dispatch: revision `d9651734b548b96b1cb5259cf415c5fdba72d7be307dc1ceb2ee3e39ff2a1792`, nonce `247625c6-989d-4f99-9e62-197821099938`; проверены 9 manifest paths, 00 reuse и 06 plan как контекст и активная OpenSpec дельта. Авторский отчёт со статусом pending не принимался как доказательство. У Astra design по плану сохраняется самостоятельная межсемейная проверка Terra; текущая роль её не заменяет. Условия origin reviewer не выявлены; новые риски как незакрытые условия не заявляются.

Прочитаны AGENTS, Direct integration, полный qcsd-ideation-swarm SKILL и steps 02/03, локальный feature-adr module 03.5 и Direct qe-requirements-validation SKILL. Отдельных файлов объявленных upstream quality-criteria-recommender/requirements-validator в установленном Direct дереве нет; использован явный HTSM перечень и методика из module 03.5 и требования SKILL. Собственные оценки ниже — суждение по описанному дизайну, не показания AQE runtime или результаты product tests.

## Flag detection и границы ролей

Флаги определены сканированием FR/NFR и ADR по перечисленным в Direct step 01/локальном module 03.5 терминам, не live browser cascade: HAS_UI=true (editor, form, wall/widget); HAS_SECURITY=true (session, RLS, origin, media boundary); HAS_UX=true (journey и формы); HAS_VIDEO=true (video flag/intake, video-first prototype). Последний флаг указывает на последующий accessibility/caption review при реальном video content; он **не означает**, что видео включено, что ролик исследован или что captions доказаны. HAS_MIDDLEWARE=false (нет признаков middleware/ESB/broker/API gateway); HAS_SAP_INTEGRATION=false (нет SAP/RFC/BAPI/IDoc/OData и перечисленных технологий); HAS_AUTHORIZATION=false по узким признакам SoD/RBAC/permission matrix данного флага. Owner authorization уже требует security review. Итого по флагам: 3 core + 3 conditional = 6 ролей; HAS_VIDEO требует рекомендации follow-up, а не седьмой роли. UI/a11y, security и UX — отдельные назначенные роли, а не выводы данного quality review.

## FR/NFR: наблюдаемость и тестируемость

SHA-256 активного `openspec/changes/proofo-branding-collect/specs/branding-collect/spec.md` самостоятельно вычислен: `d44db664a995073584272ee3f743017d09b6549624b39f58a2001be7649e9b24`, совпал с 01_requirements:17. Имена и сценарии для 13/13 требований явно сопоставлены, это наличие спецификации, а не число проверенных реализаций.

| Требование | Требуемый наблюдаемый результат / контроль |
|---|---|
| FR-201 | Dirty whitelist, атомарный merge, commit до success; сохранить неизвестные данные/name, non-object 409, недопустимый payload целиком 400. Нужны реальные конкурентные и rollback проверки БД. |
| FR-202 | После Save/reload значение действует на заявленной поверхности. Старый HTTP logo не блокирует theme Save: browser noValidate, PATCH без logo, reload; новый HTTP отказать. Значения текста не усекать. |
| FR-203 | 51 approved с одинаковым временем плюс pending/foreign: widget выбирает один и тот же newest-50 набор до сортировки с id tie-break; wall сортирует все approved. |
| FR-204 | На wall/widget false скрывает название, оставляя neutral provenance, доступный source/screenshot, неизменный отзыв и независимый badge/demo/transcript; true сохраняет существующую подпись. Проверять обе поверхности, в том числе URL и screenshot вместе. |
| FR-205 | Контролируемые границы полей и допустимого фото, MIME+signature/5 MiB до storage и квоты, серверные отрицательные входы; на success реальный pending и audit. |
| FR-206 | 201-only success; ошибки и повтор с сохранённым вводом, object URL cleanup, rollback квоты при 503. Потеря ответа не обещает exactly-once; photo GET key-based, approved-only относится к спискам, не новой конфиденциальности URL. |
| FR-207 | Убрать production rating sort, video-first, тарифные цифры и demo-only обещания; disclosure честный; false video flag скрывает контрол, не меняя STT. Каждый сохраняемый контрол имеет фактический reader/effect. |
| FR-208 | Неизменный frozen v3, те же production view components и literal model в offline renderer без HTTP seed/fixture override; branding и collect × 1440×900, 390×844, 360×800, DPR1, manifest environment, zero diff и отрицательные font/margin/color mutations. Static render не доказывает обработчики; отдельный E2E обычных маршрутов обязателен. |
| FR-209 | Auth, origin, streaming bytes и payload до транзакции; отказ и rollback. На фактических SELECT/UPDATE того же соединения наблюдать роль/GUC; withService mutant с прежним фильтром должен падать. |
| FR-210 | Обычный login → доступная ссылка проекта → branding → Save/reload → возврат в тот же проект; самостоятельный отказ foreign/inactive адреса. |
| NFR-201 | Видимые focus/errors/status, keyboard и contrast ≥4.5:1 для текста на крайних цветах в light/dark, сохранение Shadow DOM и widget ≤30 KB gzip. Нужны вычисления по фактическому CSS и реальный browser. |
| NFR-202 | Старые три поля остаются валидным typed input; legacy {}, неизвестные ключи, rollback reader, optional/malformed widget DTO и migrations/grants на отдельной БД. Ни fixture, ни документы не закрывают QCSD/K1/K2/QE. |
| NFR-203 | Отдельные выделенные loopback PG/app/S3, private env, allowlist child env, synthetic credentials; отказ unsafe config до spawn, настоящий local SDK PUT/GET с byte equality, управляемый сбой и cleanup, никакой подмены mock-ом. |

Поля и назначение независимо сверены с `01_requirements.md:41-57` и `05_architecture.md:52-63`: theme → wall/widget; order → wall/widget; labels → wall/widget; accent → form/wall/widget; logo → form/wall; heading → form. Приоритет — проверить эффект после сохранения и reload, не только наличие JSON или кнопки. Для сохранения совместимости writer объединяет только dirty keys; reader defaults не являются записью и не должны стирать legacy/unknown данные. Существующий widget фактически передаёт `source_label` только для `source=platform`; сохранение его как признака provenance в ADR-002 проверяемо на разных вариантах ссылок/снимка. Текущий source code — контекст существующего контракта, не доказательство новой реализации.

## HTSM v6.3: приоритеты и проверяемость дизайна

Оценка 0–100 — субъективная определённость критерия и проверки, не runtime quality. Вес 1–3 — относительный риск для этой фичи, а не измеренный SLA. Категория покрыта, если для её существенного аспекта назван измеримый критерий/инвариант; общие latency/load SLA для этой ограниченной фичи не заявлены.

| Категория | Вес | Оценка | Основание / будущая проверка |
|---|---:|---:|---|
| Capability | 3 | 90 | Шесть controls и readers; dirty Save/reload, сортировка и происхождение. |
| Reliability | 3 | 85 | Atomic merge, неуспешный storage/DB, network ambiguity, cleanup и concurrent patches. |
| Usability | 3 | 80 | Keyboard, focus, validation, honest states; собственное UX/a11y review обязательно. |
| Charisma | 2 | 85 | Шесть frozen кадров с same component и отдельные evidence состояний, zero diff/mutants. |
| Security | 3 | 85 | RLS/tenant фактических statements, origin/body, safe rendering; независимая security роль обязательна. |
| Scalability | 1 | 65 | Ограниченные входы и newest-50 widget; обобщённые нагрузочные гарантии не заявлены. |
| Compatibility | 3 | 90 | Typed 3-field legacy, widget DTO, HTTP logo и rollback/migrations план. |
| Performance | 1 | 65 | У widget ≤30KB gzip; отдельный latency SLO отсутствует и не подразумевается. |
| Installability | 2 | 80 | Без новой SQL migration; изолированный runner, unsafe config refusal и cleanup. |
| Development | 2 | 85 | Раздельные view/container и тестовые границы, существующие tests, mutations и независимое QE. |

Все 10 категорий рассмотрены; 8/10 имеют конкретный приёмочный criterion для существенной части области; scalability/performance ограничены явно указанными bounds, без выдумывания общей load/latency гарантии. Это не overall swarm GO и не балл фактически работающего продукта.

## Пределы доказательств и следующие gates

Рассмотрены исходники wall/widget, существующий branding и QA/visual подход выборочно как контекст; application новые модули, тесты и 30 code targets ещё pending. Не запускались приложение, browser, продуктовые тесты, локальный storage/DB, визуальный diff или mutation tests. Ничего не менялось в app, docs, host/state/receipt, baseline, production или секретах; реальных HTTP/почты не было. Самостоятельно вычисленный SHA — проверка связности документов, не runtime результат. Дальнейшие QCSD role reports, отдельная Terra independence для Astra design, K1/K2, подтверждение runtime/hooks и последующие isolated product evidence — отдельные необходимые шаги. При изменении любого host manifest input требуется prepare нового snapshot и независимая проверка дельты по 03.5, а не повторное использование текущего чистого вывода.
