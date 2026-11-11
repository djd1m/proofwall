# Traceability и anti-drift

| FR | Spec requirement/scenarios | Код | Доказательства |
|---|---|---|---|
| FR-101 | Письмо созданной стены: успех; hostile name; NUL boundary | onboarding-email.ts,register.ts,auth/register route | onboarding-email,register,onboarding-routes suites; synthetic HTML; NUL mutation |
| FR-102 | Подтверждение email: one-use,expiry,current email,GET-safe,resend | migration021,email-verification.ts,verify/resend API,verify-email UI | real PostgreSQL races/rollback/sessioncaps; SSR current-email/no-session; browser UI smoke; CAS/clock/identity mutations |
| FR-103 | Честная доставка: not configured,provider failure,recovery без первого письма | email.ts,register/resend routes,signup/dashboard handoff,operations | email/onboarding-routes/dashboard SSR; full904passed/3MinIOskipped; scheduled≠delivered |

SHA нормативной дельты сверяется с01; OpenSpec strict passed, archive до owner acceptance не выполняется. Risk: one-use/current-email/expiry/identity проверены DB и mutation probes. Integration: commit-before-send и provider failure через injected fake sender. Regression: полный websuite904passed/3skipped. Coverage: scenario mapping есть, line/branch percentage не измерен.

Это ручные четыре перспективы (traceability/risk/integration/regression), не четыре независимых QE агента и не автоматический fleet verdict. Реальный независимый reviewer другой модели закрыл три P2 и позднюю межвкладочную гонку на d633b7b;10 содержит историю проверенных SHA и ограничения. Только reviewable branch artifact; owner acceptance/deploy/production emails не проводились.
