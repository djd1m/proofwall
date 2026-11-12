# Branding + collect — SPARC-GOAP implementation plan

Settled L inputs на HEAD 4da1c64; **не допущен к коду**. Inputs read: 00_reuse_audit, 01_requirements,
02_research, 03_adr, 03.5_ideation_report, 04_domain_model, 05_architecture,
Direct code-goal-planner и shift-left-testing. Шесть actual QCSD reports и focused evaluation предыдущего snapshot оставили
ACCESSIBILITY-01 unresolved. Owner-approved border delta требует нового prepare и
focused origin reviews; текущая author delta не даёт admission.

## Goal state

Current: branding reader без writer; text/photo submit существует; новых presentation
readers нет. Goal: шесть настроек действуют после reload, collect сохраняет pipeline,
tenant/badge/provenance и frozen layout доказаны. Coverage/pass сейчас не измерены.
Completion — reviewable test artifact; production deployment не задача плана.

## Tasks

- TASK-1 — Specification/architecture/refinement: NFR-202, NFR-203, ADR-004. На готовом dashboard baseline сверить OpenSpec/SHA/strict validate; Direct QCSD/checkpoints, K1/K2 ДО source writes. После admission создать `scripts/run-branding-collect-preview.mjs` и red→green `branding QA runner refuses unsafe configuration` в `apps/web/tests/branding-collect-schema.test.ts` (A12). Там же `branding schema supports legacy and rollback`: отдельная БД с existing migrations, A11 legacy/non-object/permission fixtures. Done: runnable isolated QA prerequisite, 0 новых SQL migrations, endpoints вне stable preview. Depends: закрытый baseline 4da1c64.
- TASK-2 — Pseudocode/refinement: FR-201, FR-202, NFR-202, ADR-001. Расширить branding.ts и branding.test.ts: base Branding совместим с тремя полями, ResolvedBranding материализует defaults; whitelist/HTTPS/length/contrast/SQL-safe Unicode. A2, A3, A9: `branding patch rejects forbidden and malformed values`; без partial writes/truncate. Done: валидирован весь patch, legacy HTTP сохранён при unrelated dirty patch, редактируемый logo только HTTPS. Depends: TASK-1.
- TASK-3 — Refinement: FR-201, FR-209, NFR-202, ADR-001. project-branding.ts и GET/PATCH route; `apps/web/tests/project-branding.test.ts`. A1, A2, A4, A11: `branding rejects foreign project and revoked permission`, `branding patch preserves unrelated keys`, `branding rejects cross origin and oversized stream`, `branding owner statements retain role and tenant context`, `new branding logs omit payloads`. Done: реальные current_user/GUC именно SELECT/UPDATE, mutant withService даже с account WHERE падает; atomic merge, non-object stored JSON→409, denied permission rollback; SECURITY-01 новые logger calls без payload/key, existing photo logs вне scope. Depends: TASK-2.
- TASK-4 — Refinement: FR-202, FR-203, FR-204, NFR-201, NFR-202, ADR-002. Wall/config/widget targets; optional typed WidgetBranding с runtime defaults. A5, A6, A9, A13: `widget sorts the same newest fifty` в `apps/web/tests/widget-config.test.ts`; `platform labels hide names but preserve provenance` в `apps/web/tests/wall.test.ts` и `apps/widget/tests/widget-branding.test.ts`; `branding contrast covers accent text and accent fill` в `apps/web/tests/branding.test.ts` и `apps/widget/tests/widget-branding.test.ts`. Done: separate accentFill/onAccent/accentText/edge/focus, stable IDs, immutable excerpt/screenshot/provenance, badge invariant, legacy missing DTO, Shadow DOM, ≤30KB gzip. Depends: TASK-2.
- TASK-5 — Refinement: FR-201, FR-202, FR-207, FR-210, NFR-201, ADR-001, ADR-003. Branding page/editor/view + scoped proofo-forms.css: idle/dirty/saving/saved/error, all settings locked while saving, explicit live palette.fieldBorder=#8e806b; existing `apps/web/src/app/dashboard/[slug]/page.tsx` получает только branding link. Tests `branding collect real flows`, `owner navigates from project to branding and back`, `legacy HTTP logo permits unrelated theme save`, `branding locks settings during delayed save`, `branding two tabs merge dirty keys in commit order` в `tools/visual/branding-collect.e2e.test.mjs`. A1, A3, A8, A16: forged foreign/inactive URL refused, all controls+both color inputs/Save locked, one captured payload, failed save preserves draft; two tabs different keys preserved/same key last commit after both reloads. Done: ordinary login→project→branding→Save/reload→public effect→back, без ручного URL. Depends: TASK-3, TASK-4.
- TASK-6 — Refinement: FR-205, FR-206, FR-207, NFR-201, ADR-003. Collect page/view, SubmitForm/IntakeTabs: reuse fetch/FormData/preview. A7, A8, A9: `collect preserves padded names and raw role text boundaries` плюс 503/retry/XSS в `tools/visual/branding-collect.e2e.test.mjs`; existing testimonial/photo/storage-cloudru tests. Done: noValidate explicit name.trim length2–80/raw role≤120 before blank-null/raw text10–2000; raw82/trim80 UI+HTTP201 exact DB value, trim81 client-no-fetch/HTTP400 no upload/quota; role120spaces→null/121→400/text10spaces valid; no raw truncation; MIME/signature/5MiB, 201-only success, false video flag. Depends: TASK-2.
- TASK-7 — Refinement: FR-208, ADR-003. `apps/web/tests/branding-collect-visual-fixture.test.ts`, `scripts/render-branding-collect-fixture.mjs`; test `production views render frozen models offline`. A10: existing check-proofo-visual font/margin/color mutations, branding/collect ×3 sizes. Done: six zero-diff cases на original literal palette через generic explicit props тех же components, no Next fixture route, unchanged baseline hashes; это component/layout proof, live border отличается по решению владельца. Depends: TASK-5, TASK-6.
- TASK-8 — Completion: FR-206, FR-209, FR-210, NFR-201, NFR-202, NFR-203, ADR-003, ADR-004. E2E через runner из TASK-1 и `apps/web/tests/branding-collect-mutation.mjs`. A1, A4, A6, A7, A8, A11, A12, A13, A14, A15, A16, A17: `collect uploads and reads local photo` через настоящий SDK в synthetic loopback S3; pending→approve→wall/widget, 503/quota rollback/retry, unsafe config/refused spawn, actual SQL role mutation. В `tools/visual/branding-collect.e2e.test.mjs` также `branding contrast covers accent text and accent fill`, `live forms use owner approved field borders`, `forms expose labels errors statuses and managed focus`, `live forms and widget reflow without truncation` с oracles ниже. Done: killed mutants, second origin, отсутствие remote calls, stable artifact/process/ports неизменны; manual screen-reader evidence отдельно, отсутствие не pass. Depends: TASK-3, TASK-4, TASK-5, TASK-6, TASK-7.
- TASK-9 — Completion: NFR-202. Local code/process gates, Direct Step8/9, independent cross-model review, FR→spec→code→evidence. Done: actual model/session/SHA, findings closed, owner test handoff; no GitHub CI/production. Depends: TASK-8.

## Dependency order / parallel groups

TASK-1 → TASK-2 → {TASK-3,TASK-4,TASK-6} → TASK-5 → TASK-7 → TASK-8 → TASK-9.
TASK-5/6 share stylesheet: assign one author, no concurrent edits. Dashboard overview
excluded; existing project page получает только navigation link как явно названный target.
Future coding Sol; architecture Astra; review fresh other model per matrix. For Astra
documents — три независимые роли Terra в свежих сессиях. Assignments не доказывают
запуск; actual metadata/evidence обязательны.

## K1 до первого app module

Выполнить `npm run dz -- name-check --module <basename> --export <comma-list>` для
project-branding/readOwnedBranding,patchOwnedBranding; branding-view/BrandingView,BrandingViewModel;
branding-editor/BrandingEditor; collect-view/CollectView,CollectViewModel; новых exports
ResolvedBranding,BrandingPatch,validateBrandingPatch,brandingForeground в branding;
applyWidgetBranding в widget render и WidgetBranding в widget types;
run-branding-collect-preview/assertBrandingCollectQaConfig,buildBrandingCollectQaEnv;
render-branding-collect-fixture и новых test basenames, включая widget-branding.test.
GET/default — существующие framework ABI names, повторяются по Next convention;
их нельзя объявлять globally FREE. PATCH проверяется отдельно; для page/route файлов
до создания нужен точный canonical path/no-alias existence check. Path-query FREE не
заменяет global domain export check. Exit1→rename новых domain names; exit2→NOT ESTABLISHED.
Координатор выполняет предварительные K1 probes; полный K1 admission **ещё pending**.
Новые modules нельзя создавать до подтверждённого допуска всего актуального inventory.

## Checkpoints

CP0: Direct runtime/native hooks/QCSD findings. CP1: K1 и K2:
`node .agents/skills/feature-adr/scripts/check-plan-completeness.mjs features/proofo-ui/branding-collect --tier=L --require-requirements`.
K2 actual guard после author rework: **PASS, exit0**, 30 targets, 13 IDs, 4 ADR,
0 failures/warnings/skips; это structural completeness, не code admission.
CP2: isolated schema/permission; CP3: live settings/readers;
CP4: frozen+interactive proof; CP5: independent QE/manual acceptance. Record exact SHA.

## Risk assessment

Critical: foreign writes/CSRF (TASK-3/8), source/badge conflation (TASK-4/8).
High: fake visual proof (TASK-7), stored-without-effect (TASK-4/5), intake regression (TASK-6/8).
Fallback: исправлять contract/test до следующей группы, не скрывать failure/расширять ratings/STT.
Photo privacy policy не меняется; key-based route не называется vulnerability без evidence.
Estimate: 30 files, 6–9 часов implementation+QE; верхняя граница bounded L, не SLA.
31-й необходимый target требует явного пересмотра scope/tier/FR/plan, а не скрытого обхода списка.

## QCSD test oracles и отказные мутации

TESTABILITY-01: UI и direct HTTP одного corpus должны совпасть с exact stored raw;
raw-name maxlength80 или валидатор raw вместо trim обязаны сломать padded80 acceptance.
Role/text проверяются по raw units, в том числе spaces; server module не переписывается.
UX-01: delayed success/error, попытки редактировать каждый setting+оба color inputs,
один запрос/снимок draft; mutant unlock во время pending должен провалить тест.
Два отдельных browser contexts одного owner: разные keys сохранены обоими commit,
один key last committed wins; reload обеих показывает итог без version-lock обещания.
ACCESSIBILITY-01: computed foreground/background с ancestor alpha compositing, не
только helper output. HEX #FFFFFF/#000000/#F8F8F8/#181818/#777777, оба project themes;
collect остаётся light. Heading/link/status/error/provenance/badge text≥4.5:1, large
text≥3:1, все необходимые control boundaries и focus≥3:1 к соседним surfaces. Проверить text-on-fill
и accent-as-text отдельно. Raw white heading mutant падает при правильном button ink.
ACCESSIBILITY-02: label/id + AX accessible name каждого input (два различных color names),
hint/error describedby, aria-invalid, busy/disabled/status, visible role=alert summary
focus+field links, success focus. Keyboard Tab/Shift+Tab/Enter/Space, no trap; client,
400/429/503/network и legacy HTTP unchanged/edited case. Удалить error text/relation — fail.
Отдельная ручная screen-reader запись pending/error/success обязательна до acceptance.
Она выполняется при owner acceptance опубликованной test copy; это не production acceptance.
Owner 2026-11-12 «выбери контрастнее»: live branding/collect field border=#8e806b
через generic explicit palette props, original #ddd3c2 только offline literal model.
Отдельный `live forms use owner approved field borders` измеряет computed border/fill/card
после compositing: ≥3:1 (расчётные3.5035/3.7903). Проверяет input/textarea/select/color
и необходимую photo boundary в idle/error/focus; mutation live→#ddd3c2 должна упасть.
Остальные необходимые boundaries/focus ≥3 к фактическому соседнему фону, wall/widget
в обеих темах. Ни isFixture/Next fixture/seed/auth override, ни изменение goldens
не допускаются. Frozen proof не заменяет live oracle; origin review ещё требуется.
ACCESSIBILITY-03: live routes и separate widget host/root, 320/360/390, обе темы;
nonbreaking heading120/name raw82/role120/text2000/filename255/longerror/URL2048.
scrollWidth≤clientWidth+1px; full public textContent, wrapping без ellipsis/clamp/clip,
видимые controls/focus при vertical scroll. Полный input value/Home/End/selection с
внутренней прокруткой допустим. Mutation nowrap или hidden clipping обязана упасть.
SECURITY-01: sentinel new PATCH/UI logger tests и own QA summaries whitelist status/hash/count;
inherited raw legacy unit output помечен synthetic, existing photo GET key logging
не объявляется исправленным. Никаких real credentials/payloads в QA. Не добавлять target.

## Amendments

AM-1 (source contract): toggle скрывает имя, сохраняет provenance. Confirmation: source/badge остаются → test `platform labels hide names but preserve provenance` in `apps/widget/tests/widget-branding.test.ts` (fails if reverted).
AM-2 (координатор): fixture production component вне Next. Confirmation: same-component render → test `production views render frozen models offline` in `apps/web/tests/branding-collect-visual-fixture.test.ts` (fails if reverted).
AM-3 (новый baseline/поручение): branding достижим из существующего проекта. Confirmation: ordinary keyboard navigation/back → test `owner navigates from project to branding and back` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).
AM-4 (dashboard lesson): роль/GUC проверяются на фактических statement. Confirmation: withService mutation detected → test `branding owner statements retain role and tenant context` in `apps/web/tests/project-branding.test.ts` (fails if reverted).
AM-6 (legacy browser constraint): branding noValidate + dirty validation не блокирует unrelated Save. Confirmation: theme PATCH без logo и reload effect → test `legacy HTTP logo permits unrelated theme save` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).
AM-5 (photo QA boundary): отдельный runner допускает только synthetic local S3. Confirmation: unsafe config refuses before spawn → test `branding QA runner refuses unsafe configuration` in `apps/web/tests/branding-collect-schema.test.ts` (fails if reverted).
AM-7 (TESTABILITY-01): одинаковые trim/raw формулы UI/HTTP без обрезки → test `collect preserves padded names and raw role text boundaries` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).
AM-8 (ACCESSIBILITY-01): accentText отдельно от onAccent, actual computed contrast → test `branding contrast covers accent text and accent fill` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).
AM-9 (ACCESSIBILITY-02): labels/errors/status/focus всех states и legacy HTTP → test `forms expose labels errors statuses and managed focus` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).
AM-10 (ACCESSIBILITY-03): длинный контент и widget остаются доступны без clipping → test `live forms and widget reflow without truncation` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).
AM-11 (UX-01): locked captured draft до success/error → test `branding locks settings during delayed save` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).
AM-12 (SECURITY-01): logging запрет ограничен новой поверхностью → test `new branding logs omit payloads` in `apps/web/tests/project-branding.test.ts` (fails if reverted).

AM-13 (owner decision 2026-11-12 / ACCESSIBILITY-01): approved live field border #8e806b через generic palette props, original palette только offline; old-border mutation обязана падать → test `live forms use owner approved field borders` in `tools/visual/branding-collect.e2e.test.mjs` (fails if reverted).

EXPECTED_CODE_TARGETS:
- apps/web/src/lib/branding.ts
- apps/web/src/lib/project-branding.ts
- apps/web/src/app/api/projects/[slug]/branding/route.ts
- apps/web/src/app/dashboard/[slug]/branding/page.tsx
- apps/web/src/app/dashboard/[slug]/branding/branding-editor.tsx
- apps/web/src/app/dashboard/[slug]/branding/branding-view.tsx
- apps/web/src/app/f/[slug]/page.tsx
- apps/web/src/app/f/[slug]/submit-form.tsx
- apps/web/src/app/f/[slug]/intake-tabs.tsx
- apps/web/src/app/f/[slug]/collect-view.tsx
- apps/web/src/app/proofo-forms.css
- apps/web/src/lib/wall.ts
- apps/web/src/app/w/[slug]/page.tsx
- apps/web/src/lib/widget-config.ts
- apps/widget/src/types.ts
- apps/widget/src/index.ts
- apps/widget/src/render.ts
- apps/widget/src/styles.ts
- apps/web/tests/branding.test.ts
- apps/web/tests/project-branding.test.ts
- apps/web/tests/branding-collect-visual-fixture.test.ts
- apps/web/tests/wall.test.ts
- apps/web/tests/widget-config.test.ts
- apps/widget/tests/widget-branding.test.ts
- tools/visual/branding-collect.e2e.test.mjs
- scripts/render-branding-collect-fixture.mjs
- apps/web/tests/branding-collect-schema.test.ts
- apps/web/tests/branding-collect-mutation.mjs
- apps/web/src/app/dashboard/[slug]/page.tsx
- scripts/run-branding-collect-preview.mjs
