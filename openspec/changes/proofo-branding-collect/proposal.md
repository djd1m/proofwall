# Proofo: оформление и сбор отзывов

## Why

После dashboard следующий согласованный UI-инкремент должен дать владельцу сохранение
оформления с реальным эффектом на публичных поверхностях и перенести существующий
text/photo intake в согласованный дизайн. Статический макет не является продуктом.

## What Changes

- Tenant-safe read/PATCH существующего `projects.branding`, без новой БД/сервиса.
- Theme, accent, logo, heading, newest/oldest и видимость названия площадки с читателями.
- Checkbox меняет только presentation: при выключении названия площадки остаются
  нейтральная отметка переноса и ссылка/снимок. Это явное уточнение исторического
  `docs/Specification.md` FR-PROOF-001, а не подмена provenance.
- Collect использует существующие JSON/multipart, validation, private bucket и pending.
- Frozen fixture тех же production components вне приложения и отдельные functional E2E.

## Impact

Нормативная дельта: `specs/branding-collect/spec.md`; FR mapping и SHA-256 —
`features/proofo-ui/branding-collect/01_requirements.md`.
30 ожидаемых code/test/tool targets перечислены в конце implementation plan:
добавлены navigation из existing project page и отдельный safe QA runner для photo E2E.
SQL-миграция не требуется: JSONB уже существует, новые ключи имеют read defaults.
Совместимость схемы/legacy JSON и реальные grants проверяются на изолированной БД.
Рейтинг, OCR, STT, оплата, новая тарифная модель и logo upload не входят.

Статус: **planning draft, не implementation admission**. QCSD/K1/K2/hook evidence
и независимый cross-model review должны быть предъявлены отдельно.
