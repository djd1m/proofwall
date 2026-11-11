# Работа над Proofwall

Источник методики — `djd1m/clipmkr`, main `59361e07dc1eec69e2daac5783f1ab1ac18b80c5`.
Адаптация 11.11.2026: самостоятельный репозиторий, свои требования и один GitHub origin.

## Подготовка

```bash
cd /home/proofwall
npm ci
npm run process:install
npm run dz -- --version
npm run openspec -- --version
```

Проект требует Node.js ≥22. В этой копии devDependency `node` закреплена на 22.23.4;
после npm ci все npm scripts используют её автоматически. Для прямых команд Node
можно выполнить `export PATH="$PWD/node_modules/.bin:$PATH"`.
Проект уже подготовлен: повторять установку перед каждой задачей не нужно.

Установлены: harness-cli 0.8.58, skills-feature-adr 1.5.25, OpenSpec 1.15.0.
`process:install` применяет два patch из Clipmkr: Next.js `[slug]`/`[...key]` в target
путях плана и name-check исходников обычного приложения. Затем `dz init --target codex`
устанавливает 9 базовых навыков в `.agents/skills/`. Флаги `--no-hooks --no-integrations`
относятся только к генератору harness: затем `install-qe-skills.mjs` подключает полные
QE-протоколы из закреплённого upstream HEAD. Native Codex hooks и локальный MCP заданы
в `.codex/`; глобальные настройки не меняются. Режим продуктовых работ — `--full-qe`.
Повторный запуск допускается; после npm ci patches применяются заново.
Старые `/next`, `/plan`, `/go`, `/feature` родительского монорепозитория не установлены.

## Один блок работы

1. Прочитать AGENTS, контекст, приёмку и применимые правила. Сообщить план/роли/проверки.
2. Выполнить релевантный recall. Создать `features/<slug>/00_complexity_assessment.md`
   по локальному feature-adr; состав документов определяется сложностью и риском.
3. Зафиксировать дельту OpenSpec с проверяемыми сценариями и FR mapping с hash.
   Исторические SPARC-файлы остаются исходным контекстом, не заменяются требованиями Clipmkr.
4. Подготовить reuse inventory, применимые ADR/QCSD/архитектуру и план.
   Выполнить реальные gates/checkpoints/K1/K2 по установленному навыку.
   Для UI получить согласование конкретного макета; необходимые решения записать с версией.
5. Реализовать допущенный план; пройти подходящие тесты, расширенный QE и независимое
   ревью другой моделью. Мутационные прогоны нужны для новых стражей/критических инвариантов.
6. Сверить FR → spec → код → доказательства, ограничения и фактическое окружение.
   После ручной приёмки согласованно синхронизировать/архивировать OpenSpec-дельту.
   Статус документа или gate не означает, что приложение работает.

```bash
npm run dz -- recall "<тема>" --project /home/proofwall --limit 3
npm run openspec -- list --changes --json
npm run openspec -- validate <slug> --type change --strict --no-interactive
```

Store `.dz/` не коммитится. Исторические telemetry/receipts сохраняются, но не используются
как результаты текущего запуска. В новом отчёте указывать фактические команды, коды,
модели, SHA и пробелы. Для исправления принятого замечания применять цикл recall/teach/recall.

## Проверки и окружения

```bash
node .claude/hooks/check-ports.cjs .
bash scripts/check-port-conflicts.sh .
bash scripts/check-env-wiring.sh
npm test
npm run typecheck
npm run lint
npm run build
```

Перед прямой командой node использовать проектный PATH, как выше. Интеграционные тесты
требуют отдельные Postgres/MinIO и тестовые переменные — `docs/REPRODUCE.md`.
Не запускать production-миграции ради проверки переноса. Для нового кода выполнять
обязательные проверки по риску; ошибки и skips не превращать в успешную приёмку.

На первом этапе переноса выполнялись только проверки репозитория/инструментов.
Позже поднят HTTPS-тестовый стенд sslip.io и подключён Cloud.ru S3; старые утверждения
документов о неразвёрнутом приложении относятся к первому этапу, не к текущему runtime.

## Полный QE и строгая приёмка UI

Источники/маршрутизация — `.agents/agentic-qe/PROOFWALL-INTEGRATION.md`, полный план —
`features/proofo-ui/06_team_execution_plan.md`. Базовые команды:

```bash
npm run process:install
npm run process:check
npm run process:test
npm run qe:smoke
bash scripts/codex-project.sh
```

Launcher сначала проверяет локальную конфигурацию и целостность установленного
feature-adr/Direct routing; использует документированный
per-invocation automation режим hook trust для проверенных локальных definitions,
без изменения глобального trust store. Обычный CLI допускает review/trust через `/hooks`.
Старый root-сеанс не получает проектные hooks/MCP задним числом. Подготовленная
конфигурация, проверка handler напрямую и наблюдённый native event — разные факты.

`process:delivery` по умолчанию отказывает: UI stage=planned, receipt отсутствует.
CI проверяет процесс/негативные тесты; фактические visual/E2E jobs добавляются до
реализации UI. Protected branch и отдельный deploy runner пока не установлены:
локальные JSON/hook scripts не являются защитой от администратора root.

## Что адаптировано, а что осталось историей

- Текущий процесс: `AGENTS.md`, этот файл, `docs/review-policy.md`, `docs/model-matrix.md`.
- Продукт: собственные `CLAUDE.md`, `docs/Specification.md`, `docs/Architecture.md`,
  `docs/Pseudocode.md`, `docs/ADR.md`, `.claude/feature-roadmap.json`.
- Общие правила инфраструктуры импортированы локально в `.claude/rules/`; проектные
  агенты и правила N1 сохранены. `check-ports.cjs` и общие shell-проверки теперь локальные.
- Старые отчёты, telemetry, LESSON-01 и вложенные README сохранены как история.
  Упоминания путей монорепозитория внутри них не являются текущими командами запуска.
- Матрица и порядок приёмки заимствованы; тарифы, домены, Cloud.ru-настройки,
  production-данные и GitLab/GitVerse mirrors Clipmkr сюда не перенесены.

Полный источник переноса и статус — `../migration/2026-11-11-import.md`.
