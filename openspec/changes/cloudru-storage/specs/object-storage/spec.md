## ADDED Requirements

### Requirement: Web Cloud.ru S3 compatibility
Web SHALL использовать существующий AWS SDK v3 клиент с endpoint `https://s3.cloud.ru`, region `ru-central-1`, `forcePathStyle=false`, `requestChecksumCalculation=WHEN_REQUIRED` и `responseChecksumValidation=WHEN_REQUIRED` при соответствующем окружении.

#### Scenario: Cloud.ru upload and photo read
- **GIVEN** оба bucket-параметра равны `proofwall` и заданы ключи владельца
- **WHEN** web выполняет PUT видео/фото или GET фото
- **THEN** запрос использует virtual-hosted адресацию и подписывается для `ru-central-1`
- **AND** SDK не добавляет необязательный checksum к обычному PUT

### Requirement: Worker Cloud.ru S3 compatibility
Worker SHALL читать `S3_REGION` и `S3_FORCE_PATH_STYLE`, использовать те же checksum-параметры и сохранять существующий TTL presigned GET.

#### Scenario: Cloud.ru signing and MinIO compatibility
- **WHEN** `S3_FORCE_PATH_STYLE=false`
- **THEN** presigned GET использует Cloud.ru virtual-hosted адрес и регион из конфигурации
- **AND** отсутствие нового опционального поля WorkerConfig сохраняет path-style поведение прежних вызовов

### Requirement: Shared private bucket preserves object boundaries
Приложение SHALL использовать один частный бакет `proofwall` для видео и фото без изменения object keys, записей БД и маршрутов выдачи.

#### Scenario: Photo route cannot expose video
- **WHEN** фото-API получает ключ с видео-расширением или байты без допустимой сигнатуры изображения
- **THEN** сохраняется отказ существующего маршрута
- **AND** допустимые фото продолжают выдаваться через API с проверкой jpg/png/webp и sniffImage

### Requirement: Explicit deployment wiring
Compose SHALL передавать `S3_REGION` и `S3_FORCE_PATH_STYLE` web и worker; MinIO SHALL запускаться только явно выбранным опциональным профилем.

#### Scenario: Cloud deployment without local MinIO
- **WHEN** запускается основной стек с Cloud.ru окружением без MinIO-профиля
- **THEN** MinIO не запускается и отсутствует обязательная зависимость web/worker от него
- **AND** выключенная транскрипция и отсутствие платёжных ключей сохраняются

### Requirement: Owner-managed credentials
Ключи SHALL добавляться владельцем в `/home/proofwall/.env` с правами `600`, исключённый из Git; `S3_ACCESS_KEY` имеет формат `<tenant_id>:<key_id>`, `S3_SECRET_KEY` содержит Key Secret.

#### Scenario: Preparation without owner credentials
- **WHEN** выполняется подготовка конфигурации
- **THEN** `.env.example` содержит пустые значения ключей и инструкцию
- **AND** секреты Clipmkr не читаются, не копируются и не выводятся

### Requirement: Separate local evidence from runtime acceptance
Отчёт SHALL различать локальные mock/regression/build проверки, независимое ревью и доступ к реальному бакету.

#### Scenario: Credentials are not available
- **WHEN** локальные проверки завершены, но пользовательские ключи ещё не добавлены
- **THEN** доступ к Cloud.ru и медиа-CJM обозначаются как не проверенные
- **AND** существующий интеграционный storage-набор с CreateBucket и PUT не запускается на реальном бакете
