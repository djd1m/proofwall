# Cloud.ru storage: план текущего исполнения

Подготовлены M-tier assessment, 6 требований с OpenSpec SHA-256, reuse inventory, один ADR, reference QCSD assessment, light architecture и план с 9 code targets. Код, конфигурация и секреты этой planner-сессией не изменялись. Доступ к бакету и работа приложения не заявляются.

## Фактические проверки 11.11.2026

- `npm run dz -- recall "Cloud.ru S3 хранение Proofwall совместимость web worker" --project /home/proofwall --limit 3`: exit 0, совпадений нет.
- `npm run dz -- name-check --module storage-cloudru --project /home/proofwall`: exit 0, FREE. Имена новых экспортируемых функций/команд отсутствуют; scope исходного запуска исключал services, поэтому выполнен дополнительный basename check с services root (см. вывод текущей сессии).
- Дополнительный `--module storage-cloudru.test --source-root /home/proofwall/services --json`: exit 2, NOT ESTABLISHED (`unsupported-source`, partial sweep); этот результат не считается свободным именем. Более узкий worker-root проверен отдельной командой в текущей сессии; окончательный K1 требует полного подходящего scope.
- `node_modules/.bin/node .agents/skills/feature-adr/scripts/check-plan-completeness.mjs features/cloudru-storage --tier=M --require-requirements`: exit 0, `K2 plan-completeness: PASS (0 failure(s), 0 warning(s), 1 skip(s))`. Все 6 FR связаны с задачами, один ADR, 9 targets; C4 skipped — отдельный acid corpus не заявлен.
- `npm run openspec -- validate cloudru-storage --type change --strict --no-interactive`: exit 0, `Change 'cloudru-storage' is valid`.

Независимый Step 3.5 swarm/convergence: **NOT ESTABLISHED**. Coordinator продолжит с тремя core-ролями; авторская reference-оценка их не заменяет. Независимое cross-model review кода, тесты/build и runtime ещё не выполнены. Новые findings требуют поправки плана и повторного K2. Установленный skill доступен; указанный им `.claude/shards/feature-adr.shard.md` отсутствует.

Ключи добавляет владелец в `/home/proofwall/.env`, mode 600, ignored: `S3_ACCESS_KEY=<tenant_id>:<key_id>`, `S3_SECRET_KEY=Key Secret`. Endpoint `https://s3.cloud.ru`, region `ru-central-1`, forcePathStyle false; оба bucket `proofwall`, private. Интеграционный storage suite не запускать с реальным endpoint; новый probe исключён. После ключей нужна отдельная runtime/CJM проверка.

## Подготовленная реализация и стенд, 11.11.2026

Web/worker поддерживают Cloud.ru region/style/checksum, оба bucket настроены на proofwall;
ключи вводит владелец в /home/proofwall/.env. Новых exports, object keys и DB schema нет.
MinIO optional; локальная сборка MinIO отменена по уточнению владельца и удалена.
K1 дополнен проверенным побайтово snapshot services под apps/ в /tmp:
name-check storage-cloudru.test вернул FREE, exit0, полный sweep33 исходников.
K2 PASS; три настоящих QCSD core receipts закрыты (closed). Независимое source QE
и focused review editor safeguards завершены другой моделью (gpt-6-astra xhigh);
автор подтверждён tmux UI как GPT-6.1-Sol high. Подробности и ограничения в08_qe_report.md.

Проверки автора: 1026 regression tests PASS на отдельной proofwall_test БД,
3 живых S3 теста SKIPPED без облачного окружения; targeted web/worker32 PASS;
typecheck PASS; npm lint exit0 (workspace lint scripts отсутствуют); Docker build
web/worker PASS со второго запуска (первый прерван transient next/font download error);
env wiring PASS, OpenSpec strict valid. Текстовый CJM без фото прошёл по публичному
HTTPS адресу, TLS verify0. Полный медиа-CJM не прошёл без ключей — это не PASS.

Адрес: https://proofwall.78.17.53.233.sslip.io/. Новая база имеет20 миграций;
старые данные не переносились. Worker не запущен: его конфигурация требует настоящие
S3 credentials. Transcribe/почта/Yandex/платежи не настроены. Реальный Cloud.ru upload/read
и запуск worker ожидают заполнения S3_ACCESS_KEY и S3_SECRET_KEY владельцем.
Приёмка интеграции до этого НЕ завершена, production/DNS не переключены.

## Проверка после ввода ключей

11.11.2026: web/worker пересозданы с пользовательскими credentials.
Cloud.ru отвечает403 AccessDenied на HeadBucket/ListBuckets/PUT. Тестовое фото
не записано. Virtual-hosted запрос давал404; runtime выбрана path-style=true
для базового имени bucket. Код обоих вариантов покрыт существующими тестами.
Нужно проверить tenant_id и разрешения субъекта ключа на proofwall.
Source checks остаются пройденными, live storage acceptance остаётся FAILED/ожидает исправления доступа.
