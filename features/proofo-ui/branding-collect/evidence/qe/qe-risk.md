# QE RISK — branding + collect

**Текущий focused cycle2 verdict: clean**, только по роли `qe-risk` и её RISK-01/RISK-02. Оба исходных condition objects сохранены byte-exact; добавлены собственные structural verifications текущей ревизии. Это не aggregate closure и не разрешение production-поставки. Исторический initial review ниже сохранён отдельно.

Ревизия `5a55e200c7807177bb7d1e8e39b5eb2b7db0d4d68b3d69d07d182b3403122657`, nonce `893f82d3-e2ae-48df-b357-f3031a194fdf`, из фактического `native-cycle2-prepared.json.result`. До и после собственных прогонов **46/46 SHA-256 совпали**; 12 changed/added paths против initial snapshot соответствуют actual author delta. Прочитаны `author-repair-delta.json`, source-bound repair evidence и handoff; авторские результаты не заменяли самостоятельную проверку. Фактический dispatch остался `gpt-6-astra/xhigh`, `fork_turns=none`, code authors `gpt-6.1-sol/high`: метаданные координатора, не provider attestation.

## Cycle2 — собственное исполнение

- **EXECUTED:** `flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/run-branding-collect-preview.mjs test tests/project-branding.test.ts tests/branding-collect-schema.test.ts tests/branding.test.ts --maxWorkers=1 --minWorkers=1`: **39/39**, exit0, 3.84s. `.secrets/bc-qe-risk-cycle2-critical.log`, SHA `18a171c328866ee8348b5dacc5d26406af3ace2aa004069d41b50f2544bcf615`.
- **EXECUTED:** полный runner `e2e` под тем же lock: **14/14**, exit0, 56.6795s. `.secrets/bc-qe-risk-cycle2-e2e.log`, SHA `ef73c1259727eb6eb2a32f6c6fbf72815ef22f61464e7216122454c5c99f1ce1`. Использован coordinator-built BUILD_ID `e19RhYitYH_pbxzgNnPaA`; собственный build не заявляется. Реальный served widget `widget.0837c760.js`, SHA `0837c76006f9782264ca52f036c643ca1d9d04eada3ebfe92a1f5361967d132e`, gzip3646 bytes. Measurements сохранены отдельно в `.secrets/bc-qe-risk-cycle2-e2e-measurements.json`, SHA `a16a714eea60319dc163f9a374899cbc2766c1b446c448cc42ad0bda090a786f`.
- **EXECUTED:** независимый dead-sink mutant только в transient slim copy, не в measured root. Удалены **все три** INFO/WARN/ERROR вызова; общая physical pg dependency проверена, PG под общим lock. Baseline exit0; mutant exit1, targeted **AssertionError: expected1 call / received0** в `project-branding.test.ts:142,153`. `.secrets/bc-qe-risk-cycle2-sink-proof.json`, SHA `4cb9fcd934bf0fa5f0f5c9f47b495e3f5eb3e6a4aac206cca321367bb862efb6`; raw `…sink-baseline.log`, `…sink-mutant.log`. Copy удалена. Это собственный kill; авторский info-only mutant не выдаётся за него.

## Cycle2 — RISK-01 подтверждён

**STATIC + EXECUTED:** `apps/web/src/app/api/projects/[slug]/branding/route.ts:23–55` создаёт server UUID correlation; fixed event содержит только `outcome/status/code/correlation`, response получает `x-request-id`. Реальные sinks: `console.info` → stdout, `console.warn/error` → stderr, формат `branding_patch` + Node console object (не JSONL). Код не сериализует request, payload, URL, session, photo key или exception. `COMMITTED` после awaited `patchOwnedBranding`, который возвращается после COMMIT; failed code извлекает только сравнение SQLSTATE42501.

`project-branding.test.ts:130–168` реально выполняет committed200, forbidden-field400, foreign-Origin403 и REVOKE UPDATE→503 DB_PERMISSION; требует точное событие и корреляцию, отсутствие payload sentinel, INFO после завершившегося реального COMMIT. Raw собственного полного suite также содержит фактические stdout/stderr события. `:181–197` инъецирует отказ COMMIT на настоящем client query path:503 WRITE_FAILED, нет INFO, ERROR без fault/payload sentinel, независимое чтение подтверждает rollback. Dead-sink negative control выше исключает прежнюю vacuous проверку пустого console array. **RISK-01 implementationVerified=true.** Это не повторная классификация historical photo GET logging.

## Cycle2 — RISK-02 подтверждён

**STATIC + EXECUTED:** E2E `:469–527` действительно открывает editor на320/360/390 CSS px × light/dark, с heading120, logo URL2048 и error2056. Проверяются full values, End/Home/Shift+End, selection endpoints, internal input scroll, focus и viewport для input/Save, сохранение URL после503, document overflow≤1px. Получены все шесть `branding-editor-reflow` records. Длинная error — управляемый browser HTTP503 response, не утверждение, что сервер производит сообщение такой длины.

`reflow():435–467` отдельно измеряет document, `.pw-widget` и настоящий `getRootNode() instanceof ShadowRoot` с отдельной host geometry. ShadowRoot сам не layout element: измеряются реальные rendered children и их границы относительно host, без фиктивного `ShadowRoot.clientWidth`. В обоих themes получены:

| Viewport | Document client/scroll | Host client/scroll/width | Host bounds = ShadowRoot rendered bounds |
|---|---|---|---|
| 320 | 320/320 | 304/304/304 | 8…312 |
| 360 | 360/360 | 344/344/344 | 8…352 |
| 390 | 390/390 | 374/374/374 | 8…382 |

No-wrap/hidden-overflow DOM mutant `:524–526` убит actual oracle; данные не усекались, goldens не менялись. Реальная поправка `apps/widget/src/index.ts:38–42` задаёт host display:block после all:initial, minWidth0/maxWidth100%, поэтому независимый host oracle теперь получает реальную ширину. **RISK-02 implementationVerified=true.** Manual screen-reader остаётся **pending owner acceptance phase опубликованной test copy**, общего automated AT/AA pass нет.

## Cycle2 — фактическая дельта и affected dependencies

| Область | Независимая проверка и граница |
|---|---|
| CSP и widget styles | **STATIC + EXECUTED:** `styles.ts:108–122` использует constructed sheet из ownerDocument realm и сохраняет существующие adopted sheets; CSS text неизменён. E2E:85–111,530–537 проверяет отдельный host origin, executing host script, hostile magenta CSS, настоящие computed widget styles, отсутствие CSP violations и inline style при `style-src 'self'`, CORS* и credentials:omit. Замена adopted sheet на inline в browser вызывает CSP violation, потерю padding16px и отказ oracle. Actual browser Chromium148.0.7778.97. Legacy fallback и throwing-adoption unit cases прочитаны **STATIC**, отдельно widget unit suite этим reviewer в cycle2 не запускался; strict CSP для legacy capability fallback не обещан в docs/embed-contract.md. |
| Credential-bearing logo | **STATIC + EXECUTED:** `branding.ts:86–96` отвергает username/password редактируемого HTTPS URL. `project-branding.test.ts:170–178` проверяет mixed patch с plaintext/encoded userinfo,400 и отсутствие любых изменений строки; branding suite проверяет validator corpus. Legacy HTTP read и dirty-unrelated compatibility не переписаны. |
| Ordinary owner approval | **EXECUTED:** E2E:113–140 проходит настоящий moderation API для text и photo; до approval публично скрыты, foreign403/anonymous401/expired401 оставляют pending, own200 даёт approved; foreign wall/config исключены. Два records с approved1 и всеми тремя denials1. Это API/session proof, не утверждение о manual moderation UI. Initial SQL-transition-only ограничение для этих двух путей заменено этим исполнением. |
| Persisted-row old reader | **EXECUTED:** schema test:81–118 пишет current `patchOwnedBranding`, независимый client читает committed JSON с новыми/unknown fields; `git show 4da1c64…:apps/web/src/lib/branding.ts` компилируется и реально выполняет old.readBranding на этой строке. Три старых поля точны, повторное чтение БД неизменно. Old source SHA `4447bd65d7be631a9f98701145fad09c946dfc2b3eb93296daf9e878445730d8`. Это old-reader compatibility на allocated DB, не fresh migration replay. |
| Runner / environment | **STATIC + EXECUTED:** единственная runner delta — удаление HOME override. Обратное добавление ровно этого token восстанавливает initial SHA `0ab904b64cf298b176fcb94d843b9f8f85e3ce3a0995005a7ec49fa4217ecbf3`. Private file/symlink/mode, localhost endpoints, synthetic S3 sentinels, env/argv whitelist и NODE_OPTIONS checks не ослаблены; реальные child-spawn unsafe-config negatives входят в39/39. Synthetic env читался только checked runner, не выводился. |
| Неизменённые критические зависимости | Tenant role/GUC и merge writer unchanged; actual SELECT/UPDATE role assertions, foreign/permission tests, атомарный dirty merge/rollback повторно прошли в project-branding suite. Save-inflight/two-tabs, raw/trim corpus, legacy JSON/HTTP, proof/badge/approved/tier/widget-order paths повторно проходят full E2E; broader initial SQL/SDK suite не объявлен заново исполненным. |

Local product SDK в own E2E:1 PUT/42 GET,3 контролируемых failures, фото68 bytes;12 внешних browser attempts перехвачены, внешние providers не вызывались. Manual AT, whole browser support, live Cloud.ru и production readiness не следуют из этих проверок. Disabled rating/video не считаются реализованными.

## Cycle2 — риск и покрытие

**INFERENCE:** исходная матрица12 SFDIPOT ниже сохраняет историческую оценку. Текущее изменение: №12 теперь **MITIGATED** для нового PATCH благодаря реальным outcome events и commit/rollback proof; coverage gap RISK-02 в №5/10/11 устранён для измеренных шести комбинаций. №11 дополнительно проверен строгим CSP/constructed CSS/host bounds. №1/2 повторно подтверждены фактическими SQL/commit tests, остальные unchanged contracts и ограничения initial review сохраняются. Новых серьёзных delta risks и новых условий этой роли не установлено. Шесть original QCSD acceptance meanings переоценены в затронутой части: SECURITY-01 теперь имеет redacted outcome signal, ACCESSIBILITY-03 имеет editor/URL/host proof; чужие condition closures не подписываются. Manual ACCESSIBILITY-02 owner phase остаётся pending.

**SUPPLEMENTAL, не собственный instrumented run:** текущий full18 production coverage report независимо проверен по18/18 source SHA и суммам counters: **967/971 lines (99.588%)**, **480/520 branches (92.308%)**. Авторские43/full-suite claims не превращены в собственные execution counts. Это scoped total, не whole-app coverage и не differential baseline trend. Текущие полные данные:

| Production path | Lines covered/total | Branches covered/total |
|---|---:|---:|
| `apps/web/src/lib/branding.ts` | 84/84 | 99/100 |
| `apps/web/src/lib/project-branding.ts` | 31/31 | 17/18 |
| `apps/web/src/app/api/projects/[slug]/branding/route.ts` | 44/44 | 42/43 |
| `apps/web/src/app/dashboard/[slug]/branding/page.tsx` | 10/10 | 5/5 |
| `apps/web/src/app/dashboard/[slug]/branding/branding-editor.tsx` | 60/60 | 24/29 |
| `apps/web/src/app/dashboard/[slug]/branding/branding-view.tsx` | 27/27 | 33/34 |
| `apps/web/src/app/f/[slug]/page.tsx` | 13/13 | 3/3 |
| `apps/web/src/app/f/[slug]/submit-form.tsx` | 104/104 | 62/68 |
| `apps/web/src/app/f/[slug]/intake-tabs.tsx` | 27/27 | 13/13 |
| `apps/web/src/app/f/[slug]/collect-view.tsx` | 27/27 | 37/37 |
| `apps/web/src/lib/wall.ts` | 46/46 | 11/11 |
| `apps/web/src/app/w/[slug]/page.tsx` | 145/147 | 49/54 |
| `apps/web/src/lib/widget-config.ts` | 50/50 | 12/15 |
| `apps/widget/src/types.ts` | 0/0 | 1/1 |
| `apps/widget/src/index.ts` | 51/52 | 12/14 |
| `apps/widget/src/render.ts` | 121/121 | 49/51 |
| `apps/widget/src/styles.ts` | 13/13 | 4/4 |
| `apps/web/src/app/dashboard/[slug]/page.tsx` | 114/115 | 7/20 |

`authorAssessmentChecked=true`, `deltaVerification.classification=structural`, `implementationVerified=true` относятся к собственной проверке actual implementation cycle2. Обе original conditions сохранены byte-exact, только собственные две verifications привязаны к текущей ревизии. В repo изменены только этот отчёт и собственный entry; source/host/native state/чужие entries не редактировались. Финальный повторный hash check46/46 чист. Native evaluate и общий receipt выполняет координатор.

---

## История: initial review, прежняя ревизия b3b7f477…

Следующие findings, номера строк, counts и conditional verdict относятся **только к initial snapshot**; текущий вывод и повторные доказательства находятся выше.

Вердикт роли: **conditional**. Два собственных условия WARNING/structural: RISK-01 (обещанная наблюдаемость нового PATCH отсутствует) и RISK-02 (неполный browser oracle reflow). Установленных новых HIGH/CRITICAL дефектов изоляции, атомарности или публикации не найдено. Это собственный initial review, не aggregate closure и не разрешение production-поставки.

Роль `qe-risk`, family `codex`, независимый cross-model review. Фактический dispatch координатора: `gpt-6-astra`, `xhigh`, `fork_turns=none`; автор кода — `gpt-6.1-sol/high`. Это метаданные запуска, не аттестация провайдера. Сессия `/root/bc_qe_risk`. Baseline `4da1c64b6dcc537a412646183344dcb53645ea02`; native initial revision `b3b7f4779c855441ae482ff5f7d813527058aa6bb9e80536eeb2a4cfa20fb71c`, nonce `bbba4b1f-3593-41a6-a8be-e3c711994fe2`. До проверки повторно SHA-256 измерены все **45/45** manifest paths: расхождений нет.

Прочитаны AGENTS, review-policy/model-matrix, CLAUDE/workflow, правила security/testing, core CJM, Direct integration, полные `risk-based-testing/SKILL.md` и `qe-coverage-analysis/SKILL.md`, binding module 03.5/08/09, требования/OpenSpec, ADR, архитектура/план, исходная матрица QCSD и реальные source/tests. `dz recall --json` вернул два полных урока: actual statement role/GUC и раздельные live/frozen contrast proofs; оба применены к проверкам ниже. AQE fleet/native orchestration остаются обязанностью координатора; отдельный ML risk predictor не запускался. `run-history.json` пуст: тренд/регрессия покрытия не выводились; общий skill history не изменён по ограничению write scope.

## Самостоятельные проверки и пределы

- **EXECUTED:** через `flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/run-branding-collect-preview.mjs test … --maxWorkers=1 --minWorkers=1`: project-branding, schema, branding, wall, widget-config — **69/69**, exit 0. Лог `.secrets/bc-qe-risk-critical.log`.
- **EXECUTED:** тем же runner/lock: testimonial, photo, storage-cloudru, branding-collect-visual-fixture — **56/56**, exit 0. Лог `.secrets/bc-qe-risk-boundaries.log`. Synthetic photo key в старом error logger отмечен как existing contract; его наличие не приписано новой поверхности.
- **EXECUTED:** полный `runner e2e`, **13/13**, exit 0, 50.8 s. Лог `.secrets/bc-qe-risk-e2e.log`; собственная копия measurements `.secrets/bc-qe-risk-e2e-measurements.json` SHA-256 `cce87bc61c90fa907e35dc916d60fda27163ceeba2c4f70e50c83156f50b2258`. Использован build `PW39fxUksRgbTdL8t4TeO`, который координатор получил clean build; сам build этим reviewer не повторялся.
- **EXECUTED:** настоящий product SDK к synthetic loopback S3: 1 PUT, 39 GET, 3 контролируемых ответа 503, затем retry201; round-trip 68 bytes проверен в E2E. Browser перехватил/заблокировал 12 внешних попыток (синтетические logo/source destinations); это не 12 разрешённых provider calls. Реальные provider env не читались, external providers не вызывались.
- **EXECUTED:** 40 комбинаций contrast (5 HEX × 2 themes × editor/collect/wall/widget), 580 observations; минимальный запас к соответствующему threshold **0.18949989**. Browser negative controls: удалённая aria-describedby/пустое сообщение (4), белый heading, возврат старой рамки, nowrap/clip — обнаружены. Это измерение конкретного inventory: `colors()` исключает скрытые/disabled nodes и измеряет focus только у уже сфокусированных элементов; общая WCAG/AT сертификация не заявляется.
- **EXECUTED:** независимый `actual-owner-role` source mutant только в slim transient copy, общий PG lock. Все три pg consumer разрешились в один physical root. Baseline exit0; `withAccount → withService` при сохранённом explicit account WHERE: exit1, **AssertionError на `project-branding.test.ts:107`: expected app_authenticated / received app_service**. `.secrets/bc-qe-risk-role-proof.json`, `…role-baseline.log`, `…role-mutant.log`; копия удалена. Первый setup-attempt не имел tsconfig.base.json, упал до тестов и **не считается kill**; его логи сохранены отдельно.
- **EXECUTED + STATIC:** offline production-view test самостоятельно прошёл; renderer импортирует реальные BrandingView/CollectView, generic palette props, без fixture HTTP route. Самостоятельно декодированы существующие PNG: 6/6 idle raster diff0, 18/18 font/margin/color mutations имеют diff>0, все 24 pixel counts совпали с raw reports. `.secrets/bc-qe-risk-pixel-proof.json`, `…frozen-artifact-controls.json`. Это повторное измерение существующих артефактов, **не новый browser capture**. Текущие view/CSS/renderer hashes совпадают; исторический summary hash fixture test устарел, поэтому его прежние «2 tests» не использованы вместо текущего самостоятельного прогона 7 tests.
- **STATIC:** остальные авторские source mutation results прочитаны только как дополнительные данные; собственным исполнением считаются actual-owner-role и browser negative controls выше. Frozen source не мутировался. Новые тесты/исправления, host/native state, baseline и общий vendor history не записывались.

## Собственные условия

**RISK-01 — WARNING, structural.** `05_architecture.md:199–206` обещает redacted outcome/status/error-code/correlation, INFO success, WARN rejection и ERROR DB permission, возможность считать failed writes. Фактический `apps/web/src/app/api/projects/[slug]/branding/route.ts:22–37` не вызывает logger; catch возвращает503 без события. Вызванный тест `project-branding.test.ts:130–136` проверяет лишь отсутствие sentinel в console calls; пустой массив проходит. Отказ правильно виден владельцу, но заявленный операторский сигнал отсутствует. Это новый недостающий behavior, не утверждение об утечке в историческом photo GET.

Приёмка RISK-01: новый PATCH действительно формирует только ограниченный технический outcome/status/error-code/correlation для успешного commit, validation/origin rejection и DB/permission failure; тесты вызывают реальные ветви, требуют наличия соответствующего события и отсутствия sentinels payload/URL/session/photo key. Success event не предшествует успешному commit. Наблюдаемый sink/format указан; тест обязан падать при удалении события. Scope: route, project-branding.test.ts, 05_architecture.md.

**RISK-02 — WARNING, structural.** `05_architecture.md:161–168`, `01_requirements.md` ACCESSIBILITY-03 и OpenSpec NFR-201 «Длинные значения и reflow» требуют production branding/collect/wall и отдельные widget host/root, full URL через Home/End/selection. Реальный тест `tools/visual/branding-collect.e2e.test.mjs:387–421` в цикле320/360/390 открывает collect/wall/widget; branding editor не открывает. Home/End/selection проверены только для name (:399–404), URL field не проверен. `reflow():367–385` измеряет document и переданный `.pw-widget`, но отдельную геометрию shadow host не возвращает. Успешный прогон не покрывает эти обещанные случаи. Product overflow не установлен, поэтому severity WARNING.

Приёмка RISK-02: в этом же browser suite добавить branding route на320/360/390 и обоих project themes с heading120, logo URL2048 и длинной ошибкой; проверить полный value и keyboard Home/End/selection URL, отсутствие document overflow>1px, доступность controls/focus после обычного scroll. Для widget явно измерить host отдельно от root. Проверка сохраняет existing nowrap/clipping negative control и падает при соответствующей поломке. Scope: E2E, requirements, architecture, active specification. Чужой ACCESSIBILITY-03 этим reviewer не закрывается: это собственный QE coverage finding.

## Матрица 12 SFDIPOT рисков

P×I — исходная экспертная приоритизация QCSD, не статистическая вероятность. Остаточная оценка ниже — качественная inference из source и самостоятельно выполненных тестов. Основное время проверки направлено на IAM/RLS, атомарность, escaping, provenance/badge и failures; не выдумывается точная доля усилий по шкале60/25/10/5.

| № / SFDIPOT / P×I | Барьер реализации и проверка | Вывод |
|---|---|---|
| 1 / S,I / 3×5=15 | `project-branding.ts:7,21–35`, `tenant.ts:29–35,64–70`: withAccount/SET LOCAL, lock, commit before return. `project-branding.test.ts:50–114`: foreign/inactive, revoked UPDATE, четыре реальные statements с current_user/GUC/pid/tx/bypass/table-owner. Собственный role mutant killed. | MITIGATED; не helper-only proof. |
| 2 / D,T / 3×4=12 | `project-branding.ts:19–35`: полная validation перед транзакцией; FOR UPDATE + JSONB merge; non-object409. Тест: разные concurrent keys, unknown/name сохранены, forbidden mixed patch no-write, same-key last commit, denied rollback. E2E legacy noValidate/dirty-only и две вкладки. | MITIGATED; exactly-once/version-conflict не обещаны. |
| 3 / F,D / 3×4=12 | `widget-config.ts:87–95` filters → DESC,id LIMIT50 → outer order; `wall.ts:37–43` filters/all rows/stable tie-break. Реальная PG:53 equal-time approved, тот же50-ID set/reverse; отдельные foreign/pending tests. | MITIGATED;50 — selection cap, не новый tariff limit. |
| 4 / F,I / 3×5=15 | `render.ts:46–47,70–105,140–144`, wall JSX и `widget-config.ts:102–122`: neutral origin, URL/screenshot независимы, transcript/demo сохранены, badge server-side. Wall+widget E2E false toggle, byte-identical DTO/text, screenshot, free badge restoration; free/paid/expired unit/PG tests. | MITIGATED; disabled video не объявлено реализованным. |
| 5 / P,I / 3×5=15 | `branding.ts:26,54–95,105–113`; JSX/textContent + `wall.ts:61–70` JSON-LD; widgets malformed DTO. E2E literal XSS text, 40 computed cases, white-heading и old-border negative controls. | MITIGATED для выполненного automated inventory; общего AA/AT pass нет. |
| 6 / F,I / 3×4=12 | `submit-form.tsx:61–92`: inFlight, raw draft retained,201-only. `testimonial.ts` validation/upload before accepted row, quota revoke on storage failure. Собственные testimonial/photo/SDK tests + локальный503/retry/GET bytes E2E. | MITIGATED; SDK mock transport для Cloud.ru не проверяет live provider. |
| 7 / P,O / 2×5=10 | Runner `:19–76,102–129`: private file/symlink/mode, local endpoints, synthetic S3 sentinels, env/argv whitelist. Schema test реальными child-spawn negatives; E2E local handles/cleanup/readiness. | MITIGATED в выделенной среде33186–33189; platform-wide isolation не заявлено. |
| 8 / T,F / 3×4=12 | Editor `:24–47,61–63`, view `:41–51`: captured dirty patch, all controls locked and status outside fieldset. E2E delayed Save пытается менять все7 control elements, второй PATCH запрещён; DOM503/network retry и browser two tabs. | MITIGATED; после failure draft сохранён. |
| 9 / D,I / 3×3=9 | Submit `:63–79`, CollectView no native raw maxlength; server trim-name/raw-role/raw-text unchanged. Browser+directHTTP padded82/trim80→201, exact browser DB raw; invalid no client fetch/HTTP400, tests quota rejection. | MITIGATED; исторический unbounded padded raw transport остаётся отдельным follow-up. |
| 10 / S,O / 3×4=12 | Renderer production imports + model identity, own offline test; повторный raster diff6+18 и immutable baseline. Live #8e806b explicit props, offline #ddd3c2 literal props без branches для fixture. | MITIGATED в рамках static layout proof; новые live states не accepted goldens. |
| 11 / P,I / 3×4=12 | `index.ts:38,62–78`, scoped styles и server badge. Настоящий built widget на widget.synthetic.test:33189, hostile global magenta CSS, host marker сохранён, badge restored. | MITIGATED для исполненной host fixture; отдельный произвольный сторонний host script не тестировался. |
| 12 / O,F / 2×4=8 | Route честно отдаёт503; editor/forms сохраняют draft и фокусируют ошибку, это исполнено. Redacted PATCH outcome logger/sink отсутствует. | **PARTIALLY_MITIGATED — RISK-01**. |

RISK-02 дополнительно ограничивает reflow часть рисков5/10/11: collect/wall/widget measured cases проходят, полного planned branding/URL/host oracle пока нет. Нет UNMITIGATED critical risk≥20; это не основание скрывать оба WARNING.

## Шесть исходных QCSD условий: фактическое исполнение

Это проверка acceptance meaning, а не чужие origin verifications/closure.

| Исходное условие | Самостоятельная проверка текущей реализации |
|---|---|
| TESTABILITY-01 | Submit `:63–79`, CollectView`:46–52`: trim name, raw role/text, noValidate, no raw maxlength. Browser/directHTTP corpus и DB assertions пройдены; отклонённый текст/фото не расходует квоту в testimonial tests. |
| UX-01 | Editor inFlight/disabled fieldset, live delayed Save, failed draft recovery, два contexts и разные/same dirty keys пройдены. Два commit последовательны в browser test; настоящий concurrent different-key merge отдельно выполнен PG test. |
| ACCESSIBILITY-01 | Owner-approved palette #8e806b в обоих containers; original #ddd3c2 только explicit offline data. onAccent отдельно от accentText, computed ancestor alpha compositing в actual browser/Shadow DOM и negative controls прошли. Полный inventory всех native indicators/focus состояний не доказан: colors oracle ограничен выбранными nodes/current focus; blanket AA не заявляется. |
| ACCESSIBILITY-02 | Оба color names различны; labels, errors/describedby, status вне fieldset, error/success focus и legacy HTTP пройдены в DOM/browser. Удалённое сообщение/связь ломает oracle. **Manual real screen-reader — pending owner acceptance опубликованной test copy**, не automated AT pass и не условие, приписанное чужому reviewer. |
| ACCESSIBILITY-03 | Длинный collect/wall/widget corpus на320/360/390 и двух темах прошёл; own nowrap/clip negative control обнаружен. **PARTIAL: RISK-02** — branding/URL input/отдельный widget host пропущены actual test. |
| SECURITY-01 | Новые source paths не логируют payload/keys; runner summaries ограничены. Existing photo GET/inherited synthetic raw output не входят в этот запрет. Требуемый новый outcome signal, отдельно от отсутствия sensitive data, отсутствует — RISK-01. |

## Acid A1–A17

| Acid | Доказательство и честная граница |
|---|---|
| A1 | Собственные PG own/foreign/inactive/permission tests, real login/page/expired session E2E; actual SELECT/UPDATE role/GUC; withService mutant killed. Session deletion отдельно не воспроизводилась. |
| A2 | Whitelist validation/forbidden keys, mixed patch rejects before write; preserved unknown/name проверены PG. Неперечисленные в corpus forbidden keys покрываются тем же Object.entries whitelist, отдельного runtime case каждого имени не заявлено. |
| A3 | theme/system, order/rating, malformed HEX, unsafe logo/heading>120, SQL unsafe Unicode; единый validator, static SQL direction whitelist. |
| A4 | Missing/foreign Origin, cross-site, content type, malformed JSON и oversized request с ложным Content-Length1 →413. `readBodyAtMost` считает реальные bytes/read stream и cancel; exact4096 boundary/multichunk не гонялись отдельно этим reviewer. |
| A5 | PG53 equal-time approved → exact newest50/reverse; foreign/pending фильтры отдельно, wall deterministic all rows. |
| A6 | false labels, neutral origin/source URL/screenshot, immutable text/DTO, demo/transcript; free badge на втором origin; expired server badge в PG suite. |
| A7 | padded82/trim80, trim1/81, raw role121, text9/2001, spaces; PNG/JPEG/WebP, spoof/SVG, empty/5MiB boundaries и no quota/upload tests. Browser + HTTP отказ и draft retained. |
| A8 | Real SDK storage503→no success/quota0→retry201, network/400/429/503 UI retained. Controller inFlight и branding double-submit proved; exactly-once после потерянного ответа не обещано. |
| A9 | Raw strings persisted, JSX escaped markup и widget textContent, JSON-LD `<>&`/Unicode escaping, malformed DTO CSS fallback; живой текстовый payload не исполняется. |
| A10 | Собственный offline production import test; существующие PNG независимо перепроверены:6zero/18different. Fresh font/margin/color browser mutations этим reviewer не перезапускались. |
| A11 | Legacy3-field reader, unchanged HTTP theme browser Save, edited HTTP rejection; non-object409 no normalization; revoked UPDATE→503/rollback. Separate schema suite выполнен на уже подготовленной выделенной БД, миграции заново reviewer не применял. |
| A12 | Runner refused-before-spawn external DB/S3, old ports, synthetic credential mismatch, inherited env, symlink/perms/snapshot-update. Actual QA resources только33186–33189. |
| A13 | 5 edge HEX ×2 themes ×4 surfaces computed colors; independent white heading negative control killed. |
| A14 | Actual focus/error/labels/status and ariaSnapshot; deleting relation/message causes rejection. DOM/controller tests pending/success; manual screen-reader pending owner phase. |
| A15 | Long content at320/360/390, full raw text/value and clipping mutant. **Partial RISK-02** for omitted branding URL and separate widget host measurements. |
| A16 | Все7 setting control elements (6 settings, color represented twice) + Save disabled during delayed PATCH; one captured payload. Two contexts: independent keys survive, same key last committed wins after reload. |
| A17 | Live computed field border equals rgb(142,128,107), bounds meet required contrast; forced #ddd3c2 rejected on both forms; old offline palette unchanged. |

## Покрытие всех 18 production TS/TSX targets

**INSPECTED + RECOMPUTED**, не собственный новый instrumented full-suite run: прочитаны `.secrets/branding-production-coverage.json` и raw V8 summaries web/widget/DOM. Для всех18 записей самостоятельно проверены source SHA-256 и точное совпадение line/branch counters с raw reports (**18/18**). Полные файлы, включая исторические строки: **940/944 lines=99.5763%; 461/501 branches=92.0160%**. Type-only `types.ts` имеет0 executable lines; CSS/tooling в этот denominator не входят. Число99.5763% не относится ко всему приложению: общий raw web report —4796/7197 lines=66.63%. Базовое instrumented покрытие commit4da1c64 не измерено, differential maintain-coverage не доказано; declined trend из пустой истории не выводится.

Непокрытые ветви концентрируются в dashboard page35% (текущая дельта только navigation link), editor82.75%, widget bootstrap85.71%, widget-config80%. Это не основание выдавать scope line total за coverage каждого business condition. Critical SQL/merge/permission/CSRF/reader invariants проверены assertion tests и actual role mutation; отсутствие logger показывает, почему высокий line coverage не гарантирует исполнение архитектуры. Числовые thresholds примеров upstream навыка не превращены в новую пользовательскую квоту.

| Production path | Lines covered/total | Branches covered/total |
|---|---:|---:|
| `apps/web/src/lib/branding.ts` | 81/81 | 97/98 |
| `apps/web/src/lib/project-branding.ts` | 31/31 | 17/18 |
| `apps/web/src/app/api/projects/[slug]/branding/route.ts` | 30/30 | 28/29 |
| `apps/web/src/app/dashboard/[slug]/branding/page.tsx` | 10/10 | 5/5 |
| `apps/web/src/app/dashboard/[slug]/branding/branding-editor.tsx` | 60/60 | 24/29 |
| `apps/web/src/app/dashboard/[slug]/branding/branding-view.tsx` | 27/27 | 33/34 |
| `apps/web/src/app/f/[slug]/page.tsx` | 13/13 | 3/3 |
| `apps/web/src/app/f/[slug]/submit-form.tsx` | 104/104 | 62/68 |
| `apps/web/src/app/f/[slug]/intake-tabs.tsx` | 27/27 | 13/13 |
| `apps/web/src/app/f/[slug]/collect-view.tsx` | 27/27 | 37/37 |
| `apps/web/src/lib/wall.ts` | 46/46 | 11/11 |
| `apps/web/src/app/w/[slug]/page.tsx` | 145/147 | 49/54 |
| `apps/web/src/lib/widget-config.ts` | 50/50 | 12/15 |
| `apps/widget/src/types.ts` | 0/0 | 1/1 |
| `apps/widget/src/index.ts` | 48/49 | 12/14 |
| `apps/widget/src/render.ts` | 121/121 | 49/51 |
| `apps/widget/src/styles.ts` | 6/6 | 1/1 |
| `apps/web/src/app/dashboard/[slug]/page.tsx` | 114/115 | 7/20 |

## Границы заключения

Source-only baseline diff подтверждает неизменность tenant helper, testimonial/HTTP/photo/storage implementations. Историческая возможность очень длинного raw padded name и отсутствие общего multipart transport bound не превращены в новый exploit; key-based photo GET privacy и старый logger не изменены. Local SDK QA не доказывает состояние Cloud.ru. Рейтинг не реализован; video flag false не доказывает video product readiness. Approval/moderation в E2E переводит synthetic row SQL-операцией: полный owner moderation UI этим прогоном не принимается.

Manual screen-reader и ручная приёмка новых live states остаются отдельной фазой владельца. Исходная палитра frozen/idle и owner-approved live palette честно разделены. Public33183/33184/80/8443, production, DNS и реальные env этим reviewer не трогались. Авторские verdicts не использованы для собственного clean; собственный verdict conditional сохраняет RISK-01/RISK-02. Native evaluate/общий receipt выполняет координатор; `authorAssessmentChecked=false`, `deltaVerification=null` для initial review.

Финальная повторная проверка SHA-256 после собственных прогонов: **45/45 совпали**, source snapshot не изменён.
