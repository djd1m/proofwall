# Авторская проверка default palette

Автор: gpt-6.1-sol / high. Режим: feature-adr --full-qe, S-tier.
Статус: авторские проверки завершены; независимое Astra review и итоговый receipt — координатору.

Владелец подтвердил дефект: живой новый проект с отсутствующим accent получал
старый purple #6701ef, хотя согласованный Proofo accent — #c8492f. Усиленные
границы #8e806b были единственной согласованной поправкой frozen-макета.
Исправлены только web default, widget resolver fallback и CSS fallback;
hex validator и явно сохранённые цвета работают по прежним правилам.

FR-301 → Agreed default accent / Newly registered project → readBranding →
ранний browser regression обычных registration/login/branding/collect/wall/config
routes без palette fixture. Проверяются input, button, mark, eyebrow, основной
branding heading (сохраняет frozen ink), collect heading, фон, card и border.
FR-302 → Invalid or missing widget branding → applyWidgetBranding/styles →
существующий malformed network branding тест и полная widget suite.
FR-303 → Saved purple and other custom accents → обычный Save/PATCH/reload →
browser проверяет #123456 и намеренно сохранённый #6701ef, включая SQL readback.
Только synthetic проект временно изменяется и затем удаляется harness.

Red получен до изменения production default на прежнем Next build:
новый проект показал #6701ef вместо #c8492f. Первый red-прогон также обнаружил
ошибку сценария preservation: Save неизменённого старого default не отправляет
PATCH. В финальном тесте первым сохраняется #123456, затем #6701ef; каждый
Save действительно меняет значение. Второй red timeout не считается дефектом продукта.

Прежний offline six-frame proof с явно заданной terracotta palette проверял
same-component layout/CSS, но не default живого проекта. Исторические отчёты
и snapshot не переписываются; они не доказывают исправление runtime default.
Новый focused evidence будет привязан к текущим source/log hashes отдельно.

K1 — реальная проверка reuse существующих tracked путей, отсутствия symlink и
канонических exports; новые production имена отсутствуют. K2 --tier=S
--require-requirements: exit 0, 2 предупреждения о не создаваемых S-tier ADR/
архитектуре, 3 явных skip (ADR coverage, Confirmation, acid corpus).
Admission: implementing, receipt null, новый plan/spec designDigest.
Source admission admitted; coder context complete до изменения product source.

Команды, exits, counts, SHA-256 logs/source и buildId сохранены в
evidence/author-checks.json и private .secrets/palette-fix-author-handoff.json.
Raw logs остаются в .secrets/palette-fix-*.log.

| Проверка | Результат |
|---|---|
| Focused branding/project-branding/widget-config/wall | 70 passed, exit 0 |
| Полная web suite | 960 passed, 3 skipped, exit 0 |
| Widget suite | 43 passed, exit 0 |
| Web + widget typecheck | exit 0 / 0 |
| Widget + настоящий Next build через allowlist runner | exit 0 / 0 |
| Полный runtime E2E, Chrome 148.0.7778.97 | 16 passed, exit 0 |
| Offline branding/collect, 3 viewport каждый | 6/6 zero-diff; 18/18 существующих font/margin/color controls обнаружены, exit 0 |
| Process check / test | exit 0; 63 passed |
| OpenSpec strict, K2 final, source admission, amendment-check, diff-check | exit 0; admitted; 2/2 amendments resolved |
| Исторические отчёты / frozen / globals / shared form CSS | git diff против HEAD пуст, exit 0 |
| Delivery | BLOCKED, фактический exit 2: stage=implementing, receipt=null |

Три skipped относятся к существующей storage.test.ts suite «живой MinIO»:
allowlist test-mode намеренно не передаёт S3_ENDPOINT. Настоящий SDK photo
upload/read и отказ/retry отдельно прошли в E2E с synthetic loopback S3.
Автоматическая accessibility-проверка: computed contrast, borders, labels,
errors/status/focus, reflow и strict-CSP widget в тех же 16 E2E. Это не manual AT.
Отдельного lint script у web/widget нет; Next build исполнил lint/type validation.

Обёртка process-прогона первоначально ожидала delivery exit 1, поэтому сама
завершилась с exit 1 после фактического корректного отказа 2. Отдельная проверка
под тем же flock подтвердила exit 2; это не продуктовый fail и не delivery pass.
Native guard также отклонил две смешанные shell-команды с записью private logs
и словом/путями reference; безопасно разделены назначения private patch и запуск.
Обхода guard и записи frozen-файлов не было.

Цикл recall → наблюдение/red/green → teach --project /home/proofwall --no-mirror
→ повторный recall выполнен; lesson ID teach:633edcc45425bf50. AQE KV сохранил
тот же урок; semantic vector index failed, semantic availability не заявляется.

Ограничения: авторский прогон не является независимым ревью. Screen-reader AT,
ручная приёмка владельца, receipt, PR и поставка не выполнены автором. Coverage
и новый mutation fleet не запускались для трёх fallback. Production DB/Caddy/
DNS/env, old landing globals и frozen reference не менялись.
