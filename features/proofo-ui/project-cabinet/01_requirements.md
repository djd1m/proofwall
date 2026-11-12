# Кабинет проекта Proofo — требования

Статус: плановые требования для независимого QCSD; реализация и приёмка pending.
Нормативная дельта: `openspec/changes/proofo-project-cabinet/specs/project-cabinet/spec.md`. SHA-256: `834c9e8bcd3db6851e3b00e24f7196370c48bf6b3afaef18ffc22aa19a622b40`.
База: `5513c574c5406e017d3e210ee1c4bb0704752144`, branch `feature/proofo-project-cabinet`.

| ID | Requirement/scenarios дельты | Содержание и проверка |
|---|---|---|
| FR-301 | PC-01 / Owner opens; Session or ownership | Настоящее имя, currentAccountId/withAccount/RLS, inactive404, effective tariff; owner/foreign/anonymous tests |
| FR-302 | PC-02 / Email delivery; Return visit | Allowlist четырёх notices, постоянный verify/reissue, anchors и реальные completion данные |
| FR-303 | PC-03 / Manual evidence; Import failure | PlatformForm и ImportForm доступны, pending/provenance/preview/commit/duplicates, ошибки без ложного success |
| FR-304 | PC-04 / Moderate mixed; Denied or failed | Все четыре состояния и разрешённые переходы, media/source/transcript, escaped full text, ошибки/409 |
| FR-305 | PC-05 / Empty destinations; Sharing confirmation | Реальные /f,/w,branding, encoded internal href, current-origin snippet сразу; installs/share consent |
| FR-306 | PC-06 / Tariff failure; N3 explicit action | Existing BillingBlock/N3Status, price/env/effective tier, request_key retry/canceled/new-purchase, no invented plans |
| FR-307 | PC-07 / Password mismatch and success | Existing ChangePassword, mismatch/error/cancel, revoke всех old sessions+reissue current |
| FR-308 | PC-08 / Default/custom; Small screen | Paper shell, terracotta product chrome, separate persisted public custom accent, reflow+keyboard |
| FR-309 | PC-09 / Immutable comparison; Real runtime | Новый immutable project-v1, same-production-view offline, explicit adaptation boundaries, ordinary persisted live E2E |
| NFR-301 | PC-08 / Small screen | 320/360/390/1440; full content/no page overflow; contrast text≥4.5, large≥3, boundaries/focus≥3; labels/status/error focus |
| NFR-302 | PC-01, PC-04, PC-09 | Реальная SQL role+GUC на исполняемом statement, XSS, strict CSP/ordinary HTTP, мутации стражей; без fixture auth bypass |
| NFR-303 | PC-10 / Runtime boundaries | PG33186/app33187/S3synthetic33188/foreignhost33189, общий lock, no remote effects, no CI/production deploy |

Поведение существующих API не меняется. Client state намеренно уточняется: exact CSV preview binding/invalidation, mounted file/draft retention, explicit refresh boundary, accessible busy/error/focus и password in-flight cancel lock. Reference page — источник UI, не спецификация нового OCR, тарифов или кампаний. Связи с действующими ADR: docs/ADR.md ADR-001/002/005/006/007 и локальные ADR-001/002/003. Нет DB migrations или внешних dependencies.

Решения интерфейса: `design-adaptation.md` и конкретный static proposal в `preview/` (готовит отдельный автор). Согласование adaptation **pending**: root покажет reviewable URL/кадры владельцу по AGENTS.md до product source writes. Общий scope уже разрешён «продолжай»; отдельное решение требуется только для конкретных отличий от macro и filled-state proposal. Не считать original или новый screenshot полным runtime evidence.

Recall: координатор прочитал три полных pattern values (`.secrets/project-cabinet-recall.json`); применены email recovery, ordinary HTTP+strict CSP и раздельная проверка живого default/custom цвета. Private snapshot не копируется в feature или Git. Нового successful learning receipt архитектор не заявляет.

Не входят: OCR, link scraping, новые tiers/prices, paid campaigns, edit/delete/reorder/rating, signup overhaul, public-branding redesign, глобальный CSS refactor, production deploy.

## QCSD design correction — без заявления closure
FR-301/NFR-302: `project cabinet HTTP denies anonymous foreign missing and inactive access` (ordinary persisted A/B/session/GET status+body) отдельно от actual SQL role/GUC; `project cabinet read failures do not become empty or not found` проверяет each3SELECT failure, generic boundary/rollback/retry, true empty200. Нет утечки name/text/URLs/snippet при отказе.
FR-303: `project cabinet preserves pasted and selected screenshots across methods and retries` проверяет ClipboardEvent либо реальный clipboard с отмеченным механизмом, отдельный file picker, File bytes/hash в multipart, screenshot-only без name/text. `project cabinet preserves all intake draft fields on recoverable failure` — manual+CSV round-trip,400/429/prewrite503/network unknown, сохранение всех полей/bytes, only-own-success clear. `project cabinet binds CSV commit to the successful preview` — csv/mapping invalidation, captured payload и stale-response generation.
FR-302/304/305: `project cabinet refresh reconciles items counts and installs` — manual full reload по явной ссылке с предупреждением drafts reset; no fake list update, moderation item+badge atomic, changed initial props, actual install+reload. Steps — ссылки без completion states.
FR-303/304/307/NFR-301: `project cabinet keyboard tabs preserve drafts and focus`, `project cabinet fields announce validation busy errors and retry`, `project cabinet moderation and password retain keyboard focus`; точные Tab/arrows/Home/End, labels/errors/ARIA tree и manual AT record указаны в05. `project cabinet password cancel respects in-flight mutation`: pre-submit POST0/clear/opener; in-flight cancel disabled до actual success/error, без rollback обещания.
FR-309: `project cabinet matches approved adaptation regions` проверяет exact pending owner manifest/region contract ADR003; реальные approved bytes ещё НЕ получены. Это отдельный oracle от original offline comparison, full live screenshots обязательны.
NFR-303: новый `scripts/run-project-cabinet-qa.mjs`, exact ports/flock/dispatch+receipts; `project QA runner refuses wrong ports lock and suite` и `project QA boundary records and refuses synthetic egress` в `apps/web/tests/project-cabinet-qa-runtime.test.mjs`. Scope ограничен наблюдаемыми Node JS transports/guarded children и browser-context requests, не всей ОС. Plan targets24, no backend API/schema additions.
Все именованные UI oracles выше находятся в `tools/visual/project-cabinet.e2e.test.mjs`; tests пока только запланированы.13 origins исправлены авторским design proposal, независимое подтверждение pending.
