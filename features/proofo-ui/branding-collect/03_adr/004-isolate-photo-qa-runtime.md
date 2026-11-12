# ADR-004: Запускать photo QA отдельным runner с synthetic local S3

## Status
proposed для QCSD; до admission обратимо. NFR-203, FR-205, FR-206, FR-209.
Пересмотреть при изменении локального QA resource contract, не по факту наличия remote keys.

## Context
На source baseline 4da1c64 `run-dashboard-preview.mjs` удаляет все S3_*.
Это допустимо для dashboard, но не позволяет доказать product photo upload/read.
Stable dashboard preview уже работает из отдельного artifact и не должен изменяться.

## Decision Drivers
Высокий: настоящий product adapter, отсутствие remote writes/secrets, isolated resources.
Средний: минимальное расширение tooling без новой инфраструктуры продукта.

## Considered Options
| Вариант | Сильная сторона | Цена/ограничение |
|---|---|---|
| Новый dedicated runner с synthetic local S3, выбран | Full SDK pipeline, контролируемые faults, stable preview не меняется | Нужны отдельные QA ресурсы и env validation tests |
| Reuse dashboard runner + mocked upload | Не нужен новый runner, быстрые unit tests | S3 env удалён, full photo E2E не доказан |
| Разрешить существующие реальные S3 credentials | Проверяет remote provider configuration | Затрагивает реальные объекты/секреты, выходит за авторизованный QA scope |

## Decision
Добавить только `scripts/run-branding-collect-preview.mjs`; old runner неизменен.
Читать `.secrets/branding-collect-test.env` после realpath/lstat, regular-file,
ownership и private mode checks (directory 0700/file0600; no symlinks).
Явный allowlist child env, без spread process.env/settings. DATABASE_URL только
loopback postgres `/proofwall_ui_test`, origin только loopback HTTP. Координатор
выделяет отдельные PG/app/S3 endpoints; runner проверяет занятые app ports до spawn.
Совпадение DB name с dashboard QA само по себе не означает isolation.
S3 endpoint loopback HTTP/path-style, QA bucket, фиксированные synthetic credential
sentinels; никаких inherited AWS/Cloud/Resend/OpenAI/YooKassa keys. VIDEO_INTAKE_ENABLED=false.
Команды check-env/test/typecheck/build/start/e2e — явный whitelist; snapshot-update
и произвольные shell commands отвергаются. Env values и URI с credentials не печатать.
Local S3-compatible test service проверяет SDK PUT/GET, bytes и отказ 503; никаких
production HTTP seed routes. Runner не управляет stable artifact/процессом и не
создаёт/удаляет БД. При отсутствии выделенного QA service tests BLOCKED, не mock PASS.

Операционный план координатора: новый PostgreSQL container с database proofwall_ui_test
на 33186, app http://127.0.0.1:33187, synthetic S3 http://127.0.0.1:33188,
optional offline fixture 33189. Это canonical QA env inputs, не обязательные hardcoded
числа в product/runner. Старые 33181/33182 и public preview 33183 не трогать.
Runner e2e mode запускает существующий planned E2E file; setup/before в нём поднимает
synthetic local S3 и Next child с validated env, ждёт readiness. finally/after закрывает
только созданные этим run handles/processes и синтетические fixtures. При partial setup
failure cleanup всё равно выполняется; нельзя pkill/stop по совпадению порта/имени.
PG provision/cleanup выполняет координатор отдельно; runner не присваивает себе старую QA БД.

## Rationale
Разделён runner и среда; product storage adapter остаётся настоящим. Один новый tool
target и tests в уже запланированных schema/E2E файлах удерживают scope в 30 targets.

## Consequences
Плюс: можно воспроизвести upload/read/failure/retry без реальных объектов и затрат.
Минус: local S3 не доказывает текущее состояние Cloud.ru; provider-specific SDK
unit regression остаётся отдельным evidence. After-action: QA координатор после приёмки.

## Confirmation
- Method: pure config validation negatives + runner-driven isolated browser E2E.
- Load-bearing property: никакие remote endpoints/real keys/stable resources не используются.
- Required automated check: `branding QA runner refuses unsafe configuration` в
  `apps/web/tests/branding-collect-schema.test.ts`; `collect uploads and reads local photo`
  в `tools/visual/branding-collect.e2e.test.mjs`.
- Monitoring: собственные QA summaries только whitelist status/hash/count/validated endpoint
  class; без payload/secret/photo key. Inherited raw legacy unit output отдельно помечается
  synthetic и может содержать synthetic keys; real credentials/payloads запрещены всегда.
  NFR-202 не обещает исправления existing photo GET logger или global raw-log no-key.
- Success metric: unsafe config→nonzero до spawn, реальные local SDK bytes round-trip,
  storage failure→503/retry, никаких external requests. Owner: автор и независимый QE.
