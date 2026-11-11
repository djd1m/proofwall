# Требования Cloud.ru storage

## Нормативная дельта
Путь: `openspec/changes/cloudru-storage/specs/object-storage/spec.md`.
SHA-256: `58c63abcd10612d158c884ea8d13922b7289f7fad25ecc11fe95afb4f9f876a9`.
Сценарии этой дельты задают новое поведение; историческое требование MinIO заменяется только в описанном объёме.

## Требования и приёмка
| ID / приоритет | Требование | Requirement / Scenario в дельте |
|---|---|---|
| FR-1 MUST | Web: endpoint/region/style/checksum для Cloud.ru | Web Cloud.ru S3 compatibility / Cloud.ru upload and photo read |
| FR-2 MUST | Worker: те же параметры, старый WorkerConfig и TTL совместимы | Worker Cloud.ru S3 compatibility / Cloud.ru signing and MinIO compatibility |
| FR-3 MUST | Один private bucket, прежние ключи и защита фото-API | Shared private bucket preserves object boundaries / Photo route cannot expose video |
| FR-4 MUST | Обе env-переменные обоим сервисам; MinIO опционален | Explicit deployment wiring / Cloud deployment without local MinIO |
| FR-5 MUST | Ключи вводит владелец в ignored `.env` с mode 600 | Owner-managed credentials / Preparation without owner credentials |
| FR-6 MUST | Mock, build, review и реальный Cloud.ru — отдельные результаты | Separate local evidence from runtime acceptance / Credentials are not available |

Заинтересованные стороны: владелец вводит ключи и принимает стенд; посетители сохраняют прежний путь фото/отзывов; coder и reviewer проверяют контракт. Нефункциональные ограничения: приватный bucket; без секретов в Git/логах; без новых зависимостей, экспортируемых функций, БД и UI. Транскрипция выключена, оплаты без ключей. Открытая зависимость — ключи и фактические права Cloud.ru, затем медиа-CJM. Probe-скрипт исключён последним уточнением координатора.
