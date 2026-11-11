# Проверка full-QE и native Codex hooks

11.11.2026. Это evidence установки процесса, не приёмка приложения или visual parity.

## Источники

- GitHub agentic-qe HEAD на момент получения: `98f241fc8b9d48d017cbdb63ab890104e30397d0`.
- npm latest/runtime: `agentic-qe@3.15.19`; инструкции из HEAD и npm runtime закреплены
  раздельно. Восемь core SKILL.md совпали, planner взят новым из HEAD.
- 72 upstream файла: 9 core-протоколов (8 skills + planner), 2 дополнительных
  visual/accessibility skills, 5 штатных Codex entry skills и MIT license.
- SHA-256 manifest: `.agents/agentic-qe/UPSTREAM-MANIFEST.json`.
- `npm run process:install`: воспроизводит базовый harness + подключает Direct sources.
- `npm run process:check`: exit 0, конфигурация/hashes/runtime проверены.

## Runtime

`npm run qe:smoke`: exit 0. Проверен настоящий npm bundle:

1. CLI store/get/search/delete, разные процессы, temporary project memory.
2. MCP initialize / tools list / fleet_init / memory_store / query / retrieve / delete.
3. Read после удаления не находит synthetic key; temporary store удалён.

Semantic vector indexing: `failed`, embedder не настроен. Persistent KV/glob recall
работает; embeddings/semantic search не заявлены. Исполнение LLM fleet agents этим
smoke не проверялось. Полные QE-роли выполняются доступными cross-model сессиями.
Native MCP discovery текущего старого root-сеанса не изменилось; новый launcher
передаёт локальную MCP-конфигурацию явно.

## Нативные хуки: реальное включение и контрольный отказ

Codex CLI `0.167.1`, feature hooks=true. Первый новый запуск с одним лишь project trust
CLI override не загрузил project layer: hooks не сработали, отрицательная команда
выполнилась. Этот результат признан неуспешным, он не считается activation evidence.

Исправленный `bash scripts/codex-project.sh` передаёт проверенные `.codex/hooks.json`
явно в активный CLI config layer и запускает отдельный process (`--no-daemon`).
Для этой проверенной automation используется документированный per-invocation
`--dangerously-bypass-hook-trust`. Глобальный trust store, approvals и sandbox не меняются.
Обычный интерактивный CLI позволяет отдельный review/trust через `/hooks`.

Успешный диагностический запуск новой ephemeral-сессии Sol/high, 18:32 UTC:

| Native event | UTC | Наблюдение |
|---|---|---|
| SessionStart | 18:32:34 | Manifest/runtime проверены, handler реально вызван |
| PreToolUse | 18:32:36 | Безвредный printf разрешён и вывел marker |
| PreToolUse | 18:32:38 | printf с контрольным --update-snapshots запрещён ДО исполнения |
| Stop | 18:32:43 | Handler реально вызван; planned/inactive допускает ответ |

Проверены engine error `Command blocked by PreToolUse hook`, отсутствие command execution
у запрещённого marker и audit events. Сырой transcript не публикуется; audit хранит
только event/timestamp/decision, без prompts/commands/credentials. Native activation
доказана в отдельной проверенной сессии, не задним числом в текущем `/root`.

## Строгий допуск и границы

Guard executable tests — `npm run process:test`: позитивный fixture и реальные
отрицательные child exits, включая missing/stale evidence, failed visual report,
baseline replacement, неправильный upstream hash/runtime, symlink/traversal/empty
evidence и приватность audit. В чистой копии: 63/63 passed, без skips; перед ними npm ci --ignore-scripts и
npm run process:install завершились exit 0. Независимый reviewer проверил 61/61 и
ещё два новых readonly-сценария напрямую. Fixture не является proof visual/E2E продукта.

`npm run process:delivery` сейчас exit 2: stage=planned, receipt отсутствует. Before-code admission также закрыт. Это
преднамеренный закрытый допуск. Не создавались фиктивные passed reports приложения.
Непосредственное visual/E2E implementation и protected CI/deploy описаны в плане;
наличие локального guard не доказывает, что они уже выполнены.

Гарантия локальная и проверяемая: при использовании launcher/guard нарушающий вызов
отклоняется. Root/admin может изменить scripts/config/reports либо выбрать другой
путь. Защищённые GitHub checks и отдельные deploy credentials нужны для ограничения
такого обхода; абсолютная невозможность обхода не заявляется.

Повторный native smoke после основных исправлений, 18:40 UTC: SessionStart, один
разрешённый printf, отказ baseline-update и отказ product apply_patch, Stop.
Контрольный apps/web/.qe-guard-probe не создан. Две дополнительные readonly-формы
после этого проверены отдельно fixtures и reviewer.

## История попытки подключения GitHub CI

GitHub отклонил push `.github/workflows/process-guard.yml`: OAuth App не имеет
`workflow` scope. Проверенный файл сохранён локально; полный исходный commit
`71fefc3` сохранён веткой `local/full-qe-with-workflow`. Не объявляются выполненными
запуск Actions и required check/protection main. Остальная установка/документы могут
публиковаться отдельно. Пользователю предложен `gh auth refresh -h github.com -s workflow`;
после обновления авторизации — push workflow, настоящий CI и только затем required check.

## Последующее решение владельца: пока без GitHub CI

Ожидание workflow scope снято с блокеров. Тестирование, hooks, независимое ревью
и проверка delivery receipt остаются локальными на VPS. GitHub Actions и required
checks не включаются без нового поручения. Черновик перенесён из активного пути
.github/workflows/ в игнорируемый .reference/ci-drafts/process-guard.yml.
