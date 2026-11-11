# Повторное использование

## Proofwall
`apps/web/src/lib/storage.ts`: существующие s3Client/resetS3Client, uploadVideo/uploadPhoto/readPhoto и buildObjectKey; сохранить exports и формат `projectUUID/randomUUID.ext`. `services/worker/src/storage.ts`: createS3Client/generatePresignedGetUrl; `config.ts`: loadConfig/WorkerConfig, добавить только `s3ForcePathStyle?: boolean`.

`apps/web/src/app/api/photo/[...key]/route.ts`: regex jpg/png/webp, sniffImage, 404 для других ключей/содержимого; сохраняется. `apps/web/tests/photo.test.ts` и worker transcribe unit regression уже существуют. `apps/web/tests/storage.test.ts` требует живой MinIO, выполняет CreateBucket/PUT без cleanup: не запускать с реальным Cloud.ru окружением. Новые targeted tests используют фиктивные credentials и перехваченный HTTP transport, не mock самого конструктора.

## Донор и ограничения
Изучены через GitHub API main `2b61adeea68f9fa7d316969db7738e5754dec8f8`: [client.ts](https://github.com/djd1m/clipmkr/blob/2b61adeea68f9fa7d316969db7738e5754dec8f8/packages/s3/src/client.ts) и [.env.example](https://github.com/djd1m/clipmkr/blob/2b61adeea68f9fa7d316969db7738e5754dec8f8/.env.example). Переносится только конфигурационный приём: region, forcePathStyle, оба WHEN_REQUIRED. Namespace middleware, StorageClient subclass, public signing client, timeout policy и ключи донора не нужны.

Endpoint/region/формат credentials сверены с [Cloud.ru API guide](https://cloud.ru/docs/s3e/ug/topics/api__getting-started) и [инструкцией ключей](https://cloud.ru/docs/s3e/ug/topics/api__api-key). Используются уже установленные AWS SDK v3, новые OSS зависимости не нужны. Секретные файлы не читались.
