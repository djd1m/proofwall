# Direct QCSD — входы и draft, не verdict

Статус: **PENDING INDEPENDENT EXECUTION**. Этот документ не заменяет шесть независимых ролей и не утверждает GO/CONDITIONAL/NO-GO, scores или gate receipts. Координатор prepare immutable snapshot и запускает реальные роли другой модели волнами 3+3.

## Flags / routing
| Flag | Значение | Evidence |
|---|---|---|
| HAS_UI | true | project screen, forms, shell/styles |
| HAS_SECURITY | true | auth/RLS, password, provenance/XSS, external effects |
| HAS_UX | true | onboarding, import/mode, navigation, responsive, errors |
| HAS_VIDEO | true | Existing video/transcript presentation retained; no new recording/backend |
| HAS_MIDDLEWARE | false | Нет broker/API gateway/middleware changes |
| HAS_SAP_INTEGRATION | false | Нет SAP |
| HAS_AUTHORIZATION | false | Existing owner/RLS, нет новой RBAC/SoD/permission matrix; security role обязателен |

Core: quality criteria recommender, risk assessor, requirements validator. Conditional: accessibility auditor, security auditor, QX partner. HAS_VIDEO — применимый follow-up existing caption/transcript presentation, не разрешение новых сервисов. Каждый reviewer читает full role reference. Применяются installed steps01…08, точный synthesis thresholds и learning persistence. Runtime/MCP недоступен → BLOCKED.

## Shift-left criteria and risk inputs
| Риск | P×I | Снижение/ранний oracle |
|---|---|---|
| Owner/RLS/active guard regression | 3×5=15 | Loader test actual executing SQL role/GUC + withService/remove-active mutation |
| Потеря import/moderation/source | 4×4=16 | Existing contracts, all transitions, screenshot-only, CSV preview/commit/retry |
| Fake OCR/paid promises/zero-review links gate | 4×4=16 | Concrete adaptation+approval, DOM capabilities oracle |
| Fake visual proof/default hidden by literal model | 4×4=16 | Immutable original + same-production view + ordinary persisted runtime palettes |
| Recovery/password/N3/share loss | 3×4=12 | Always recovery, all current statuses, consent cancel, synthetic session rotation |
| Accessibility/mobile/long content | 4×3=12 | Explicit computed/keyboard/no-clipping oracles before implementation |
| Real remote QA side effects | 2×5=10 | Reuse allowlist/lock, local fixture adapters, outbound fail-closed |

Scores — архитектурная оценка входа, не независимые metrics. Условия, уже известные до QCSD: владелец должен согласовать конкретный static adaptation/filled proposal до code; source capture exists как candidate, original baseline untouched; K1/K2/native admission ещё не исполнялись. Формальные origin findings ещё отсутствуют, не присваивать им IDs/closed statuses.

## Required output
Реальные role reports, input hashes, model/session metadata, synthesis и machine evaluation, persistence record. Затем plan amendments по подтверждённым findings с exact test titles/paths. Никакие старые dashboard/branding closed receipts не используются как current GO.
