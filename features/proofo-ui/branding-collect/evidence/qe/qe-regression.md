# Независимое QE: регрессия, покрытие и visual

## Focused cycle 2 — текущий результат

Вердикт `qe-regression`: **clean**, собственные `conditions: []` сохранены. `authorAssessmentChecked: true`; `deltaVerification.classification: structural`, `implementationVerified: true` по фактическим проверкам ниже. Это verification собственного scope и structural delta, не закрытие девяти чужих conditions; их проверяют originating roles. Следующий раздел «Первичный цикл» — сохранённая история прежней ревизии, его формулировки о тогдашних открытых gaps не являются новым verdict текущей реализации.

Snapshot из actual `native-cycle2-prepared.json.result`: revision `5a55e200c7807177bb7d1e8e39b5eb2b7db0d4d68b3d69d07d182b3403122657`, nonce `893f82d3-e2ae-48df-b357-f3031a194fdf`. В начале и после собственных запусков **46/46 manifest SHA совпадают**, mismatches `[]`. С initial manifest независимо вычислены **12 changed paths**: branding route/validator, 4 web test files (branding, project-branding, schema, mutation runner), widget index/styles/test, QA runner, E2E и новый `docs/embed-contract.md`. Список с digest — `.secrets/qe-regression-cycle2-manifest.json`. Прочитан actual `author-repair-delta.json`; его structural classification соответствует изменению validator, наблюдаемости, runtime mount и CSS adoption, а не только wording.

Отбор: **mustRun** — шесть прежних affected web suites с новым saved-row reader/logger/URL кодом, весь widget suite с новыми API/fallback tests и ordinary E2E на текущей готовой сборке. **shouldRun** — schema/legacy, view binding, wall/newest-50/proof/badge regressions уже включены в выбранные suites. **canSkip в focused повторе** — неизменённые 120 extended tests первого цикла и immutable offline raster rerun; их source/dependency boundary проверена, новая дельта не меняет dashboard overview, testimonial backend, pure views или form CSS. Неизменённые зависимости перечислены в actual author changedScope и сверены с manifest. Полные pinned regression/coverage protocols и native contract остаются теми же, что в первом цикле; новый authority/gate reviewer не создавал.

### Собственные исполнения и результаты

Все команды под тем же `flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node ...`, cwd root. Runtime разрешён только synthetic QA loopback. Source/in-place mutations и новая build-команда не запускались; существующая `.next` сборка использовалась без замены. Результаты:

| Проверка / фактическая команда после локального Node | Результат | Private log |
|---|---|---|
| `scripts/run-branding-collect-preview.mjs test tests/branding.test.ts tests/project-branding.test.ts tests/wall.test.ts tests/widget-config.test.ts tests/branding-collect-schema.test.ts tests/branding-collect-visual-fixture.test.ts --maxWorkers=1 --minWorkers=1` | 79/79, 6 files, exit 0 | `.secrets/qe-regression-cycle2-targeted.log` |
| Allowlisted wrapper → local `vitest.mjs run --maxWorkers=1 --minWorkers=1`, cwd `apps/widget` | 43/43, 6 files, actual child/parent exit 0 | `.secrets/qe-regression-cycle2-widget.log` |
| Wrapper → `scripts/run-branding-collect-preview.mjs e2e`, existing build, затем private copy measurements | 14/14, 0 failed/cancelled/skipped, actual child/parent exit 0 | `.secrets/qe-regression-cycle2-e2e.log` |

**136/136 tests** во втором цикле. SHA logs, actual exit records, повторный manifest check и browser summary: `.secrets/qe-regression-cycle2-verification.json`. Собственная measurements copy: `.secrets/qe-regression-cycle2-branding-repair-e2e-measurements.json`. E2E завершился за 57,627 с и закрыл свои Next/S3/host handles. Shared recorder output совпал с прежними author bytes; авторские immutable logs не заменялись собственной оценкой.

### Проверка actual delta и новых рисков

- **HTTPS credentials, API/legacy compatibility:** `apps/web/src/lib/branding.ts:89–93` теперь проверяет и scheme, и отсутствие username/password. `branding.test.ts:34–43`, `project-branding.test.ts:178–187` проверяют user-only/password-only/encoded credentials и атомарный отказ mixed patch до записи. Обычный HTTPS остаётся valid; unchanged legacy HTTP проходит unrelated Save в повторённом E2E. Reader/DTO type shapes и whitelist не расширены. Граница old data сохранена, новые URL с credentials отвергаются.
- **Невакуозный logger и commit:** `apps/web/src/app/api/projects/[slug]/branding/route.ts:24–36,48–55` пишет `branding_patch` с ровно outcome/status/code/server UUID correlation, без request body/URL/error object, 200 только после awaited repository COMMIT. `project-branding.test.ts:130–175` требует существование конкретных INFO/WARN/ERROR calls и корректную корреляцию; при отсутствии sink тест уже не может пройти. `:190–208` принудительно отклоняет COMMIT, требует 503/WRITE_FAILED, отсутствие INFO и неизменность БД. Оба реальных теста повторены; старый logger gap не игнорируется по проценту покрытия. Новых raw payload логов не найдено. Source-mutation `outcome-sink-removed` прочитана, но самостоятельно in-place не запускалась.
- **Обычная moderation API:** `tools/visual/branding-collect.e2e.test.mjs:114–138` вызывает owner POST `/api/testimonials/{id}/moderate`, проверяет точный transition response и persisted approved, foreign 403/anonymous 401/expired 401 при прежнем pending. Текстовый и photo-пути вызывают helper (`:224`, `:320`). В собственном browser output **2** `ordinary-owner-moderation` records; approved ID появился в own widget, чужая стена/config его не получили. SQL используется для fixtures/наблюдения/истечения synthetic session, успешное approval выполняется HTTP.
- **Editor URL и три уровня reflow:** `tools/visual/branding-collect.e2e.test.mjs:442–523` измеряет document, реальный shadow host и rendered ShadowRoot отдельно; editor посещается для 320/360/390 × light/dark, heading120/logo2048 сохраняют значения, Home/End/selection/internal scroll и focus проверяются, длинная error не обрезается. `apps/widget/src/index.ts:41–44` устраняет host clientWidth0 через block/min/max width. В собственных measurements **6 editor cases и 6 widget-three-level cases**; document/host/root bounds прошли. Negative nowrap/hidden oracle остаётся действующим. Изменение mount влияет на реальную host geometry, поэтому классификация structural оправданна.
- **Actual old reader на committed row:** `branding-collect-schema.test.ts:102–121` вызывает настоящий `patchOwnedBranding`, читает запись отдельным admin client после 200, исполняет TS-reader из `git show 4da1c64…:apps/web/src/lib/branding.ts` (SHA `4447bd65…730d8`), проверяет старые три поля, name/unknown и неизменность stored extended JSON. Этот тест исполнен самостоятельно; в отличие от первого цикла это уже не plain object probe или transaction ROLLBACK. Он доказывает data compatibility старого reader после нового writer, но не операционный deploy rollback целой среды. Решение о PRIMARY-04 остаётся у origin.
- **Constructed stylesheet/CSP:** `apps/widget/src/styles.ts:108–127` сохраняет `injectScopedStyles(root): void`, создаёт sheet в ownerDocument realm, сохраняет existing adopted sheets, использует прежний CSS; unsupported API имеет явный legacy fallback, supported adoption error пробрасывается. Повторены tests в `widget-branding.test.ts:19–94` (success, iframe realm, unsupported fallback, adoption failure). `docs/embed-contract.md:23–53` честно ограничивает strict CSP современными API и pinned Chromium. В own ordinary E2E фактический foreign host `http://widget.synthetic.test:33189` отдавал `style-src 'self'` без unsafe-inline; bundle `widget.0837c760.js`, SHA `0837c76006f9782264ca52f036c643ca1d9d04eada3ebfe92a1f5361967d132e`. Проверены 0 inline style nodes/0 CSP violations, adopted sheet, dark/light surface/font/padding, чужой CSS/script, CORS `*` при credentials omit и отсутствие cookie/Authorization. Обратный inline injector пойман CSP и потерей padding; positive host восстановлен. Это новое собственное browser evidence, а не доверие author grade.
- **QA boundary:** единственная runner delta `scripts/run-branding-collect-preview.mjs:51` убирает HOME из allowlist; allowlist/synthetic endpoint refusal остаются. Свежие schema negatives прошли. Собственный E2E: SDK PUT1/GET42, controlled failures3; 12 synthetic remote-logo browser attempts abort-нуты allowlist, реальных outbound provider calls не было. Public preview ports и внешний стенд не затронуты.

### Актуальное покрытие и visual binding

Независимо заново разобраны **18 полных source records** из `.secrets/branding-repair-{web,widget}-coverage/coverage-final.json` через actual Istanbul API. LCOV здесь не предоставлен; использованы V8/Istanbul raw JSON и summaries. Для каждого source SHA совпал с текущим manifest, для каждого line/branch count совпал самостоятельно пересчитанный результат. Все **13 raw artifact hashes/sizes** из primary repair handoff совпали. Полные метрики/uncovered locations/digests — `.secrets/qe-regression-cycle2-audit.json`.

| Production file | Lines | Branches | Functions |
|---|---:|---:|---:|
| web lib/branding.ts | 84/84 | 99/100 | 6/6 |
| web lib/project-branding.ts | 31/31 | 17/18 | 2/2 |
| web api/projects/[slug]/branding/route.ts | 44/44 | 42/43 | 4/4 |
| web dashboard/[slug]/branding/page.tsx | 10/10 | 5/5 | 1/1 |
| web dashboard/[slug]/branding/branding-editor.tsx | 60/60 | 24/29 | 3/3 |
| web dashboard/[slug]/branding/branding-view.tsx | 27/27 | 33/34 | 10/10 |
| web f/[slug]/page.tsx | 13/13 | 3/3 | 2/2 |
| web f/[slug]/submit-form.tsx | 104/104 | 62/68 | 6/6 |
| web f/[slug]/intake-tabs.tsx | 27/27 | 13/13 | 2/2 |
| web f/[slug]/collect-view.tsx | 27/27 | 37/37 | 6/6 |
| web lib/wall.ts | 46/46 | 11/11 | 3/3 |
| web w/[slug]/page.tsx | 145/147 | 49/54 | 4/4 |
| web lib/widget-config.ts | 50/50 | 12/15 | 2/2 |
| widget types.ts | 0/0 | 1/1 synthetic | 1/1 synthetic |
| widget index.ts | 51/52 | 12/14 | 5/5 |
| widget render.ts | 121/121 | 49/51 | 6/6 |
| widget styles.ts | 13/13 | 4/4 | 1/1 |
| web dashboard/[slug]/page.tsx | 114/115 | 7/20 | 2/2 |

Итог: **967/971 lines/statements = 99,588%; 480/520 branches = 92,308%; 66/66 functions**, включая один synthetic type-only entry. Все 17 executable files >90% lines. По сравнению с independently recalculated cycle1 добавлены 27/27 covered line entries и 19/19 covered branch entries; четыре прежние uncovered lines остались (widget index номер сместился с 95 на 99). Это сравнение **cycle1→cycle2**, не Git-base/global coverage. Неизменённые editor branches 24/29 и dashboard branches 7/20 не переименованы в полное scenario coverage. Новые live browser checks не включаются в V8 numerator. Числа автора подтверждены данными, его grade не использован.

BrandingView/CollectView, form CSS, offline renderer и fixture test **5/5 SHA неизменны**; source binding собственных cycle1 **6 zero-diff +18 detected mutations** сохраняется. `verifyIntegrity()` снова проверил **29 baseline files /9 cases**. Эти PNG не переснимались без причины и не используются как доказательство live pixel identity. Live palette `#8e806b` остаётся отличной от original literal `#ddd3c2`; собственный E2E повторил field-border/contrast и отрицательную замену old border.

Новых серьёзных рисков в actual 12-path delta и affected dependencies не обнаружено. Явные границы: strict CSP проверен в Chromium148; legacy unsupported-API fallback strict CSP не обещает; full-environment rollback/public deployed widget отдельно; manual real screen-reader остаётся owner acceptance после test-публикации. Это phase-correct pending manual acceptance, не автоматический pass и не новое finding. Статус других origins и canonical native closure не присваиваются этой роли.

## Первичный цикл — исторический отчёт revision b3b7f477…

Вердикт роли: **clean — дополнительных собственных условий нет**. Это не общая готовность фичи: уже принадлежащие другим независимым ролям условия остаются открытыми, включая PRIMARY-04 (rollback reader), PRIMARY-03/RISK-02 (полнота reflow), RISK-01 (logging) и INTEGRATION-03 (CSP). Данный reviewer их не закрывает и не переименовывает.

Reviewer `qe-regression`, family `codex`, отдельная сессия без истории автора; фактический dispatch по переданным метаданным — `gpt-6-astra`, `xhigh`, `fork_turns=none`. Авторы — `gpt-6.1-sol/high`. Дата: 2026-11-12. Исходный Git base: `4da1c64b6dcc537a412646183344dcb53645ea02`.

Native initial snapshot: revision `b3b7f4779c855441ae482ff5f7d813527058aa6bb9e80536eeb2a4cfa20fb71c`, nonce `bbba4b1f-3593-41a6-a8be-e3c711994fe2`. В начале и после всех собственных проверок SHA-256 **45/45 manifest paths совпали**, mismatches `[]`. Host prepare/evaluate, source edits, source-mutation runner, baseline/state/vendor изменения, commit/push и публикация не выполнялись.

Прочитаны AGENTS/review-policy/model-matrix, Direct integration, module 03.5/08/09, полные `regression-testing` и `qe-coverage-analysis`, требования/OpenSpec и применимые ADR/архитектурные контракты. `run-history.json` пуст: исторического coverage trend нет. `dz recall` дал один lexical hit об owner-approved live border; фрагмент не использован как самостоятельное доказательство. Первичная попытка recall по неверному `bin/dz.js` завершилась exit 1; повтор по фактическому `dist/bin.js` — exit 0. Обязательная память/gate оркестрации принадлежит host; reviewer не пишет authority или skill history вне выделенных файлов.

## Impact и выбор набора

| Приоритет | Причина и набор | Выполнение |
|---|---|---|
| mustRun | Новый owner writer/route и dirty editor: `branding`, `project-branding`, `branding-collect-schema`; изменённые public readers: `wall`, `widget-config`; production view bindings: `branding-collect-visual-fixture` | Собственный прогон: 76/76, 6 files, exit 0 |
| mustRun | Widget DTO normalization, bootstrap, provenance, escaping, server badge и integrity: все 6 widget test files | Собственный прогон: 39/39, exit 0 |
| mustRun | Production-view ↔ frozen source binding, исходная palette, geometry/font/color oracle | Собственный renderer: 6 zero-diff + 18 detected mutations, exit 0 |
| shouldRun | Транзитивные зависимости: существующие testimonial/photo/storage, moderation, dashboard overview/RLS/fixture, выключенное video, widget install, tariff | Собственный прогон: 120/120, 10 files, exit 0 |
| canSkip в собственном повторе | Billing/webhook/provider, partner/referral, email/STT и прочие неизменённые сервисы: нет изменения их source/contracts, роль не вызывает внешние providers | Авторский full-suite raw log прочитан; эти проверки не названы собственными |

235 собственных Vitest tests, 22 test-file executions, **0 failed, 0 skipped**. Дополнительно 9 pure-reader compatibility cases и 24 visual comparisons. Один успешный повтор не измеряет flaky rate. В сравнении с 999 тестами авторских web+widget suites собственный выбор 235 сокращает число на 76,48%; это не утверждение о доле обнаруживаемых дефектов.

Все runtime-команды исполнялись из root через `flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node ...`. Общий lock также охватывал wrapper и дочерний Vitest. Существующие web tests работали только через проверенный QA runner; widget wrapper запускал Vitest с пустым allowlist env (`PATH/LANG/TZ/NODE_ENV`). Реальные `.env`/provider credentials не читались, public ports не использовались. Offline fixture 33189 остановлена в `finally` до завершения проверки.

```text
flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/run-branding-collect-preview.mjs test tests/branding.test.ts tests/project-branding.test.ts tests/wall.test.ts tests/widget-config.test.ts tests/branding-collect-schema.test.ts tests/branding-collect-visual-fixture.test.ts --maxWorkers=1 --minWorkers=1
=> Test Files 6 passed (6); Tests 76 passed (76); exit 0; .secrets/qe-regression-targeted.log

flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/run-branding-collect-preview.mjs test tests/testimonial.test.ts tests/photo.test.ts tests/storage-cloudru.test.ts tests/moderation.test.ts tests/dashboard-overview.test.ts tests/dashboard-overview-db.test.ts tests/dashboard-visual-fixture.test.ts tests/video-intake-switch.test.ts tests/widget-install.test.ts tests/tariff.test.ts --maxWorkers=1 --minWorkers=1
=> Test Files 10 passed (10); Tests 120 passed (120); exit 0; .secrets/qe-regression-extended.log

flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node --input-type=module -
=> isolated spawn(process.execPath, [root/node_modules/vitest/vitest.mjs, 'run', '--maxWorkers=1', '--minWorkers=1'], cwd=apps/widget)
=> Test Files 6 passed (6); Tests 39 passed (39); actual child/parent exit 0; .secrets/qe-regression-widget.log

flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/render-branding-collect-fixture.mjs --output .secrets/qe-regression-visual-initial --verify
=> branding exitCode 0; collect exitCode 0; parent exit 0; .secrets/qe-regression-visual-initial.log
```

## Проверенные регрессионные границы

- **Legacy и additive API.** `branding.ts:5–16` сохраняет трёхпольный `Branding`, отдельный `ResolvedBranding` добавляет поля; reader defaults — `:39–50`. `branding.test.ts:38` использует настоящий typed трёхпольный literal. В widget `types.ts:52–75` branding optional, `render.ts:158–166` нормализует missing/malformed network input; `widget-branding.test.ts:45` проверяет bad/null/array/string/CSS injection и legacy rendering. Новый writer добавляет owner API, прежний testimonial API не изменён. Все перечисленные тесты прогнаны самостоятельно.
- **Dirty merge/tenant/permission.** `project-branding.ts:19–36` — validation до транзакции, tenant SELECT FOR UPDATE и JSONB merge. `project-branding.test.ts:32–115` проверяет unknown/name preservation, раздельные concurrent keys, denied UPDATE, foreign/inactive и наблюдает роль/GUC actual statements. Тесты прошли; собственных source mutations не было. Full source-mutant 12/12 — только проверенный авторский raw log, не собственный запуск.
- **Old reader.** Независимый bounded probe извлёк именно `git show 4da1c64…:apps/web/src/lib/branding.ts`, исполнил его через esbuild transform и сравнил 3 legacy objects × 3 added-field patches. 9/9 pass; old reader SHA `4447bd65d7be631a9f98701145fad09c946dfc2b3eb93296daf9e878445730d8`. Это объекты в памяти. `branding-collect-schema.test.ts:91–105` делает SQL merge и transaction ROLLBACK, затем проверяет исчезновение fixture row, но не вызывает старый reader после нового writer. Spec `:241–245` требует именно persisted-row сценарий. PRIMARY-04 остаётся открытым; `.secrets/qe-regression-base-reader.json` явно ограничивает proof.
- **Approved/order/proof/badge.** `wall.ts:34–45` сохраняет project/status predicate и сортирует все approved с ID tie-break. `widget-config.ts:85–96` сначала выбирает newest 50, затем меняет порядок выбранного множества. `widget-config.test.ts:51–70` использует 53 одинаковых timestamp и сравнивает IDs/reverse; отдельные тесты проверяют pending/foreign, free/expired/paid и отсутствие tier. `wall.test.ts:27–85`, widget branding tests проверяют false-label caption, source URL и screenshot одновременно, literal text, transcript/demo на применимых поверхностях и badge. Source поля DTO не стираются при toggle. Эти unit/integration tests прошли самостоятельно; живой two-origin browser proof отдельно, со своими ограничениями.
- **Dashboard.** `git diff 4da1c64… -- apps/web/src/app/dashboard apps/web/src/app/globals.css packages/db/migrations` содержит среди существующих файлов только одну строку в project page: `page.tsx:119`, ссылка на branding. Overview и globals байты не менялись; новых SQL migrations нет. Пройдены overview/DB/fixture regressions. Новый CSS ограничен `.proofo-forms` и `body:has(.proofo-forms)`, обычный dashboard не получает этот root. Это source/functional regression evidence, не новый live dashboard pixel pass.
- **Честность live UX.** `branding-editor.tsx:55–57` предлагает только newest/oldest и сообщает правильную newest-50 семантику; `intake-tabs.tsx:19` при false сразу рендерит SubmitForm. `submit-form.tsx:98–106` передаёт `tabs: []`, реальный photo hint, disclosure о проверке владельцем, success только при 201 (`:83`). В этих production models нет prototype rating/video-first/тарифных обещаний. Исключительно offline literal model содержит исходные прототипные надписи; в production components нет isFixture/auth/seed override.

## Coverage из фактических raw данных

Самостоятельно перечитаны `.secrets/branding-web-coverage/coverage-final.json` и widget counterpart через `istanbul-lib-coverage`, пересчитаны summary/uncovered lines/branches; результат `.secrets/qe-regression-audit.json`. LCOV-файлы в переданном наборе отсутствуют — они не выдуманы; использован raw Istanbul JSON и реальные Vitest logs. SHA всех 18 sources совпали с frozen manifest и source provenance. Это **полные файлы**, включая прежние строки; CSS, QA tools и E2E не входят в этот denominator. Type-only file не имеет executable lines; synthetic V8 branch/function entries в нём не являются проверкой TypeScript type safety.

| Production path (apps/) | Lines covered/total | Branches covered/total | Functions covered/total |
|---|---:|---:|---:|
| web/src/lib/branding.ts | 81/81 | 97/98 | 6/6 |
| web/src/lib/project-branding.ts | 31/31 | 17/18 | 2/2 |
| web/src/app/api/projects/[slug]/branding/route.ts | 30/30 | 28/29 | 3/3 |
| web/src/app/dashboard/[slug]/branding/page.tsx | 10/10 | 5/5 | 1/1 |
| web/src/app/dashboard/[slug]/branding/branding-editor.tsx | 60/60 | 24/29 | 3/3 |
| web/src/app/dashboard/[slug]/branding/branding-view.tsx | 27/27 | 33/34 | 10/10 |
| web/src/app/f/[slug]/page.tsx | 13/13 | 3/3 | 2/2 |
| web/src/app/f/[slug]/submit-form.tsx | 104/104 | 62/68 | 6/6 |
| web/src/app/f/[slug]/intake-tabs.tsx | 27/27 | 13/13 | 2/2 |
| web/src/app/f/[slug]/collect-view.tsx | 27/27 | 37/37 | 6/6 |
| web/src/lib/wall.ts | 46/46 | 11/11 | 3/3 |
| web/src/app/w/[slug]/page.tsx | 145/147 | 49/54 | 4/4 |
| web/src/lib/widget-config.ts | 50/50 | 12/15 | 2/2 |
| widget/src/types.ts | 0/0 (type-only) | 1/1 (V8 synthetic) | 1/1 (V8 synthetic) |
| widget/src/index.ts | 48/49 | 12/14 | 5/5 |
| widget/src/render.ts | 121/121 | 49/51 | 6/6 |
| widget/src/styles.ts | 6/6 | 1/1 | 1/1 |
| web/src/app/dashboard/[slug]/page.tsx | 114/115 | 7/20 | 2/2 |

Итог: lines/statements **940/944 = 99,576%**, branches **461/501 = 92,016%**, functions **65/65** с указанным synthetic entry. 17 executable files каждый >90% lines. Это не all-workspace/global coverage и не доказательство отсутствия отсутствующей реализации. В частности, vacuous logger assertion может проходить при отсутствии logger; эту проблему сохраняет RISK-01.

Риск-приоритет пробелов: новые error handling branches editor `:40/44` и in-flight guard `:62`; сохранение provenance в widget-config `:110/112/113` имеет 0 V8 branch hits, но отдельный живой E2E проверяет DTO до/после toggle — browser execution не входит в V8 сбор. Page branches 7/20 в основном прежние paid/delivery/null paths; изменение здесь — только link. Четыре uncovered lines: wall page `:238–239` (plural helper), widget index `:95` (debug callback), dashboard project `:137` (paid date formatting). Их низкий риск для данной дельты не снимает живые proof/reflow/CSP условия. Исторического branch/base coverage артефакта нет: **coverage delta/«не ухудшилось» не установлены**, процент текущего full-file не подменяет сравнение с base. Численный risk-score без bug-history/change-frequency данных не придуман.

Сверены все 7 SHA raw logs из author handoff: web coverage, widget, typecheck, build, E2E, source mutations, process unit — совпали. Web raw output: 957 passed / 3 skipped (`storage.test.ts`); widget 39 passed; E2E TAP 13 passed, 0 skipped. Исторические exit codes handoff согласуются с выводом; actual exit 0 независимо получен только для собственных запусков выше. Три external storage skips не объявлены pass; настоящий local SDK photo flow заявлен отдельным E2E. Отсутствующий lint script не назван успешной проверкой.

## Visual и границы доказательства

`scripts/render-branding-collect-fixture.mjs:28–37` импортирует реальные BrandingView/CollectView, esbuild metafile identity содержит их текущие SHA. Literal original palette `#ddd3c2` задаётся в renderer; live containers оба задают `#8e806b` по решению владельца от 2026-11-12. Browser/network у offline fixture ограничен loopback, Next/auth/DB не участвуют.

Свежие независимые reports `.secrets/qe-regression-visual-initial-{branding,collect}-visual/report.json`: branding и collect × 1440×900/390×844/360×800, DPR1. Все 6 idle cases: `rawDiffPixels=0`, geometry/styles/text/values также совпали. Все 18 ephemeral CSS mutations font/margin/color дали ненулевой raster diff; source files не мутировались. `check-proofo-visual.mjs:26–34,95–99` проверяет точные RGBA bytes/zero threshold; mutation success означает обнаруженное отличие, а не сходство мутанта. `verifyIntegrity()` заново сверил pinned manifest hash, complete inventory и каждый digest: **29 files, 9 cases**, baseline не менялся. Два свежих mobile кадра также просмотрены визуально.

Данный результат доказывает исходный initial-idle layout этих же views с literal model. Он не объявляет полное pixel identity живого UI, не закрывает dark/success/error/hydrated states, контраст либо AT. `tools/visual/branding-collect.e2e.test.mjs:387–420` действительно не открывает editor в reflow loop, не проверяет Home/End logo URL и явно не измеряет shadow host: независимое чтение подтверждает границу PRIMARY-03/RISK-02. Строгий CSP не покрыт авторским fixture (`:104` разрешает unsafe-inline); отдельный browser defect имеет origin INTEGRATION-03. Ручной real screen-reader остаётся owner acceptance опубликованной test copy, не automated pass.

## Итог роли и артефакты

Дополнительных собственных подтверждённых серьёзных дефектов после указанного scope review не найдено; новые REGRESSION-ID ради количества не создаются. Выбранные регрессионные проверки зелёные, frozen visual доказан самостоятельно, текущие coverage числа пересчитаны. Общая поставка зависит от исправления/проверки существующих origin conditions, canonical host evaluate и отдельной ручной приёмки; этот отчёт не разрешает поставку.

Сводка actual command exits, повторного 45-path hash check и digest собственных logs: `.secrets/qe-regression-verification.json`. Raw audit: `.secrets/qe-regression-audit.json`; pure-reader probe: `.secrets/qe-regression-base-reader.json`. Автоматические проверки процесса/память host, исторические author observations и настоящая ручная AT приёмка не смешаны с собственным результатом reviewer.
