# Branding + collect — SPARC-GOAP implementation plan

Proposed L; **не допущен к коду**. Inputs read: 00_reuse_audit, 01_requirements,
02_research, 03_adr, 03.5_ideation_report, 04_domain_model, 05_architecture,
Direct code-goal-planner и shift-left-testing. QCSD report — pending inputs.

## Goal state

Current: branding reader без writer; text/photo submit существует; новых presentation
readers нет. Goal: шесть настроек действуют после reload, collect сохраняет pipeline,
tenant/badge/provenance и frozen layout доказаны. Coverage/pass сейчас не измерены.
Completion — reviewable test artifact; production deployment не задача плана.

## Tasks

- TASK-1 — Specification/architecture: NFR-202. После dashboard closure перенести OpenSpec draft, сверить SHA/strict validate; Direct QCSD/checkpoints, K1/K2. Test `branding schema supports legacy and rollback` в `apps/web/tests/branding-collect-schema.test.ts`: отдельная БД со всеми existing migrations, legacy JSON, A11 malformed/permission denial. Done: schema compatibility, 0 новых SQL migrations. Depends: dashboard closure.
- TASK-2 — Pseudocode/refinement: FR-201, FR-202, ADR-001. Расширить branding.ts и branding.test.ts: whitelist, defaults, HTTPS, length, contrast. A2, A3, A9: `branding patch rejects forbidden and malformed values`; без partial writes/truncate. Done: валидирован весь patch, legacy HTTP сохранён при unrelated patch. Depends: TASK-1.
- TASK-3 — Refinement: FR-201, FR-209, ADR-001. project-branding.ts и GET/PATCH route; `apps/web/tests/project-branding.test.ts`. A1, A2, A4, A11: `branding rejects foreign project and revoked permission`, `branding patch preserves unrelated keys`, `branding rejects cross origin and oversized stream`. Done: real RLS/permission rollback, auth before body, атомарный merge. Depends: TASK-2.
- TASK-4 — Refinement: FR-202, FR-203, FR-204, NFR-201, ADR-002. Wall/config/widget targets. A5, A6, A9: `widget sorts the same newest fifty` в `apps/web/tests/widget-config.test.ts`; `platform labels hide names but preserve provenance` в `apps/web/tests/wall.test.ts` и `apps/widget/tests/branding.test.ts`. Done: theme/accent readers, stable IDs, badge invariant, Shadow DOM, contrast, ≤30KB gzip. Depends: TASK-2.
- TASK-5 — Refinement: FR-202, FR-207, NFR-201, ADR-003. Branding page/editor/view + scoped proofo-forms.css: idle/dirty/saving/saved/error, dirty keys. Test `branding collect real flows` в `tools/visual/branding-collect.e2e.test.mjs`. A3, A8: unsupported поля и failed save не дают success. Done: ordinary session Save/reload/public effect. Depends: TASK-3, TASK-4.
- TASK-6 — Refinement: FR-205, FR-206, FR-207, NFR-201, ADR-003. Collect page/view, SubmitForm/IntakeTabs: reuse fetch/FormData/preview. A7, A8, A9: boundaries/503/retry/XSS в `tools/visual/branding-collect.e2e.test.mjs`; existing testimonial/photo/storage-cloudru tests. Done: name2–80/role120/text10–2000/MIME/signature/5MiB; 201-only success, false video flag, keyboard/focus. Depends: TASK-2.
- TASK-7 — Refinement: FR-208, ADR-003. `apps/web/tests/branding-collect-visual-fixture.test.ts`, `scripts/render-branding-collect-fixture.mjs`; test `production views render frozen models offline`. A10: existing check-proofo-visual font/margin/color mutations, branding/collect ×3 sizes. Done: six zero-diff cases, same components, no Next fixture route, unchanged baseline hashes. Depends: TASK-5, TASK-6.
- TASK-8 — Completion: FR-206, FR-209, NFR-201, NFR-202. E2E + `apps/web/tests/branding-collect-mutation.mjs`. A1, A4, A6, A7, A8, A11: text/photo→pending→approve→wall/widget; foreign/inactive; permission rollback; origin/body/badge/whitelist mutant refusal. Done: actual assertions kill mutants, second widget origin, isolated local storage/DB, no external mail/STT/payment. Depends: TASK-3, TASK-4, TASK-5, TASK-6, TASK-7.
- TASK-9 — Completion: NFR-202. Local code/process gates, Direct Step8/9, independent cross-model review, FR→spec→code→evidence. Done: actual model/session/SHA, findings closed, owner test handoff; no GitHub CI/production. Depends: TASK-8.

## Dependency order / parallel groups

TASK-1 → TASK-2 → {TASK-3,TASK-4,TASK-6} → TASK-5 → TASK-7 → TASK-8 → TASK-9.
TASK-5/6 share stylesheet: assign one author, no concurrent edits. Dashboard excluded.
Future coding Sol; architecture Astra; review fresh other model per matrix. For Astra
documents reviewer Terra. Assignments не доказывают запуск; actual metadata обязательны.

## K1 до первого app module

Выполнить `npm run dz -- name-check --module <basename> --export <comma-list>` для
project-branding/readOwnedBranding,patchOwnedBranding; branding-view/BrandingView,BrandingViewModel;
branding-editor/BrandingEditor; collect-view/CollectView,CollectViewModel; новых exports
BrandingPatch,validateBrandingPatch,brandingForeground в branding и applyWidgetBranding в widget;
render-branding-collect-fixture и новых test basenames. Framework page/route/GET/PATCH
проверять scoped, не трактовать generic collision как free. Exit1→rename; exit2→NOT ESTABLISHED.
K1 сейчас **не запущен**; новые modules создавать нельзя до PASS каждого имени.

## Checkpoints

CP0: Direct runtime/native hooks/QCSD findings. CP1: K1 и K2:
`node .agents/skills/feature-adr/scripts/check-plan-completeness.mjs features/proofo-ui/branding-collect --tier=L --require-requirements`.
K2 сейчас **не запущен**. CP2: isolated schema/permission; CP3: live settings/readers;
CP4: frozen+interactive proof; CP5: independent QE/manual acceptance. Record exact SHA.

## Risk assessment

Critical: foreign writes/CSRF (TASK-3/8), source/badge conflation (TASK-4/8).
High: fake visual proof (TASK-7), stored-without-effect (TASK-4/5), intake regression (TASK-6/8).
Fallback: исправлять contract/test до следующей группы, не скрывать failure/расширять ratings/STT.
Photo privacy policy не меняется; key-based route не называется vulnerability без evidence.
Estimate: 28 files, 6–9 часов implementation+QE; уточнить после QCSD, не SLA.

## Amendments

AM-1 (source contract): toggle скрывает имя, сохраняет provenance. Confirmation: source/badge остаются → test `platform labels hide names but preserve provenance` in `apps/widget/tests/branding.test.ts` (fails if reverted).
AM-2 (координатор): fixture production component вне Next. Confirmation: same-component render → test `production views render frozen models offline` in `apps/web/tests/branding-collect-visual-fixture.test.ts` (fails if reverted).

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
- apps/widget/tests/branding.test.ts
- tools/visual/branding-collect.e2e.test.mjs
- scripts/render-branding-collect-fixture.mjs
- apps/web/tests/branding-collect-schema.test.ts
- apps/web/tests/branding-collect-mutation.mjs
