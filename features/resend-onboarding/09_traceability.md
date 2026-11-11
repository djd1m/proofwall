# Traceability и anti-drift

| FR | Spec requirement/scenarios | Код | Фактическая проверка |
|---|---|---|---|
| FR-101 | Письмо созданной стены: Успешная регистрация; Пользовательское название | onboarding-email.ts, register.ts, auth/register route | onboarding-email.test.ts, onboarding-routes.test.ts, register.test.ts; synthetic HTML preview |
| FR-102 | Подтверждение email: One-use; Негодный token; Сканер; Повтор | migration021, email-verification.ts, verify/resend API, verify-email UI | email-verification.test.ts реальная testDB; onboarding-routes; browser smoke pending |
| FR-103 | Честная доставка: не настроена; отказ; повтор | email.ts, register/resend routes, operations guide | email.test.ts, onboarding-routes; no live send |

Риск: high one-use/current-email/TTL покрыты настоящей PostgreSQL+6mutation probes. Integration: commit-before-send и provider отказ через injected fake sender; session/N3 regression отдельными suites. Regression:116passed ранее,39latest focused после amendments; latest combined rerun pending. Coverage: scenario mapping есть, line/branch percentage не измерен.

Это ручные четыре перспективы (traceability/risk/integration/regression), не четыре независимых агента и не автоматический fleet verdict. Независимый cross-model review отдельной свежей сессией после commit SHA. Normative delta остаётся открытой до owner acceptance; OpenSpec archive не выполнялся.
