# Независимый QE Cloud.ru storage

Дата: 2026-11-11. Вердикт: CLEAN в согласованном узком объёме исходного кода; замечаний, требующих исправления, не выявлено. Это не приёмка реального Cloud.ru или опубликованного стенда.

Роль `qe-primary`, family `codex`; отдельная сессия `/root/cloudru_code_review`, `fork_turns=none`. Модель reviewer по параметрам запуска координатора: `gpt-6-astra xhigh`; coder по подтверждению координатора текущим tmux UI: `GPT-6.1-Sol high`. Reviewer самостоятельно UI coder не проверял. Предыдущие авторские отчёты не использованы как доказательства.

Прочитаны AGENTS, контекст и workflow, review-policy, базовая CJM-приёмка, применимые правила, требования FR-1…FR-6, ADR-001, архитектура, план и нормативная OpenSpec-дельта. Recall выполнен; совпадений нет. Использован формат receipt локального feature-adr. Проверены git diff и текущие три storage/config файла, два новых storage-cloudru теста, Compose, пример окружения и инструкция. Маршрут фото прочитан как неизменённая зависимость; diff маршрута, sniffImage и package manifest/lock пустой. Проверенные изменённые файлы совпадают с SHA-256 host snapshot.

| Требования | Независимое доказательство |
|---|---|
| FR-1 | Web использует заданный endpoint/region, virtual-hosted при `false`, оба WHEN_REQUIRED. SDK presign проверяет host/region/TTL; перехват request handler проверяет сериализованный PUT фото, отсутствие необязательных checksum/ACL и сохранение байтов PUT/GET. |
| FR-2 | Worker использует опциональное поле с legacy default true; loadConfig false/true/отсутствие, старый WorkerConfig, точный key/region и TTL 123 проверены тестами. Формула исходного TTL 600 и getSignedUrl не изменены. |
| FR-3 | Код генерации ключей и exports сохранены; оба bucket допускают `proofwall`. Новый web-тест проверяет разные UUID, отказ `.mp4` и не-image bytes. Неизменённый фото-маршрут сохраняет jpg/png/webp, sniffImage, nosniff/CSP и 503. |
| FR-4 | `docker compose --env-file /dev/null -f docker-compose.yml config --format json` с фиктивным окружением подтвердил region/style web и worker, отсутствие MinIO и зависимостей от него. С `--profile local-storage` сервис MinIO присутствует. |
| FR-5 | Пример оставляет S3 credentials пустыми; инструкция задаёт формат и путь ввода владельцем. Только metadata: `git check-ignore .env` подтверждает ignored, `stat` — mode 600. Содержимое `.env` не читалось. |
| FR-6 | Результаты ниже разделены с runtime; реальный bucket, credentials и медиа-CJM не проверялись. |

Независимые прогоны с очищенным окружением `env -i`, локальным Node из node_modules/.bin и фиктивными S3 значениями:

- `npm test --workspace @proofwall/web -- tests/storage-cloudru.test.ts`: **5/5 PASS**.
- `npm test --workspace @proofwall/worker -- tests/storage-cloudru.test.ts`: **3/3 PASS**.
- Compose без MinIO-профиля и с профилем: **PASS**; контейнеры не запускались.

Оценка новых рисков: в проверенном diff новых дефектов границ медиа, ключей, TTL, конфигурации или необязательного MinIO не выявлено. Доказательства — непосредственное чтение кода, восемь целевых assertions-сценариев и нормализованный Compose. У worker проверена подпись и настройки SDK, отдельного HTTP capture в его тесте нет; он только подписывает GET. Позитивный photo regression, отдельный uploadVideo capture, mutation, full suite, lint/typecheck/build в этом ограниченном независимом проходе не запускались; результаты автора им не подменены.

Cloud.ru runtime, фактическая private policy и права ключей, сетевой доступ и медиа-CJM: **NOT VERIFIED / PENDING**. Это известная зависимость от ключей владельца, не исходный дефект. Ни запросов к реальному bucket, ни полного storage integration с CreateBucket/PUT не выполнялось. Более широкая sslip-поставка и остальные файлы host manifest не являются объёмом этого заключения; известный preflight на собственном 443 уже объяснён в инструкции и новым блокером не считается.

Snapshot nonce: `b7f017d8-2bf2-43da-98fa-dfc9b5119c63`. Revision: `58c4c18dfae44e65f906e8733f24d4810dc7ffb59c16420f84d83de97c4cada2`.

## Focused проверка после изменения ignore-правил

После первоначального QE изменены только `.gitignore` и `.dockerignore`: защитные маски `*.swp`, `*.swo`, `*~`; Git также исключает `features/**/.fa-state/*.lock`. `..env.swp` исчез из измеряемых путей вследствие игнорирования, содержимое файла не читалось и файл не удалялся. Прочитан настоящий author handoff координатора, structural-классификация и оценка новых рисков подтверждены независимо.

`git check-ignore -v` подтвердил исключение swap, synthetic swo/backup и feature lock. Для Docker выполнена отдельная сборка synthetic scratch-контекста с точной копией `.dockerignore`: контрольный `keep.txt` присутствует в экспортированном образе, synthetic `..env.swp`, `review.swo`, `review~` отсутствуют. Контейнер только создан для export и не запускался; временные image/container удалены. Первый вариант проверки с `--output` не поддержан установленным legacy builder; затем успешно использован build/create/export. Реальный проект как build context не передавался.

Digest обоих ignore-файлов и пяти storage/config/test файлов совпадают с текущим host; последние пять совпадают с исходной ревизией QE. Повторные прикладные тесты не нужны и не выполнялись. Вердикт остаётся CLEAN в заявленном объёме; новые риски не выявлены. Состояние HTTPS не использовано как доказательство S3. Реальный Cloud.ru и медиа-CJM по-прежнему **NOT VERIFIED**.

Актуальный snapshot nonce: `9d8de685-6ef4-4628-abae-fb55fbea7ad3`. Revision: `9d4fc7829ca6d43d0856f3ec8a557e385c20978d8d572c965f8e8e39f1e7b797`. Свой receipt перепривязан; author и чужие entries сохранены. `authorAssessmentChecked=true`, structural `deltaVerification.implementationVerified=true` относятся только к самостоятельно проверенной дельте выше.
