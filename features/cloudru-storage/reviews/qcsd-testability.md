# Независимое QCSD review: тестируемость Cloud.ru storage

Роль: `qcsd-testability`; family: `codex`; независимый делегированный reviewer. Конкретный ID модели внутри этого запуска независимо не наблюдался. Фаза: ideation, 11.11.2026. Это оценка проекта и тестплана, не подтверждение реализации.

Вердикт: **clean**. HIGH/CRITICAL/BLOCKER недостатков в рассмотренном тестплане не обнаружено; обязательных условий нет. Средняя экспертная оценка — **91/100**, не показатель покрытия и не результат исполнения тестов.

## 10 Principles of Testability

| Принцип | Балл / 100 | Основание |
|---|---:|---|
| Observability | 92 | ADR Confirmation и TASK-1/2 требуют наблюдать сериализованный SDK HTTP-запрос: host/path, credential scope, checksum и тело; ошибки доступны через StorageError и существующие статусы. |
| Controllability | 92 | Worker loadConfig принимает отдельный env; createS3Client принимает config. Web имеет resetS3Client; фиктивные credentials и capture handler позволяют управлять ответами без облака. |
| Decomposability | 94 | Два клиента и конфигурация отделены от UI/БД; TASK-1, TASK-2, wiring и runtime проверяются отдельными слоями. |
| Simplicity | 95 | Два существующих SDK-клиента, без нового слоя, exports, dependencies и probe. Набор новых параметров мал и явно указан. |
| Stability | 88 | Проверки опираются на контракт host/path/region/TTL/bytes и WHEN_REQUIRED; SDK-сериализация может меняться при обновлениях, поэтому утверждения должны проверять значимые свойства. |
| Understandability | 94 | FR-1…FR-6 связаны с нормативными сценариями; план называет файлы, assertions, Done и разграничивает local/runtime evidence. |
| Isolation | 88 | Фиктивное окружение и HTTP capture исключают облако из targeted tests. Существующий live storage suite выделен и запрещён на рабочем endpoint; при реализации требуется аккуратный reset module/env/client. |
| Automatability | 92 | Capture, parsing presigned URL, route regression, config matrix и Compose wiring проверяемы автоматически; ручная runtime-приёмка выделена явно. |
| Repeatability | 86 | Нет зависимости targeted tests от Cloud.ru или владельческих ключей. UUID проверяются по форме/различию, TTL — через X-Amz-Expires; полная строка подписи меняется со временем и не нужна как golden snapshot. |
| Feedback | 89 | Targeted assertions до broad regression/build и независимого QE дают быстрый сигнал; ADR прямо требует падения проверок при возврате path-style и удалении WHEN_REQUIRED. |

## Проверенная цепочка доказательств

- FR-1: TASK-1 проверяет host/path, ru-central-1, отсутствие необязательных checksum headers/trailers, PUT/GET bytes и responseChecksumValidation. Проверка только constructor options не считается достаточной: это уже запрещено ADR Confirmation.
- FR-2: TASK-2 покрывает false/true/отсутствие переменной, старый WorkerConfig без нового поля, key и X-Amz-Expires. Существующий loadConfig(env) обеспечивает необходимую управляемость без новых exports.
- FR-3: TASK-1 проверяет общий bucket и route-отказы для видео-расширений и не-image bytes; photo.test.ts даёт отдельную regression-защиту jpg/png/webp/sniffImage. Этот существующий файл проверяет helper-функции, поэтому предусмотренная проверка самого маршрута существенна и не подменена helper-тестом.
- FR-4/5: TASK-3 содержит явную проверку Compose без MinIO-профиля и wiring обоим сервисам, без чтения рабочего .env. FR-6: TASK-4 разделяет targeted/regression/build, review и последующую runtime/CJM-приёмку.
- apps/web/tests/storage.test.ts запускается при наличии S3_ENDPOINT, вызывает CreateBucketCommand и PUT, а afterAll лишь уничтожает клиент. TASK-4 уже распознаёт этот риск, запрещает набор на рабочем endpoint и требует skipped вместо PASS без выделенного integration-окружения. Это не новое незакрытое finding.

## Границы заключения

Проверены 01_requirements.md, ADR-001, 05_architecture.md, 06_implementation_plan.md, нормативная OpenSpec delta, оба storage-клиента, WorkerConfig, storage.test.ts, photo.test.ts и конфигурация тестового запуска. Локальные policy-документы прочитаны; dz recall не нашёл релевантных patterns, поэтому применение накопленного знания не заявляется.

Новые серьёзные риски после полного обзора указанного scope не выявлены. Дисциплина очистки process.env/module cache и проверки семантики подписи вместо меняющейся полной строки остаётся обычной частью реализации тестов, не условием повторного ideation review. Runtime-ключи, права bucket, реальная сеть и работа медиа-CJM уже явно отложены до владельческой приёмки; отсутствие этих подтверждений не объявляется дефектом плана.

Тесты, Compose, build и обращения к Cloud.ru не запускались; .env не читался. Код и план не изменялись. Snapshot manifest независимо сверён по SHA-256 перед записью receipt. План и код прочитаны как дополнительные входы; host manifest ideation содержит requirements/ADR/architecture/complexity и не объявляется снимком всех дополнительных входов.

Nonce: `427cc982-68c2-4e34-b668-92bdd2838e7a`. Revision: `b518eb1fa5691df4de798c5a8a1cc140aa69572871ef260d62dae4ef052aba77`.
