# Reuse и исследование

Clipmkr GitHub SHA 22bd63904218732759513addd8b54234812c4aed, получен gh api 11.11.2026. Прочитаны apps/web/src/server/support/mail.ts, email-handler.ts и packages/db/src/support-email.ts через GitHub Contents API; ни env, ни ключи не читались.

Переносимые подходы: fixed Resend fetch endpoint; bearer из конфигурации; timeout 8 секунд; text+HTML; escape ссылки; redirect:error; SHA-256 для randomBytes(32) token; TTL 24h verify; явное подтверждение POST; token в URL fragment вместо query. Session binding донорского verify не переносится как неявная смена действующей auth Proofwall: письмо доказывает владение адресом, не вход и не N3 proof.

Локальный reuse предпочтительнее копирования: email.ts уже реализует timeout/retry/idempotency и safe category logging; buildProjectUrls даёт /w, /dashboard, /f; registerAccountAndProject — одна транзакция; password-reset — hashed tokens и atomic consume; Next after у forgot. worker содержит транскрипцию/N3 outbox, общий transactional email worker отсутствует; новая очередь не нужна в этой scoped дельте.

Поддержанный следующий шаг: FR-014 CSV import, apps/web/src/app/dashboard/[slug]/import-form.tsx, /api/import, предпросмотр, explicit commit, очередь модерации. Не обещать YouTube/Google/соцсети. Название проекта пока не сохраняется; сохранить branding.name без новой таблицы проекта.
