# План Cloud.ru storage

Inputs read: `03_adr/001-use-cloudru-private-bucket.md`, `05_architecture.md`, `01_requirements.md`, `02_reuse_inventory.md`, `03.5_ideation_report.md`, OpenSpec delta и исходники из reuse inventory.

## Goal state
Текущее состояние: два AWS SDK v3 клиента с жёстким path-style, Compose не передаёт region/style. Цель: существующие клиенты поддерживают выбранный частный Cloud.ru bucket и legacy MinIO, object keys/TTL/интерфейс сохранены. Локальные тесты проходят без доступа в облако; runtime остаётся pending до ключей владельца. Coverage baseline не измерялся, процент не выдумывается. Планировщик отдельный gpt-6-astra xhigh; coder — coordinator, фактический ID модели независимо не наблюдался.

## Tasks
### TASK-1: Web совместимость и границы медиа — FR-1, FR-3, ADR-001
SPARC refinement. Изменить существующий `apps/web/src/lib/storage.ts`: читать S3_FORCE_PATH_STYLE (false → hosted, true/отсутствие → legacy path-style), сохранить S3_REGION, оба WHEN_REQUIRED. Обновить комментарий про общий частный бакет. Новых экспортируемых функций не вводить.
Добавить `apps/web/tests/storage-cloudru.test.ts`: реальный SDK + перехват HTTP request handler, фиктивные ключи; проверить host/path, ru-central-1 в подписи, отсутствие необязательных checksum headers/trailers и неизменные байты PUT/GET. Проверить конфигурацию responseChecksumValidation. Проверить оба bucket=proofwall, случайные UUID ключи, upload error→StorageError. Через существующий photo route проверить отказ видео-расширения и не-image bytes. Regression `apps/web/tests/photo.test.ts` сохраняет допустимые jpg/png/webp/sniffImage. Done: assertions ловят возврат неверной адресации/checksum и реальное прохождение запрещённого медиа.

### TASK-2: Worker конфигурация и подпись — FR-2, ADR-001
SPARC refinement; независим от TASK-1 по файлам. В `services/worker/src/config.ts` добавить опциональное `WorkerConfig.s3ForcePathStyle?: boolean`, загрузку S3_FORCE_PATH_STYLE; в `storage.ts` использовать поле с legacy default true и оба WHEN_REQUIRED. Сохранить region и TTL; не менять требования существующих ключей/TRANSCRIBE_SERVICE_URL.
Добавить `services/worker/tests/storage-cloudru.test.ts`: loadConfig читает false/true/отсутствие; старый объект WorkerConfig без поля работает; presigned GET имеет ожидаемый host, credential scope ru-central-1, тот же key и X-Amz-Expires. При запросе через capture подтвердить addressing/checksum. Done: старый и Cloud.ru контракты проверены, изменения API exports отсутствуют.

### TASK-3: Окружение и инструкция владельцу — FR-4, FR-5, ADR-001
SPARC architecture/completion; зависит от TASK-1/2. В `docker-compose.yml` передать region/style обоим сервисам, добавить MinIO optional profile и убрать обязательные зависимости web/worker от него. Удалить только новый untracked `deploy/minio/Dockerfile`, созданный в основной задаче; данные/volume не удалять. В `.env.example` оставить пустые credentials, показать endpoint/region/style и оба bucket=proofwall. В `docs/REPRODUCE.md` записать место ключей: `/home/proofwall/.env`, mode 600, ignored; S3_ACCESS_KEY=<tenant_id>:<key_id>, S3_SECRET_KEY=Key Secret. Транскрипция выключена, оплаты без ключей. Done: Compose без профиля исключает MinIO, wiring проверен без вывода секретов; .env содержание не читать.

### TASK-4: Верификация и передача — FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, ADR-001
SPARC completion; зависит от TASK-1/2/3 и независимого закрытия Step 3.5. Запустить targeted web/worker tests и существующий unit regression с фиктивным окружением. Затем применимые web/worker regression, `npm run typecheck`, `npm run lint`, `npm run build`, `bash scripts/check-env-wiring.sh`; сборка/проверки не читают рабочий `.env`. Не запускать `apps/web/tests/storage.test.ts` с реальным endpoint: он вызывает CreateBucket/PUT без cleanup. Integration без отдельного тестового окружения отмечать skipped, не PASS.
Сделать независимое cross-model review в новой сессии `fork_turns=none`: передать SHA/дифф, spec/ADR/план и тесты, зафиксировать фактические модель/входы/находки. Другой reasoning той же модели недостаточен. Закрыть существенные findings и anti-drift FR→spec→код→проверка. После введения пользовательских ключей пройти существующий медиа-CJM на HTTPS стенде, не сканировать/удалять чужие объекты. Пока ключей нет — реальный Cloud.ru и worker runtime NOT VERIFIED. Probe-скрипт не создавать.

## Dependency order и Parallel groups
TASK-1 и TASK-2 независимы по файлам, но исполняются одним coder без дополнительной делегации; затем TASK-3 → TASK-4. Specification/pseudocode/architecture уже представлены spec/ADR/этим планом; новые слои не создаются.

## Checkpoints
До кода: реальные K1/K2, валидация OpenSpec и закрытие независимого Step 3.5 coordinator. После клиентов: targeted checks. После Compose: wiring/config без секретов. После сборки: независимое ревью и anti-drift. После ключей: отдельный runtime/CJM checkpoint. K2 не подтверждает доступ в облако или отсутствие находок ревью.

## Risk assessment
Внешний сервис без ключей недоступен проверке; mock-тесты не доказывают доступ к бакету. Риски region/style/checksum покрывают TASK-1/2; общего bucket и keys — TASK-1; env/secret/offline MinIO — TASK-3; небезопасный запуск интеграционных тестов и ложный runtime — TASK-4. Worker сейчас требует ключи даже при выключенной транскрипции; до их ввода не обещать его запуск. Откат конфигурации после появления новых медиа требует оценки доступности объектов, не автоматического удаления.

## Amendments
Исходные уточнения заказчика уже включены в TASK-1…TASK-4: общий private bucket, optional WorkerConfig поле, отсутствие новых exports/probe и runtime после ключей. Независимые QCSD findings ещё не получены; исправления по ним coordinator добавляет отдельными AM-записями с реально запланированными тестами и повторным K2.

EXPECTED_CODE_TARGETS:
- apps/web/src/lib/storage.ts
- services/worker/src/storage.ts
- services/worker/src/config.ts
- apps/web/tests/storage-cloudru.test.ts
- services/worker/tests/storage-cloudru.test.ts
- docker-compose.yml
- .env.example
- docs/REPRODUCE.md
- deploy/minio/Dockerfile
