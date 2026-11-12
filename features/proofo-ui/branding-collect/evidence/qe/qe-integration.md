# Независимое QE integration — branding/collect

Текущий вердикт, cycle 2: **clean** для собственных INTEGRATION-01/02/03 на revision `5a55e200c7807177bb7d1e8e39b5eb2b7db0d4d68b3d69d07d182b3403122657`. Все три исходных condition сохранены без изменения; каждая получила собственную structural verification фактической реализации. Это receipt данной роли, не результат общего native evaluate и не разрешение публичной поставки.

## Cycle 2 — focused implementation verification, 2026-11-12

Native `evidence/qe/native-cycle2-prepared.json.result` существовал до повторного dispatch: nonce `893f82d3-e2ae-48df-b357-f3031a194fdf`, 46 manifest paths, девять сохранённых условий всех ролей. Самостоятельные SHA-256 сверки до проверок и после всех четырёх собственных прогонов: **46/46**, mismatch 0. Три own condition объекта равны corresponding native condition объектам, включая requirement/scope/evidence. Ни source, ни native/host/state, ни чужие receipts не изменены reviewer.

Независимость и модель остаются прежними: author `gpt-6.1-sol/high`, reviewer actual dispatch `gpt-6-astra/xhigh` по данным координатора, не provider attestation. Применены ранее полностью прочитанные Direct integration, enterprise-integration-testing и qe-coverage-analysis. `author-repair-delta.json` и оба private author handoff изучены как проверяемые утверждения; оценки автора не заменяют собственные исполнения ниже. Теперь `authorAssessmentChecked=true`, `deltaVerification.classification=structural`, `implementationVerified=true`.

Сравнение двух подготовленных manifests выявило ровно 12 изменённых/добавленных путей: web branding route и validator; web mutation/schema/branding/project-branding tests; widget index/styles/branding test; QA runner; E2E; новый `docs/embed-contract.md`. Все 12 входят в author changedScope. Дополнительные affected dependencies проверены по source и текущим web/widget/browser тестам: dirty editor, transaction repository, canonical DTO, public readers, tenant selection, provenance/badge и intake/storage. Form CSS, collect/editor views, generic fixture и frozen reference не изменились относительно initial manifest. Одобренный live border `#8e806b` остаётся отдельным от original generic fixture. Полную pixel identity live UI не заявляю.

### Собственные исполнения на текущем snapshot

Все команды выполнены из root, последовательно через общий `flock .secrets/branding-qe-runtime.lock`; stdout/stderr записаны только в own private logs. E2E metrics и old-reader provenance скопированы под тем же lock до его освобождения. Private QA runtime — PG33186/app33187/S333188/host33189, browser mapping `widget.synthetic.test` на loopback. Real env, внешние providers и публичные endpoints не использовались; source mutation runner не запускался.

```sh
flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/run-branding-collect-preview.mjs e2e
flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/run-branding-collect-preview.mjs test tests/branding.test.ts tests/project-branding.test.ts tests/branding-collect-schema.test.ts tests/widget-config.test.ts tests/wall.test.ts --maxWorkers=1 --minWorkers=1
flock .secrets/branding-qe-runtime.lock env -i PATH=/usr/bin:/bin LANG=C.UTF-8 TZ=UTC NODE_ENV=test node_modules/node/bin/node node_modules/vitest/vitest.mjs run --root apps/widget --config /tmp/proofwall-branding-collect/apps/widget/vitest.config.ts --maxWorkers=1 --minWorkers=1
flock .secrets/branding-qe-runtime.lock env -i PATH=/usr/bin:/bin LANG=C.UTF-8 TZ=UTC node_modules/node/bin/node .secrets/upstream-check-embed-contract.cjs /tmp/proofwall-branding-collect
```

| Own cycle-2 execution | Фактический результат | Private evidence SHA-256 |
|---|---|---|
| Browser/ordinary HTTP/local SDK | exit 0, **14/14**, 0 fail/skip, 57.59s | `bc-qe-integration-cycle2-e2e.log`: `c042a533ce11fbada18f1e3392f04fb15180b3494324b546d311ab125ea88889` |
| Web controller/route/real PG/readers | exit 0, **5 files, 72/72**, 6.09s | `bc-qe-integration-cycle2-targeted.log`: `deea12d7b2b6f9f4c582faa1d27f1a8730c8f96397fba42cd8c3c1b33b848c7d` |
| Entire widget unit suite | exit 0, **6 files, 43/43**, 7.42s | `bc-qe-integration-cycle2-widget.log`: `c8ca879e62556888e3da6b0babdcedcfdaf3b0634dc8bd640473f46aa0b866fa` |
| Pinned upstream declaration checker | exit 0, все 3 класса на чужом origin | `bc-qe-integration-cycle2-embed-check.log`: `c0559f8e83f28def5cf2510cbd98bffe1c5238f55bae565a717ab9b4011a4f67` |

Все имена в таблице находятся в `.secrets/`. Own copied E2E measurements: `.secrets/bc-qe-integration-cycle2-e2e-measurements.json`, SHA-256 `a16a714eea60319dc163f9a374899cbc2766c1b446c448cc42ad0bda090a786f`, 67 records. Product SDK local PUT=1, GET=42, injected failures=3; 12 synthetic remote-logo requests реально заблокированы browser route. Это не внешние вызовы и не утверждение об отсутствии попыток. Ordinary moderation records — два (text/photo), каждый approved=1, foreign/anonymous/expired refusal=1; strict inline mutant killed, positive host CSP violations=0. Browser заново подтвердил фактические wall/widget effects, proof/badge, draft/quota recovery и six widget three-level reflow + six editor reflow combinations.

### Verification собственных условий

**INTEGRATION-01 — implementation verified.** `apps/web/src/lib/branding.ts:86-98` теперь требует HTTPS и пустые parsed username/password. `branding.test.ts:34-42` отвергает raw user/password, username-only, password-only и percent-encoded userinfo, принимает чистый HTTPS. Реальный React controller `:127-136` не вызывает fetch для credential-bearing draft, сохраняет значение и доступную ошибку; восстановление unchanged legacy HTTP затем отправляет только dirty heading. `project-branding.test.ts:170-178` исполняет actual repository и route на real PG: все четыре mixed patch дают 400, stored JSONB остаётся равным before. Эти тесты выполнены мной в 72/72; browser suite отдельно сохраняет обычный HTTPS и legacy dirty-only/reload flow. Условие закрывается реализацией общего validator, а не одним наличием тестового имени. Author logo mutation log просмотрен как дополнительное evidence; собственное source mutation execution не заявлено.

**INTEGRATION-02 — implementation verified.** `tools/visual/branding-collect.e2e.test.mjs:113-139` теперь проводит оба newly-created collect testimonials через обычный HTTP POST с действующей owner session. До POST DB status=pending и public widget исключает id; foreign=403, anonymous=401, expired ordinary session=401; после отказов status всё ещё pending. Owner POST=200 возвращает exact pending→approved, DB становится approved, свой config содержит id, чужой config/wall его не публикует. Затем text/photo scenarios проверяют реальный wall и external-host widget, включая photo. Мой E2E 14/14 исполнил оба сценария, что отдельно отражено в двух moderation records. SQL используется для независимого setup/session expiration и read assertions, не для проверяемого перевода testimonial в approved.

**INTEGRATION-03 — implementation verified.** `apps/widget/src/styles.ts:108-123` создаёт stylesheet из `root.ownerDocument.defaultView.CSSStyleSheet`, вызывает replaceSync и добавляет его в существующий adoptedStyleSheets. При поддерживаемой API ошибка adoption не замалчивается inline fallback. Текущие widget tests исполнили сохранение existing sheets, правильный iframe ownerDocument realm, capability fallback и propagation ошибки. Реальный rebuilt bundle `widget.0837c760.js`, SHA-256 `0837c76006f9782264ca52f036c643ca1d9d04eada3ebfe92a1f5361967d132e`, загружен моим E2E в Chromium `148.0.7778.97` на `http://widget.synthetic.test:33189`; app/config origin `http://127.0.0.1:33187`. Host script и hostile CSS загружаются внешними файлами. Ответ host действительно содержит `default-src 'none'; script-src 'self' http://127.0.0.1:33187; connect-src http://127.0.0.1:33187; img-src http://127.0.0.1:33187 data:; style-src 'self'; base-uri 'none'; object-src 'none'`.

В `E2E:85-110` проверяются actual header, running host script, magenta host marker, отсутствие inline shadow style, adopted sheets, ноль CSP violations, computed flex/14px/non-monospace, card padding16 и surface каждой темы. Настоящий cross-origin config GET имеет Origin внешнего host, ACAO `*`, без Cookie/Authorization. `E2E:530-537` заменяет adopted CSS на inline только в памяти браузера: CSP violation возникает, тот же acceptance oracle отклоняет результат, actual padding больше не 16px; повторный обычный host снова проходит. Это выполнено мной, не декларативный JSON и не изменение исходника.

`docs/embed-contract.md` фиксирует точные QA origins, CSP/CORS/credentials contract, bundle/browser, capability limits и адреса трёх классов проверок. Pinned checker выполнен мной exit 0. Его private CJS полностью прочитан: проверяет декларацию таблицы/документа, не visual correctness. Самостоятельный `git hash-object` равен declared upstream blob `7161b4134915e227f9221586e9ef6bd9b6214a44`, SHA-256 `9e963a07c12350b760264133021e75fb699439b1f060332e1ccdd962b645b4a0`; provenance указывает original Git ref `3b84e9ef5ce68fdbdcf34e0d1671bace8006aff4`, `.claude/hooks/check-embed-contract.cjs`, private `.secrets/upstream-check-embed-contract-source.json`. Remote commit binding мной не переполучался: внешняя сеть исключена. Byte identity checker и actual independent browser proof различаются и оба зафиксированы.

### Другой delta, affected dependencies и новые риски

`apps/widget/src/index.ts:34-43` задаёт mount display block/minWidth0/maxWidth100% после all:initial. Мой browser test измерил document, host и ShadowRoot при 320/360/390px в двух темах: host имеет ненулевую ограниченную ширину; long labels/editor fields остаются доступны, включая Home/End/selection. Контракт currentDomain остаётся `window.location.hostname` (`:71`), без port; badge/isolation/XSS/photo suites пройдены. При static/source review нового серьёзного регресса в этом изменении не обнаружено.

Новый branding PATCH логирует whitelist outcome/status/code/correlation, success только после завершения repository commit, возвращает x-request-id. Мои actual route/PG tests проверили событие после COMMIT, отказ400/403/503, отсутствие payload sentinel, permission failure rollback и commit failure без committed-success signal. Это устраняет замеченную в initial review пустую observability проверку; чужое условие этой ролью не закрывается. QA runner больше не переопределяет HOME; allowlist/loopback restrictions сохранены, runner guard tests пройдены.

Новый schema test действительно исполнил old `git show 4da1c64b6dcc537a412646183344dcb53645ea02:apps/web/src/lib/branding.ts` после committed new repository writer, с независимым DB read, тремя legacy fields и сохранёнными new/unknown settings. Baseline source SHA-256 независимо пересчитан: `4447bd65d7be631a9f98701145fad09c946dfc2b3eb93296daf9e878445730d8`. Own copied receipt `.secrets/bc-qe-integration-cycle2-old-reader-provenance.json`, SHA-256 `7d58b36f710447913c2557693a309739cb1a2ab5f8c839de2df430ff59837377`, executed=true/currentWriterStatus200/oldReaderFields3/persistedNewSettings=true. Старый reader не подменён handwritten reconstruction.

Новых серьёзных integration risks в изученном delta и affected dependencies не установлено. Уверенность высокая в трёх собственных implementation verifications и выполненных assertions, ограниченная выбранным runtime/browser/проверенными путями. Constructed CSS strict-CSP contract относится к поддерживающим API современным браузерам; legacy fallback не обещает strict CSP. Широкая CSP/browser matrix, sendBeacon credential semantics и произвольная corruption всей DTO не доказаны. Собственный V8 coverage и source mutation matrix в cycle 2 не запускались; author counts/grades не переименованы в independent coverage. Provider transport receipt остаётся отдельным авторским operational proof, не UI/provider rerun. Form frozen pixel evidence не переисполнялось в этой focused фазе. Публичная immutable test copy ещё не поставлена этим reviewer; owner acceptance и настоящий manual screen-reader AT — последующая фаза и не обозначаются пройденными.

Ниже сохранён **исторический initial review** на прежней revision. Его no-go, номера строк и описания дефектов относятся к исходному snapshot; актуальные решения по ним приведены выше и в текущих verifications receipt.

## Initial review — историческое состояние до repair

Вердикт: **no-go** на подготовленной revision. Три HIGH structural условия ниже остаются открытыми. Собственные тесты зелёные, но не компенсируют нарушение URL-контракта и обход ordinary moderation API в обязательном сквозном сценарии, а также strict-CSP отказ оформления widget.

## Привязка и независимость

- Reviewer: `qe-integration`, family `codex`, независимая сессия `/root/bc_qe_integration` без истории реализации. Автор по handoff: `gpt-6.1-sol/high`; reviewer dispatch: `gpt-6-astra/xhigh` по метаданным координатора, не provider attestation.
- Root: `/tmp/proofwall-branding-collect`; feature: `features/proofo-ui/branding-collect`; baseline: `4da1c64b6dcc537a412646183344dcb53645ea02`.
- Native prepare существовал до dispatch: `evidence/qe/native-initial-prepared.json`, revision `b3b7f4779c855441ae482ff5f7d813527058aa6bb9e80536eeb2a4cfa20fb71c`, nonce `bbba4b1f-3593-41a6-a8be-e3c711994fe2`.
- Самостоятельно вычислены SHA-256 всех 45 manifest paths: **45/45 совпадают**, повторная сверка после обоих прогонов также 45/45. Source, baseline и native authority не изменялись этим reviewer.
- Прочитаны AGENTS, review-policy/model-matrix, CLAUDE/workflow/core-CJM и применимые security/testing/widget rules; Direct `PROOFWALL-INTEGRATION.md`, полные upstream `enterprise-integration-testing` и `qe-coverage-analysis`, modules 03.5/08/09, OpenSpec, четыре ADR и архитектура/план. Scope — REST/SQL/browser/S3 integration, не SAP/SOAP/message-broker.
- Выполнен `npm run dz -- recall 'branding collect integration tenant widget SDK error recovery' --project /home/proofwall --limit 3`: два lexical hits, включая фактические role/GUC на statement. Использовано только как чек-лист; доказательство ниже получено самостоятельно. AQE MCP tools в этой reviewer-сессии не обнаружены; shared fleet/native orchestration остаётся у координатора. Skill run-history пуст; при ограничении записи только own evidence не изменялся.
- Авторские grades и verification-summary не использованы как доказательство. `authorAssessmentChecked=false`, `deltaVerification=null`: это initial review, author handoff delta отсутствует.

## Собственные исполнения

Все runtime команды запущены из root через общий `.secrets/branding-qe-runtime.lock`, private QA runner и локальный Node. Работа ограничена PG33186/app33187/S333188/host33189; `widget.synthetic.test` отображён браузером на loopback. Stable/public endpoints, production, real env/credentials не читались и не вызывались. Mutation runner in-place не запускался. Дополнительно координатор разрешил private read-only browser probe под тем же lock; он использует env-i и синтетический HTTP config, не private QA env.

```sh
flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/run-branding-collect-preview.mjs e2e
flock .secrets/branding-qe-runtime.lock node_modules/node/bin/node scripts/run-branding-collect-preview.mjs test tests/project-branding.test.ts tests/branding.test.ts tests/branding-collect-schema.test.ts tests/widget-config.test.ts tests/wall.test.ts tests/photo.test.ts tests/testimonial.test.ts tests/moderation.test.ts tests/widget-install.test.ts --maxWorkers=1 --minWorkers=1
```

| Собственный прогон | Результат | Private log SHA-256 |
|---|---|---|
| Production routes/browser, 13 тестов | exit 0; 13 pass, 0 fail/skip; 48.56s | `.secrets/bc-qe-integration-e2e.log`: `5e5ef5835cac74e4041d3efe5e3dcc74d359db1774b600d7ca54299dac35d140` |
| 9 выбранных web suites | exit 0; 154 pass, 0 fail; 9.27s | `.secrets/bc-qe-integration-targeted.log`: `b4efce94024b08d637b3334751b3a237e1b85780fcee85ae284be6f754e20dfe` |

Собственный E2E summary скопирован под lock в `.secrets/bc-qe-integration-e2e-measurements.json`, SHA-256 `cce87bc61c90fa907e35dc916d60fda27163ceeba2c4f70e50c83156f50b2258`: 52 records, SDK PUT=1, GET=39, injected storage failures=3, blocked remote browser requests=12. Последнее — реально заблокированные попытки загрузить synthetic logo host, не утверждение «браузер никогда не пытался external request». Local S3 service не делает redirect/proxy. Raw legacy unit errors помечены runner как synthetic и остаются private.

## Проверенные цепочки и границы

| Область | Самостоятельная проверка и итог |
|---|---|
| Owner writer → canonical reader | `project-branding.ts:7-35`, `tenant.ts:25-45,57-71`: account SELECT/locked SELECT/JSONB merge внутри withAccount; COMMIT до возврата 200. Объект patch валидируется целиком до write transaction. Real PG tests подтвердили preservation name/unknown keys, different-key concurrent merge, last commit для same key, foreign/inactive 404, malformed stored JSON 409 без нормализующей записи, revoked permission→503/rollback. |
| Auth/request boundary | `branding/route.ts:13-37`: current session, exact canonical Origin, cross-site refusal, JSON, actual-byte 4096 limit, 401/403/413/415/400/404/409/503 и private/no-store. `branding owner statements retain role and tenant context` наблюдает current_user/GUC/tx/pid до и после фактических SELECT/UPDATE, включая page repository. Browser проверил ordinary login, foreign/inactive navigation и expired session GET/PATCH/page. |
| Editor state → reload | `branding-editor.tsx:22-47`: dirty-only patch, captured state, disabled fieldset/inFlight, canonical response после 200, retained draft при ошибке. Browser проверил все controls и оба color input под задержкой, отсутствие второго PATCH, две вкладки, reload; legacy HTTP logo не передаётся при theme-only Save, edited HTTP отвергается без fetch. Credential-bearing HTTPS остаётся дефектом INTEGRATION-01. |
| Additive types / legacy | `branding.ts:5-17,39-51`, widget server/client DTO: прежний трёхпольный Branding сохраняется; ResolvedBranding defaults light/newest/labels-on; widget branding optional; malformed network branding нормализуется в renderer. Schema test проверяет существующие таблицы/grants, JSONB extension и transaction rollback на выделенной БД. Он не создаёт БД/не применяет миграции сам; provenance provisioning этим reviewer не переисполнялся. |
| Public effects | Сам source wiring и browser `branding collect real flows`/contrast/proof тесты: heading реально меняет collect h1; theme реально меняет wall/widget surface; accentText/onAccent реально измеряются на reader surfaces, не только в JSON. Logo использует canonical URL в form/wall; widget logo/heading не обещаны. Live form border действительно #8e806b по owner decision; отрицательная DOM замена на original #ddd3c2 ломает oracle. |
| Selected set / isolation | `widget-config.ts:87-96`: project/approved filters → newest created_at,id DESC LIMIT50 → внешний requested order. Real PG test на 53 строках с одинаковым timestamp проверил тот же набор 50 id и reverse order; wall test — все 53 со stable tie-break. Отдельные existing tests проверили foreign/pending exclusion; badge free/expired-paid/paid решается сервером, tier в DTO не уходит. |
| Provenance / XSS | `wall page:144-178`, `widget render.ts:70-99`: false меняет подпись, сохраняя source URL и screenshot; metadata/текст не переписываются. Browser обеих тем действительно показывает screenshot, нейтральный provenance, wall demo disclaimer, machine label, raw payload как текст; wall JS payload не исполняется. Widget textContent и safeJsonLd исследованы, unit/SSR tests проверены. |
| Cross-origin widget | Реальный собранный widget.js загружен на `http://widget.synthetic.test:33189`, отличающийся hostname и origin от app. Shadow DOM, агрессивные глобальные font/color !important, unchanged host marker, computed contrast и badge anti-hide подтверждены браузером. `index.ts:67` передаёт hostname без port; DB widget_installs содержит `widget.synthetic.test`, не app hostname. Это actual reader proof при CSP с разрешённым inline CSS; strict-CSP отказ отдельно воспроизведён в INTEGRATION-03. |
| Text/photo intake | `submit-form.ts:59-92`, existing API/testimonial/storage: JSON без фото, multipart с фото; raw values, padded raw82/trim80 name, role120/121 и text9/10/2000/2001 проверены UI + real HTTP/PG. Existing photo tests проверили MIME/signature/size. Browser local S3 использовал product AWS SDK PUT/GET, exact PNG bytes, nosniff; pending после 201; failure503 сохранил draft/файл и вернул quota0, retry дал 201 и focus success. |
| Error recovery | DB permission failure действительно сохраняет старый JSONB; client 400/429/503/network состояния сохраняют draft и разблокируют controls; photo real storage fault возвращает квоту и допускает повтор. SQL transaction rollback и UI recovery проверены; exactly-once при потерянном response не обещается. Сквозная ordinary moderation API часть не проверена: INTEGRATION-02. |

## Находки

### INTEGRATION-01 — HIGH, structural: credential-bearing HTTPS logo принимается

Требование: OpenSpec FR-202, `spec.md:43`, «absolute HTTPS без credentials». В `apps/web/src/lib/branding.ts:86-91` единственная URL-проверка — `new URL(value).protocol === 'https:'`. Синтетическое `https://synthetic:synthetic@example.test/logo.png` удовлетворяет ей: username/password не проверяются. На успешном пути patch записывается в JSONB (`project-branding.ts:29-35`), `safeLogoUrl` возвращает `URL.toString()` с userinfo (`branding.ts:29-34`), затем URL становится публичным image src (`collect-view.tsx:41`; wall logo).

Это конкретный разрыв заявленного producer/consumer контракта и возможность сохранить случайно введённые credentials в публичной разметке. Из существующей validation matrix `branding.test.ts:40-56` такой вход отсутствует. Дополнительный собственный pure-function probe импортировал фактический `branding.ts` локальным Node22 `--experimental-strip-types`: username/password и percent-encoded userinfo оба дали `accepted=true`, canonical reader сохранил userinfo; контрольный credential-free HTTPS принят, edited HTTP отклонён. Evidence `.secrets/bc-qe-integration-logo-probe.json`, SHA-256 `b4bab4d72aa19d97c0ca888da3106f52699eb8b5585d34d2547f7a95685613e9`. HTTP credential-bearing negative отдельно не выполнялся; зелёные 154 теста не объявляются его доказательством.

Исправление/приёмка: явный отказ parsed username/password (включая percent-encoded userinfo), общий validator для UI/API; отрицательные validator и route tests требуют 400 и unchanged stored state; обычный HTTPS и unchanged legacy HTTP сохраняются. Scope/условие записаны в own entry без изменения source.

### INTEGRATION-02 — HIGH, structural: обязательная модерация подменена SQL setup

OpenSpec FR-206 `spec.md:127-130` требует pending text/photo → ordinary owner moderation API → публикация только своего проекта. В `tools/visual/branding-collect.e2e.test.mjs:157,253` обе публикации выполняются privileged `pool.query(UPDATE ... status='approved')`. Следующие реальные wall/widget assertions доказывают readers после SQL-перевода, но обходят HTTP currentAccountId, resolveOwnership, allowed transition, transactional audit/content-threshold.

Existing `apps/web/tests/moderation.test.ts` проверяет helpers, преимущественно `applyTransition`, с withAccount; ordinary route в него не импортирован. Статически `apps/web/src/app/api/testimonials/[id]/moderate/route.ts:21-83` выглядит согласованным, но это не runtime verification требуемого шва. Полный браузерный тест остаётся зелёным даже если ordinary moderate route перестанет работать.

Исправление/приёмка: в текущем E2E одобрять созданный form/photo testimonial обычным `POST /api/testimonials/<id>/moderate` через owner session, проверить response/state/audit и затем фактические wall/widget; добавить refusal для foreign/anonymous actor без публикации. SQL остаётся допустимым для setup независимых примеров, не для проверяемого перехода.

### INTEGRATION-03 — HIGH, structural: restrictive CSP блокирует оформление widget

Применимое `.claude/rules/embeddable-widget.md` требует отсутствие зависимости от `unsafe-inline`, точный embedding contract и проверку restrictive CSP. `apps/widget/src/styles.ts:108-111` создаёт inline `<style>`. Текущий E2E `:104` разрешает `style-src 'unsafe-inline'`, поэтому не различает рабочую и блокируемую strict-CSP интеграцию.

Собственный private probe использовал фактический built `widget.c7ab0e9a.js`, SHA-256 `c7ab0e9a4e237181f30b670fae1b7b7b647737fd5aa7709a9cf9c1bc25fe7180`, Chrome `148.0.7778.97`, host `http://widget.synthetic.test:33189`, script/config origin `http://127.0.0.1:33189`. CSP: `default-src 'none'; script-src http://127.0.0.1:33189; connect-src http://127.0.0.1:33189; style-src http://127.0.0.1:33189; img-src http://127.0.0.1:33189`. Host CSS загружен отдельным разрешённым stylesheet, не inline. Тестовый config synthetic; источники приложения и серверные данные не менялись, external requests=0.

Браузер сообщил, что inline stylesheet заблокирован CSP. Отзывы и `data-theme=dark` есть, но actual `.pw-widget` получил `display:block`, `font:13px monospace`, magenta, transparent background и card padding0. Значит ошибка влияет на фактический reader, а не только на формальное отсутствие документа. Механизм существовал на baseline, но новый branding сейчас меняет этот widget и обязан соблюдать действующее правило интеграции.

В том же browser context только в памяти установлены `new CSSStyleSheet().replaceSync(actual CSS)` и `root.adoptedStyleSheets`: получены flex/14px, white text/dark rgb(24,24,24), card padding16. Закреплённый Chrome поддерживает этот вариант; это feasibility probe, не source fix/closure. Evidence `.secrets/bc-qe-integration-csp-probe.json`, SHA-256 `1565361d91c42e92c1732a79c8c1d8c95d31850381e5808427bb28ae51e0bfe0`.

Команды обоих private probes (root cwd, общий lock):

```sh
flock .secrets/branding-qe-runtime.lock env -i PATH=/usr/bin:/bin HOME=/tmp LANG=C.UTF-8 TZ=UTC node_modules/node/bin/node .secrets/bc-qe-integration-csp-probe.mjs
flock .secrets/branding-qe-runtime.lock env -i PATH=/usr/bin:/bin HOME=/tmp LANG=C.UTF-8 TZ=UTC node_modules/node/bin/node --experimental-strip-types .secrets/bc-qe-integration-logo-probe.mjs
```

Оба завершились exit0 как successful reproductions, не acceptance pass. Для CSP probe первоначальный import `playwright/test` не разрешился из private directory до запуска HTTP/browser; исправлен только private import на существующий pinned tools/visual package, затем выполнен указанный реальный probe.

Приёмка: CSP-safe scoped stylesheet, rebuilt actual widget под строгим host policy + hostile CSS, сохранённые theme/contrast/host isolation, отказная проверка возврата inline injector и точный документированный CSP/cross-origin contract. `docs/embed-contract.md` отсутствует; новый документ может потребовать нового host manifest, reviewer исходные paths не добавляет.

## Coverage и ограничения уверенности

- Уверенность высокая в трёх находках и перечисленных executed assertions; умеренная в полноте интеграционной приёмки. 154+13 — число проверок, не процент требований/ветвей. Собственный инструментированный V8/differential coverage не собирался. Авторский UI-only report не доказывает 90% всех integration critical paths; global coverage или полный error-recovery coverage здесь не присваиваются.
- CSP compatibility без unsafe-inline теперь проверена отдельным private probe и отказала: INTEGRATION-03. Более широкую матрицу CSP/browser policies и публично развёрнутый origin этот loopback probe не доказывает.
- Новые metadata branding защищены runtime defaults. Защиту от произвольной поломки всей testimonial DTO, неизвестных browser engines и всех host CSS/CSP сочетаний этот scope не доказывает.
- Existing photo access key-based, pending photo доступно по valid key; approved-only относится к спискам. Эта feature не вводит новую privacy/revocation guarantee. Upload success с последующим DB fault не проверялся как отдельная distributed object-cleanup компенсация; расширенной гарантии cleanup/exactly-once не заявлено.
- `cloudru-transport.json` прочитан как отдельный operational SDK Put/Get/Delete receipt; он не rerun этого reviewer, не UI proof и не выполнение трёх historical skipped provider tests. Внешних вызовов reviewer не делал.
- Offline renderer действительно импортирует те же pure views с generic literal palette, а live containers передают #8e806b. Шесть frozen zero-diff кадров/18 отказных visual mutations — просмотренные сторонние evidence, не мой повторный visual run и не полная pixel identity live UI. Baseline не менялся.
- Реальный screen reader/manual AT и owner acceptance опубликованной test copy остаются последующим отдельным действием владельца; browser accessibility tree/focus tests не называются AT pass. Production и публичная test delivery не разрешались этим review.
- Observability architecture обещает redacted status/correlation logs; actual PATCH route не имеет таких logger calls. Это независимо замеченный статический разрыв, переданный координатору для уже назначенной другой роли, без присвоения её условия/closure. Own no-sentinel test доказывает лишь отсутствие sentinel в logger calls, не наличие telemetry.

Начальное собственное receipt содержит `no-go`, INTEGRATION-01/02/03, пустые verifications; чужие условия, host/native state и author delta не изменялись.
