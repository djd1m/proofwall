# QE PRIMARY — focused verification repair cycle 2

Текущий вердикт роли: **clean**. Собственные PRIMARY-01…04 выполнены и независимо проверены на revision `5a55e200c7807177bb7d1e8e39b5eb2b7db0d4d68b3d69d07d182b3403122657`, nonce `893f82d3-e2ae-48df-b357-f3031a194fdf`. Исходные четыре conditions в JSON сохранены побайтово; добавлены только собственные structural verifications текущей revision. Чужие условия, общий native gate, readiness и публикация этим выводом не закрываются.

Дата 2026-11-12, reviewer `qe-primary`, family `codex`. Та же независимая сессия без авторской истории: наблюдённый координатором dispatch `gpt-6-astra/xhigh`, `fork_turns=none`; это metadata запуска, не provider attestation. Авторский dispatch `gpt-6.1-sol/high`. Применены ранее полностью прочитанные pinned review/requirements skills и module03.5/08/09; это узкая проверка реальной repair delta, а не новый полный research.

## Snapshot и actual author delta

Прочитаны `native-cycle2-prepared.json`, `author-repair-delta.json`, `evidence/repair-cycle2` и private handoff как указатели на изменения. Actual native begin-repair имеет exit0, full roster четырёх ролей и девять исходных условий; свои четыре совпадают с сохранённым initial entry. Все **46/46** manifest SHA совпали перед проверкой и после runtime. Измерены 12 changed paths; авторский changedScope включает все 12, остальные 34 неизменны. Новый manifest path `docs/embed-contract.md` документирует ограничение CSP и не является дополнительным product code target. Исходные требования, spec SHA `2e9966d6e9eb55e24b992ede14761eb086ce64ecf181ca208bf5d969c359cc75`, четыре ADR, architecture/plan и production BrandingView/CollectView/CSS не изменились.

Raw binding: `.secrets/bc-qe-primary-cycle2-manifest.json`, `bc-qe-primary-cycle2-final-manifest.json`, `bc-qe-primary-cycle2-delta-check.json`. `authorAssessmentChecked=true` означает фактическое сопоставление авторской delta с source и собственными проверками. Авторские full-suite/build/coverage/source-mutation grades не использованы вместо своих результатов.

## Самостоятельно исполнено

Все runtime команды прошли через `flock .secrets/branding-qe-runtime.lock`, только на выделенных synthetic loopback ресурсах. Source, state и baselines не менялись, host prepare/evaluate не вызывались.

| Команда после `flock .secrets/branding-qe-runtime.lock` | Результат | Собственный raw log |
|---|---|---|
| `node_modules/node/bin/node scripts/run-branding-collect-preview.mjs test tests/branding.test.ts tests/project-branding.test.ts tests/branding-collect-schema.test.ts --maxWorkers=1 --minWorkers=1 --reporter=verbose` | **39/39**, 3 files, exit0 | `.secrets/bc-qe-primary-cycle2-unit.log` |
| `node_modules/node/bin/node scripts/run-branding-collect-preview.mjs e2e` | **14/14**, 0 failed/skipped, exit0, 58.94 s | `.secrets/bc-qe-primary-cycle2-e2e.log` |
| `node_modules/node/bin/node .secrets/bc-qe-primary-logo-probe.mjs` | **exit0**, два credentialed HTTPS reject; чистый HTTPS accept | `.secrets/bc-qe-primary-cycle2-logo-probe.log` |

Тот же независимый no-network probe воспроизвёл initial дефект и теперь подтверждает исправление на actual `branding.ts` SHA `d606b700b6f8313a44968b41422741d8b0739dddab37c68e7f5dc54c23eeea03`. Он транспилирует текущий validator, не выполняет сетевых запросов.

Под общим lock скопированы текущие generated measurements и old-reader provenance в `.secrets/bc-qe-primary-cycle2-e2e-measurements.json` и `bc-qe-primary-cycle2-old-reader-provenance.json`. Эти fixed-output файлы общие для reviewer runs, поэтому копии обозначены как current shared generated evidence; независимый результат собственного запуска устанавливают отдельные собственные logs. Measurements согласуются с собственным проходом: две ordinary-owner-moderation записи, шесть editor и шесть document/host/ShadowRoot reflow records, 40 contrast records, PUT1/GET42/storage failures3, обнаруженные reverse browser mutants. `remoteBlockedRequests=12` — заблокированные попытки synthetic external image requests, не обещание отсутствия попыток и не OS-level egress attestation.

## Собственные условия и traceability после repair

| ID | Независимая проверка и результат |
|---|---|
| PRIMARY-01 / FR-202 | `branding.ts:91` проверяет пустые username/password. `branding rejects credential-bearing HTTPS logos without changing draft` (`branding.test.ts:34`) покрывает user+password, user-only, password-only и encoded userinfo. `credential-bearing logo mixed PATCH is rejected before repository write` (`project-branding.test.ts:170`) исполнил actual repository и HTTP route: 400, field error, mixed theme/heading не записаны, DB snapshot неизменен. `branding controller retains draft through pending failures and retry` (`branding.test.ts:107`) подтвердил actual React DOM controller: no fetch, draft retained, aria-invalid/describedby, alert focus, затем unrelated Save с legacy logo проходит. Новый чистый HTTPS сохранён настоящим writer в schema test. Probe отдельно прошёл. **Verified.** |
| PRIMARY-02 / FR-206 | `approveThroughOwnerApi` (`branding-collect.e2e.test.mjs:113`) вызывается text и photo journeys и использует обычный `POST /api/testimonials/:id/moderate`. Pending отсутствует в config до перехода; foreign403/anonymous401/expired401 не меняют status. Owner200 фиксирует approved, own wall/widget публикуют, foreign project не получает запись. Оба named E2E `branding collect real flows` и `collect uploads and reads local photo` прошли. SQL approval в этих путях заменён HTTP transition. **Verified.** |
| PRIMARY-03 / NFR-201, ADR-003 | `live forms and widget reflow without truncation` (`:469`) теперь исполняет editor при 320/360/390 и обеих темах: heading120, URL2048, error2056, полный value, Home/End/Shift+End selection/internal scroll, focus и Save в доступной области. Одновременно проходят collect/wall/widget и separate document/host/ShadowRoot measurements; host имеет положительную ширину, client=scroll304/344/374, rendered children внутри host. No-wrap/clipping reverse mutation обнаружена. **Verified.** |
| PRIMARY-04 / NFR-202 | `branding schema supports legacy and rollback` (`branding-collect-schema.test.ts:81`) вызывает настоящий current writer на committed legacy+unknown JSON; независимый admin client читает изменённую persisted row с сохранёнными name/unknown. Исполняется настоящий baseline `readBranding`, полученный `git show 4da1c64b6dcc537a412646183344dcb53645ea02:apps/web/src/lib/branding.ts`, source SHA `4447bd65d7be631a9f98701145fad09c946dfc2b3eb93296daf9e878445730d8`, который reviewer независимо сверил. Старый reader возвращает три ожидаемых старых поля; повторный SELECT подтверждает отсутствие rewrite. Existing tables и `app_authenticated` SELECT/UPDATE grants проверены. Это исполнение фактического old reader, а не redeploy полного старого приложения. **Verified.** |

Initial forward/backward audit всех 13 FR/NFR сохранён ниже как история initial snapshot. В неизменённом нормативном контракте четыре ранее fail/partial цепочки теперь дополнены описанными actual oracles; новые requirement IDs или orphan code в focused delta не обнаружены. Повторное независимое выполнение всех исторических проверок не заявляется.

## Затронутые зависимости, new risks и пределы

Прочитаны все 12 changed measured paths. Помимо собственных условий, проверен redacted outcome logger в `branding/route.ts:26`: фиксированные outcome/status/code/correlation, server-generated UUID и отсутствие payload/error/slug/account в event. Собственные `new branding logs omit payloads` и `PATCH commit failure emits failed signal without committed success` фактически прошли; injected COMMIT failure даёт failed503 без committed signal и без DB write. Это проверка затронутой зависимости, не closure чужого origin condition.

В `apps/widget/src/styles.ts:111` constructed stylesheet создаётся в ownerDocument realm, сохраняет прежние adopted sheets; capability fallback остаётся обычным inline style, а adoption failure не маскируется fallback. Прочитаны новые widget unit tests для realm/fallback/failure, но widget unit suite отдельно этой ролью не запускался. В `index.ts:40` block/minWidth0/maxWidth100% устраняет нулевой размер host; реальные размеры проверены собственным E2E. Перестроенный actual widget `widget.0837c760.js`, SHA `0837c76006f9782264ca52f036c643ca1d9d04eada3ebfe92a1f5361967d132e`, независимо прочитан, hash и markers проверены (`.secrets/bc-qe-primary-cycle2-widget-artifact.json`). Своя новая сборка не выполнялась.

Собственный `strict CSP accepts constructed scoped CSS and detects an inline injector` (`e2e:530`) исполнил actual response CSP без unsafe-inline, внешние self host script/style, cross-origin config и built widget. Есть working host marker, adopted sheet, ожидаемые widget computed styles и отсутствие violations в положительном случае. Reverse inline injector даёт реальное CSP violation/style failure. Это bounded pinned Chromium evidence; legacy inline fallback и все сторонние CSP политики strict-CSP совместимостью не объявляются. `docs/embed-contract.md` сохраняет эти ограничения. Изменение runner (удаление присвоения HOME) прочитано, environment allowlist и loopback guards сохранены; его named rejection tests исполнились.

Новых самостоятельных серьёзных рисков, требующих conditions, в этом focused scope не установлено. Source mutation campaign (включая новые mutations), полный build/typecheck/full suites, новая frozen capture и реальные provider calls этой ролью повторно не выполнялись. Owner-approved live border `#8e806b` и неизменённый offline reference остаются разными проверяемыми контрактами; zero-diff не назван полным pixel identity live UI. Manual real AT остаётся pending для owner acceptance опубликованной test copy; автоматизированным AT pass и условием самой публикации test copy это не считается.

`deltaVerification.classification=structural`, `implementationVerified=true` относятся к реально проверенным исправлениям и затронутым зависимостям на указанном snapshot. Coordinator собирает full roster и выполняет actual native evaluate отдельно.

---

# Исторический initial review — revision b3b7f477… (до repair)

Далее неизменённый initial report. Его no-go, line numbers, тестовые counts и незакрытые условия относятся только к исходному snapshot; текущий verdict и verification приведены выше.

# Независимый QE PRIMARY и requirements traceability

Вердикт: **no-go** на текущем snapshot. Подтверждён один HIGH дефект FR-202: новый HTTPS logo URL с credentials принимается общим validator и сохраняется reader. Ещё три WARNING — конкретные пробелы обязательных test oracles, а не доказанные поломки moderation, reflow или rollback. Условия PRIMARY-01…04 зафиксированы в `qe-primary-entry.json`; чужие условия этим отчётом не закрываются. Readiness, публикация test copy и production acceptance не объявляются.

## Идентичность, входы и границы

Дата: 2026-11-12. Роль `qe-primary`, family `codex`; отдельная сессия `/root/bc_qe_primary` без авторской истории. По наблюдённым координатором параметрам `collaboration.spawn_agent`: `fork_turns=none`, фактическая выбранная модель `gpt-6-astra`, effort `xhigh`. Это атрибуция dispatch, не provider attestation. Авторы кода по переданным metadata — `gpt-6.1-sol/high`; авторские grades/итоговые оценки как proof не принимались.

Native prepare выполнен координатором до dispatch. Проверены:

- revision `b3b7f4779c855441ae482ff5f7d813527058aa6bb9e80536eeb2a4cfa20fb71c`;
- nonce `bbba4b1f-3593-41a6-a8be-e3c711994fe2`;
- baseline `4da1c64b6dcc537a412646183344dcb53645ea02`;
- OpenSpec SHA-256 `2e9966d6e9eb55e24b992ede14761eb086ce64ecf181ca208bf5d969c359cc75`.

Прочитаны все 45 путей native manifest, включая 30 code/test/tool targets, 13 FR/NFR, четыре ADR, architecture, plan и QCSD inputs. SHA всех 45 файлов совпали при начале и завершении review: `.secrets/bc-qe-primary-manifest.json`, `.secrets/bc-qe-primary-final-manifest.json`. Дополнительно прочитаны `current-session.ts`, `request-body.ts`, `packages/db/src/tenant.ts`, применимые проектные правила. Проверено, что wrapper возвращает результат лишь после COMMIT, page/API используют один owned repository, а API не получает account из payload.

Применены полные pinned `brutal-honesty-review` (direct technical/evidence mode) и `qe-requirements-validation`, modules08/09 и contract module03.5. Локальный `dz recall --json` вернул три полных lexical lessons: фактические SQL role/GUC, локальная работа без GitHub CI, разделение live contrast/frozen palette. Они прочитаны и применены; raw `.secrets/bc-qe-primary-recall-full.json`. Собственный AQE MCP fleet/memory вызов этой ролью не выполнялся; host/native runtime и process gates проверяет координатор. Это не заявка на закрытие этих gates.

Решение владельца «выбери контрастнее» от 2026-11-12 учтено: обычные containers передают `#8e806b`; offline literal palette — `#ddd3c2` тем же view components. Frozen unchanged проверен отдельно. Zero diff не назван полным pixel identity live UI.

## Самостоятельные проверки

Все product/runtime команды выполнялись через `flock .secrets/branding-qe-runtime.lock`; app/test/docs/state/baseline source не менялся, native prepare/evaluate не вызывались. Использованы только выделенные synthetic loopback QA ресурсы.

| Проверка | Фактический результат | Raw evidence |
|---|---|---|
| `run-branding-collect-preview.mjs test tests/branding.test.ts tests/project-branding.test.ts tests/branding-collect-schema.test.ts tests/branding-collect-visual-fixture.test.ts tests/wall.test.ts tests/widget-config.test.ts --maxWorkers=1 --minWorkers=1` | 6 файлов, **76 passed**, 0 failed | `.secrets/bc-qe-primary-unit.log` |
| `run-branding-collect-preview.mjs e2e` | **13/13 passed**, exit0, 48.2 s, 0 skipped | `.secrets/bc-qe-primary-e2e.log`; скопированные measurements `.secrets/bc-qe-primary-e2e-measurements.json` |
| Отдельно разрешённый bounded `bc-qe-primary-logo-probe.mjs` | **exit1**, два credentialed HTTPS input ошибочно приняты; credential-free control принят | `.secrets/bc-qe-primary-logo-probe.log` |
| Статическое сравнение шести actual PNG с frozen и Git baseline | Все шесть PNG побайтово равны frozen; frozen побайтово равны baseline. Production view hashes совпадают | `.secrets/bc-qe-primary-visual-artifact-check.json` |

Probe транспилировал именно текущий `apps/web/src/lib/branding.ts` через установленный TypeScript и импортировал результат в память; source SHA указан в log. Никаких запросов к synthetic URL, чтения private env или настоящих credentials в probe нет. Expected reject был задан отдельно от реализации.

E2E реально загрузил построенный Next app, обычный login, product SDK PUT/GET в synthetic S3 и widget на втором origin `http://widget.synthetic.test:33189` с CSP/агрессивным CSS. Measurements: PUT1, GET39, storage failures3, 40 computed contrast records, 6 reflow combinations, обнаружены in-browser white-text/border/error-relation/clipping mutants. `remoteBlockedRequests=12` означает заблокированные попытки synthetic external images, **не** отсутствие attempted requests; никаких успешных внешних запросов этим browser harness не разрешено. Это не независимая OS-level аттестация всего egress.

Собственная новая frozen browser capture и source-mutation кампания PRIMARY не запускались. Прочитан renderer/import identity и raw visual evidence, independently сравнены готовые PNG/hash. Самостоятельный unit run дополнительно исполнил offline renderer/current view DOM contracts. Более старый author summary содержит прежний hash расширенного позднее test file; этот summary не использован как подтверждение нынешнего test count. Отдельные source mutants и full build/typecheck/coverage относятся к другим ролям/координатору, их pass здесь не присваивается.

## Замечания

### PRIMARY-01 — HIGH, structural — credentialed HTTPS logo принимается

`openspec/changes/proofo-branding-collect/specs/branding-collect/spec.md:43` запрещает credentials. В `apps/web/src/lib/branding.ts:86–93` проверяются длина и `new URL(value).protocol === 'https:'`, но не username/password. Shared validator используется и client editor, и repository перед транзакцией; reader сохраняет credentials в каноническом URL, который public form/wall вставляют в `img src`.

Собственный probe для `https://synthetic-user:synthetic-password@logo.example.test/image.png` и user-only варианта получил `actualAccept=true`, `readerRetainsCredentials=true` вместо reject; чистый HTTPS control принят. Реальные секреты или сетевое раскрытие не исследовались. Возможность публично сохранить credentials следует из потока writer→reader→src, а не из заявления об эксплуатированной утечке.

Исправление: parse один URL, требовать HTTPS и пустые `username`/`password`, сохранить контракт legacy read/unrelated dirty Save. Добавить отрицательные named tests общего validator и HTTP mixed patch с неизменностью БД; проверить client field error. Нынешний corpus `branding.test.ts:40–56` проверяет HTTP, длину и тип, но этот запрет отсутствует.

### PRIMARY-02 — WARNING, structural — ordinary moderation HTTP path не доказан

FR-206 `spec.md:127–130` требует owner approval обычным moderation API. `tools/visual/branding-collect.e2e.test.mjs:157` и `:253` меняют status прямым SQL. Оба named E2E проходят, но проверяют только публикацию уже одобренных данных после обхода HTTP boundary. `wall.test.ts` применяет `applyTransition` под `withAccount` и полезен для нижнего слоя, однако HTTP/session path не восполняет.

Исправление: в live text/photo journey использовать обычный owner moderation request, затем проверить wall/widget своего проекта и отсутствие pending/foreign; SQL оставить только для изолированной подготовки данных. Product defect в неизменённой moderation реализации не установлен.

### PRIMARY-03 — WARNING, structural — reflow oracle пропускает editor и URL navigation

`05_architecture.md:162–166` требует живые branding/collect/wall/widget. NFR-201 `spec.md:228–232` отдельно требует полный URL и Home/End/selection. Named E2E `live forms and widget reflow without truncation` (`:387–421`) при каждой ширине открывает collect, wall и widget. Branding editor не открывается; Home/End/Shift+End проверяется только на `#cab-name` (`:399–402`). Поэтому шесть passing reflow combinations не доказывают редактор с длинным logo URL и состоянием ошибки.

Исправление: расширить этот oracle editor при 320/360/390, обеих project themes, heading120, URL2048 и long error; проверить полный input value, URL navigation/selection/internal scroll и доступность focused controls. Это отсутствие проверки, не найденный overflow.

### PRIMARY-04 — WARNING, structural — rollback fixture не равен rollback reader

NFR-202 `spec.md:241–245` требует новый writer → фактический старый reader после rollback версии приложения, без data rewrite. `branding-collect-schema.test.ts:78–99` делает handwritten JSONB UPDATE, проверяет raw поля, затем SQL ROLLBACK и исчезновение project. Старый reader и новый writer там не исполняются. `branding.test.ts:34–38` проверяет противоположное направление: старый input новым reader.

Исправление: на отдельной migrated QA БД обновить legacy/unknown-key запись настоящим writer, прочитать её старым reader из pinned baseline и проверить старые поля/name/permissions без преобразования данных. Existing migrations provisioning можно использовать как отдельное raw evidence; SQL cleanup rollback не выдавать за проверку rollback приложения. Реальная несовместимость этим review не показана.

## Forward traceability: все 13 FR/NFR

Ниже каждый ID ссылается на одноимённый normative Requirement в текущем OpenSpec SHA. `U` — собственный 76-test run, `E` — собственный 13-test E2E run, `V` — собственная static artifact/hash verification. «Покрыт» означает проверенный конкретный scope, а не blanket guarantee; четыре неполных цепочки перечислены явно.

| ID / нормативный requirement | ADR / TASK | Реализация | Named test / actual evidence | Оценка |
|---|---|---|---|---|
| FR-201 Canonical owner branding | 001 / 2,3,5 | `branding.ts`, `project-branding.ts`, branding route/editor/view | `branding patch preserves unrelated keys`; `malformed stored branding returns 409 without normalizing writes` (U); `branding locks settings during delayed save`; `branding two tabs merge dirty keys in commit order` (E) | Покрыт: atomic merge, lock, отказ без write, controlled commit order, reload |
| FR-202 Observable branding effects | 001,002 / 2,4,5 | canonical reader/writer; form/wall/widget consumers | `branding patch rejects forbidden and malformed values` (U); `branding collect real flows`; `legacy HTTP logo permits unrelated theme save` (E); own validator probe | **FAIL PRIMARY-01**; остальной HEX/HTTPS/legacy/public-effect путь проверен |
| FR-203 Stable selected-set ordering | 002 / 4 | `wall.ts`, `widget-config.ts` latest CTE | `widget sorts the same newest fifty`; `wall sorts all approved rows with a stable time and id tie break`; tenant/pending cases (U) | Покрыт: selected50 неизменны, tie-break/order/filter |
| FR-204 Optional platform names with preserved provenance | 002 / 4 | wall page; widget config/render | `platform labels hide names but preserve provenance` (U; widget version inspected); `public proof preserves source screenshot transcript demo and server badge` (E) | Покрыт: neutral caption, unchanged DTO/text/screenshot, независимые badge/transcript; demo disclaimer проверен на wall |
| FR-205 Existing text and photo collection | 003,004 / 6,8 | `submit-form.tsx`, `collect-view.tsx`, existing testimonial/photo adapter | `collect controller validates raw boundaries and announces only 201 success`; `collect photo checks signatures handles read failures and releases each preview` (U); padded/raw corpus и `collect uploads and reads local photo` (E) | Покрыт в проверенном corpus; UI не обрезает raw82, real local SDK round-trip |
| FR-206 Honest submission and media states | 003,004 / 6,8 | collect state, preview lifecycle, inherited pipeline | draft/pending/retry tests (U/E); local 503/quota rollback/201/photo GET (E) | **PARTIAL PRIMARY-02**: ordinary moderation API пропущен; остальное состояние/байты проверено |
| FR-207 Truthful production controls | 003 / 5,6 | `BrandingEditor`, `SubmitForm`, `IntakeTabs` | `owner branding and collect pages enforce ordinary ownership and public lookup` (U); `branding collect real flows` (E); inspection production models | Покрыт: no rating/video-first/demo-only promises, flag false, real readers |
| FR-208 Frozen same-component visual evidence | 003 / 7 | pure views/CSS + offline renderer | `production views render frozen models offline` (U); six PNG/hash comparison (V), inspected raw visual mutation outputs/imports | Покрыт с границей: fresh static renderer, existing identical PNG; новых PRIMARY visual captures/source mutants нет |
| FR-209 Tenant and request boundary | 001,004 / 3,8 | current session, bounded route, owned repository/withAccount | `branding rejects foreign project and revoked permission`; `branding owner statements retain role and tenant context`; `branding rejects cross origin and oversized stream` (U); `expired owner session refuses branding page read and write` (E) | Покрыт: actual SELECT/UPDATE role/GUC, denied permission, status/no-store, session expiry |
| FR-210 Reachable owner branding navigation | 001,003 / 5,8 | sole project link + branding page/back | `owner navigates from project to branding and back` (E), ordinary lookup/controller test (U) | Покрыт: keyboard Enter navigation, back, own/foreign/inactive |
| NFR-201 Accessible and bounded rendering | 002,003 / 4,5,6,8 | contrast helpers, scoped CSS, DOM relationships, shadow styles | `branding contrast covers accent text and accent fill`; `live forms use owner approved field borders`; `forms expose labels errors statuses and managed focus`; `live forms and widget reflow without truncation` (E) | **PARTIAL PRIMARY-03**. Tested contrast/AX/field-error/status/focus/mutants passed; full keyboard traversal и real AT не объявлены |
| NFR-202 Compatibility and honest evidence | 001,002,003 / 1,2,4,8,9 | additive types/DTO, strict patch, silent payload-free error returns | `retains compatible three-field Branding inputs and resolves additive defaults`; `new branding logs omit payloads`; `branding schema supports legacy and rollback` (U), widget malformed DTO inspected | **PARTIAL PRIMARY-04**: forward legacy works, actual old-reader rollback отсутствует |
| NFR-203 Isolated QA media execution | 004 / 1,8 | dedicated allowlist runner/E2E lifecycle | `branding QA runner refuses unsafe configuration` (U); `collect uploads and reads local photo` (E) | Покрыт: synthetic config negatives/before-spawn, no inherited provider env, SDK local bytes/faults; real provider не проверялся PRIMARY |

Linkage составляет **13/13** ID→spec→ADR→code→named test. Это не 100% выполненных MUST: **9 цепочек без выявленного пробела в рассмотренном scope; 1 FAIL и 3 PARTIAL**. Числа не являются line/branch coverage. Требования в основном SMART/GWT: длины, статусы, роли, размеры, contrast и palette заданы измеримо. Обнаруженные пробелы — implementation/oracle, не необходимость ослаблять spec.

## Backward traceability, orphan audit и ADR fitness

Все 30 planned targets имеют назначение в этих цепочках. Owner route/repository/editor связаны с FR-201/202/209/210; public ordering/render/types — FR-202/203/204 и NFR-201/202; collect/views — FR-205/206/207; renderer/fixture test — FR-208; runner/schema/E2E/mutation — NFR-202/203 плюс перечисленные safeguards. Нового orphan production module/control без FR/reader не найдено. Only navigation line изменена в existing project page; dashboard overview не входит в реализацию.

Новые тестовые группы также имеют обратные связи: validator/contrast/controllers→FR-201/202/205/206/NFR-201; repository/auth/logging→FR-201/209/NFR-202; DOM/offline→FR-208/NFR-201; schema/runner→NFR-202/203; ordering/provenance/DTO→FR-203/204/NFR-202. Existing safeJsonLd, schema.org, badge/tariff and demo tests сохраняют исторические FR-005/006/security contracts и выступают regression coverage; это не orphan только потому, что они старше новых 13 ID. 13 amendment named test references разрешаются к существующим тестам по чтению кода; actual CLI amendment/discrimination gate этой ролью не выдаётся за выполненный.

ADR-001 реально отражён в transaction/JSONB/locked editor и named tests, но строгий URL contract неполон (PRIMARY-01), а old-reader proof — PRIMARY-04. ADR-002 отражён в stable selected set/neutral provenance/typed DTO и named tests. ADR-003 использует те же production components и generic palette без fixture mode; gaps PRIMARY-02/03 ограничивают полноту live evidence. ADR-004 отражён в отдельном runner и local SDK E2E, unsafe inputs отвергаются до spawn. Наличие Confirmation stanza не считалось доказательством прохождения сценария.

## Ограничения и последующее действие

Реальный manual screen reader остаётся **phase-bounded pending при owner acceptance опубликованной test copy**. Это не automated AT pass и не самостоятельное условие, запрещающее опубликовать саму test copy. Исходные фото privacy/key-based contract, exactly-once, real Cloud.ru/Resend/STT/payments и production не расширялись и не проверялись. Нет утверждения об отсутствии всех уязвимостей или полном WCAG соответствии.

Нужно исправить PRIMARY-01 и дополнить три named oracles, затем передать реальные изменения origin reviewer для focused verification по новому native snapshot. Текущий initial entry сохраняет `authorAssessmentChecked=false`, `deltaVerification=null`, `verifications=[]`; author handoff для delta отсутствует. Сбор четырёх ролей и actual native evaluate остаются у координатора.
