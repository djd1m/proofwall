# Проектные Codex hooks и честный допуск --full-qe

В репозитории установлены `.codex/hooks.json` и `scripts/process-guard.mjs`.
Это проектные guardrails для локального Codex. Они не запускают QE и не создают
визуальную/E2E инфраструктуру. Наличие файлов и прямой прогон payload не доказывают,
что конкретный Codex runtime загрузил hooks. Для этого отдельно проверяются доверие
проектному `.codex/` слою, включённые hooks и фактическое отклонение безвредного
контрольного вызова в новой сессии.

11.11.2026 проверен запуск через `bash scripts/codex-project.sh exec ...`: wrapper
проверяет файлы, явно передаёт reviewed hook definitions через inline CLI TOML и
использует `--no-daemon`. В свежем child runtime зафиксированы SessionStart,
PreToolUse allow/deny и Stop; разрешённый printf выполнен, контрольный printf с
`--update-snapshots` отклонён до исполнения. Raw smoke output не коммитится.
В этой среде обычный CLI с одним лишь project-trust override не подхватил hooks.
Поэтому проверенный путь — проектный wrapper; прямой запуск Codex не считается
подтверждённой активацией. Per-invocation hook trust bypass применяется только после
проверки локальных определений и не меняет глобальное доверие/approval policy.

Используется текущий официальный контракт
[OpenAI Hooks](https://learn.chatgpt.com/docs/hooks): проектные hooks требуют trust,
`PreToolUse` возвращает явный `permissionDecision: deny`, `Stop` может продолжить ход.
Рекомендации по местоположению приведены в
[Advanced Configuration](https://learn.chatgpt.com/docs/config-file/config-advanced).
Эти hooks не устанавливают доверие и не обходят его автоматически. Нужен локальный
Node.js и доступный git; команды разрешают путь скрипта от git root и работают из
подкаталога. MCP настраивается отдельно в `.codex/config.toml`.

`SessionStart` проверяет непустой vendored manifest, SHA-256 каждого перечисленного
файла и точную версию локального `node_modules/agentic-qe/package.json`; затем добавляет
политику feature-adr `--full-qe`. Upstream skills из закреплённого commit и npm runtime
могут иметь разные версии: обе фиксируются в manifest, эта проверка их не смешивает.
При повреждении входа hook завершает ход с сообщением об ошибке.

SessionStart, check-config и check-delivery также вызывают
`validateQeInstallation(root)`: проверяют marker
`.agents/skills/.proofwall-installed.json`, hashes сгенерированного feature-adr,
Direct Mode routing всех пяти модулей и побайтовые копии upstream QE skills.
Отсутствующая/изменённая установка вызывает отказ; одного чистого vendor manifest
недостаточно. Установка выполняется через `npm run process:install`.

Для SessionStart/Stop вызывается только локальный AQE lifecycle CLI через локальный
Node.js из `node_modules/node/bin/node`, с пустым stdin и timeout 8 секунд. В start
передаётся только SHA-256-производный session id; prompts/tool inputs не передаются.
Полный stdout/stderr AQE подавляется. Поскольку upstream CLI может завершаться с 0
при ошибке, wrapper дополнительно проверяет initialized=true / stateSaved=true и
сообщает только reported-complete/failed/unavailable. Это служебный lifecycle,
не доказательство сохранения всех данных или прохождения QE. Штатные AQE route,
post-route и pre/post-command hooks не установлены: они могут писать raw inputs и
сообщать фиктивный success. Ошибка lifecycle не снимает отдельный delivery gate.

`PreToolUse` отклоняет автоматическую замену reference/baseline/snapshot файлов и
update-snapshots команды. Отдельного автоматического разрешения на замену baseline
нет: требуется отдельная рассматриваемая владельцем процедура. Наличие старого
receipt не разрешает его перезапись. Также hook проверяет receipt перед распознанными
командами runtime-поставки: deploy/publish/release, SSH/копирование,
Docker Compose up и распространённые deployment CLI. Для `npm run` раскрываются
локальные scripts (до четырёх вложенных переходов). Обычные правки процесса разрешены
при stage=planned. Payload рассматривается в памяти; полные tool_input, команды,
транскрипты и секреты не записываются в лог.

Patch payload принимается как строка или в command/cmd/input/patch; проверяются
назначения Add/Update/Delete/Move, включая snapshots/, __snapshots__/ и каталоги
Playwright `*.spec.ts-snapshots/`. Простые read-only cat/rg/grep/head/tail/ls/pwd/stat/wc
не считаются поставкой из-за имени deploy.md или искомого `--update-snapshots`.
Поддержаны простое `bash -c 'cat ...'` и узкая форма `node -p` с единственным
`require("fs").readFileSync("путь","utf8")`. Исключение не допускает shell chains,
redirects и substitutions; неизвестные mutating формы проверяются консервативно.
Это ограниченный разбор команд для исследования проекта, не shell sandbox.

git push и gh pr merge требуют receipt при activeProductChange=true или изменениях
apps/services/packages относительно merge-base HEAD/upstream (без upstream — HEAD),
включая untracked файлы. Для process-only source publication при неактивном продуктовом
изменении этот QE gate не нужен. Изменение флага не скрывает обнаруженный product diff.
Это исходный guard для proofo-ui; он не доказывает выполнение всех feature plans проекта.

До изменения продуктового кода `PreToolUse` проверяет write destinations
apps/services/packages (apply_patch, Edit/Write и распознанные shell writes). planned
всегда отклоняется. implementing/ready требуют implementationAdmission с текущими
планом, OpenSpec и K1/K2 evidence. Правка плана/spec инвалидирует допуск. Это проверка
зафиксированных checkpoints до кода, не автоматический исполнитель всех шагов плана.

Для проверки native runtime ведётся фиксированный локальный
`.agentic-qe/proofwall-hook-events.jsonl`: только event из SessionStart/PreToolUse/Stop,
timestamp и decision. Payload/session id и результаты AQE туда не пишутся. Этот
служебный log исключён из inputDigest. Symlink log/каталога запрещён.

`Stop` не мешает вопросам и текущей подготовке процесса: при planned или
activeProductChange=false он пропускает завершение. Для активной реализации без
валидного receipt он один раз возвращает `decision: block`. На повторном
stop_hook_active=true он завершает ход с явным blocker, чтобы не создавать бесконечный
цикл. Это не разрешает поставку: `PreToolUse` и check-delivery сохраняют блокировку.

## Состояние и receipt

Авторизованное состояние хранится в `features/proofo-ui/implementation-state.json`:

```json
{
  "schemaVersion": 1,
  "feature": "proofo-ui",
  "fullQe": true,
  "complexityTier": "unclassified",
  "stage": "planned",
  "activeProductChange": false,
  "requiredChecks": ["unit", "typecheck", "build", "integration", "e2e", "visual", "accessibility", "independent-review"],
  "receipt": null
}
```

planned и implementing всегда запрещают поставку. Для ready обязателен receipt с
issuedAt (ISO, не старше 24 часов), inputDigest и checks. Восемь проверок выше нельзя
удалить из requiredChecks; дополнительные проверки тоже обязательны, если перечислены.
complexityTier допускает unclassified/S/M/L/XL. До реализации/поставки требуется
классифицированный tier; XL дополнительно требует security и performance с реальными
passed reports. Значение unclassified разрешает только текущую подготовку planned.
Каждая запись checks[id] имеет status=passed, evidence (относительный путь) и
evidenceSha256. Evidence — непустой JSON с status=passed, exitCode=0 и фактической
command. Для visual и e2e обязателен непустой artifacts: массив относительных путей
к реальным непустым артефактам. Например:

```json
{
  "status": "passed",
  "exitCode": 0,
  "command": "фактическая команда конкретного запуска",
  "artifacts": ["относительный/путь/к/артефакту"]
}
```

Этот пример описывает формат, не результат приёмки. Получать реальные отчёты и
артефакты нужно из настроенных runners и независимого ревью; helper не генерирует
успешные receipts. Failed/skipped/inconclusive не являются passed. Evidence и
артефакты не могут быть symlinks, пустыми файлами или путями за пределами репозитория.

Для допуска реализации поле implementationAdmission содержит:
`plan: {path, sha256}`, `specifications: [{path, sha256}]` и
`checkpoints: {K1: {status, evidence, evidenceSha256}, K2: {...}}`.
План должен лежать в features/proofo-ui/, дельты — openspec/changes/.
K1/K2 report имеет status=passed, exitCode=0, фактическую command и designDigest.
designDigest — SHA-256 JSON массива `[path, sha256]` всех указанных plan/spec refs,
отсортированного по path через localeCompare. Report hash и designDigest должны
совпадать с текущими файлами. Это локальная аттестация; действительность авторства
и независимость review оцениваются отдельно. check-delivery тоже проверяет этот допуск.

inputDigest вычисляется из отсортированных пар path/SHA-256 для всех файлов
`git ls-files --cached --others --exclude-standard`. В него входят текущие код,
план, spec, процессные scripts/hooks, отчёты и артефакты, включая ещё не добавленные
в git файлы. Исключены сам implementation-state.json и пути `.env*`, `.secret(s)`,
credentials; они не читаются. Тестовые отчёты и артефакты обязаны лежать в nonignored
пути и входить в поставляемый набор: ignored вход вызывает отказ. Обычные нулевые
source/.gitkeep файлы хешируются как SHA-256 пустого содержимого; пустые evidence
и артефакты запрещены. Любая последующая правка входов требует повторной проверки.

```bash
node scripts/process-guard.mjs check-config
node --test scripts/test-process-guard.mjs
node scripts/process-guard.mjs digest
node scripts/process-guard.mjs check-delivery
```

check-config проверяет конфигурацию, обязательное состояние, vendor hashes и локальную
версию runtime, не продукт. check-delivery обязан завершиться с кодом 2 на текущем
planned: это нормальный закрытый gate. Не заменять этот отказ фиктивным receipt.
Перед trust bypass check-config требует ровно SessionStart/PreToolUse/Stop, одну
match-all группу и один синхронный command handler в каждой. Команда должна точно
совпасть с `node "$(git rev-parse --show-toplevel)/scripts/process-guard.mjs" hook`;
echo-замены, дополнительные events/handlers и restrictive matchers отклоняются.

Manifest: `.agents/agentic-qe/UPSTREAM-MANIFEST.json`, schemaVersion=1,
repository/commit, runtime={package:"agentic-qe",version:"точная версия"},
packages=[{name,version,root,files:{"относительный путь":"SHA-256"}}].
Пустой manifest, пустой пакет, несовпавший hash или недостающий runtime — ошибка.

## Проверка самого стража и границы

`scripts/test-process-guard.mjs` создаёт временный git fixture и запускает CLI отдельными
процессами. Негативные случаи требуют настоящего exit 2: missing receipt, stale digest
после новой продуктовой/плановой правки, failed visual report, пустое и symlink evidence,
повреждённый vendor, неверный runtime, удалённый обязательный check, baseline replacement,
update-snapshots и delivery без receipt. Есть валидный fixture с exit 0 и отдельные
проверки Stop/обычных docs changes, process-only publication, untracked product diff,
пустых обычных source файлов и отсутствия payload в audit. Отдельно проверены
input/patch payloads, snapshot paths, read-only research и отказ для chains/substitution,
поддельные hook definitions, повреждённая generated installation, typecheck/build,
unclassified и XL security/performance gates. Fixture явно не является
продуктовым evidence.

CI `process-guard.yml` выполняет npm ci --ignore-scripts по lockfile, затем
npm run process:install, check-config и мутационные тесты. Installer сначала проверяет
центральные vendor hashes, затем генерирует installation marker и копии навыков.
Manifest не перегенерируется, поэтому повреждение vendor не маскируется установкой.
Обязательные проверки этой
задачи не пропускаются. При diff в apps/services/packages дополнительно обязателен
check-delivery: CI сравнивает PR base SHA или push before SHA с github.sha, полученными
через env и проверенными как 40-hex. fetch-depth=0 обязателен; недоступная ревизия
вызывает отказ. Initial push с нулевым before проверяет весь product tree. Для
process-only diff проверка готовности продукта не нужна. Branch protection required
check отдельно; этот файл не объявляет его включённым. Это CI процесса; он не
подтверждает тесты приложения,
визуальное сходство, работающий preview и ручную приёмку.

Receipt — проверяемый локальный документ, не криптографическая аттестация выполнения
плана. Автор с правом записи может подделать state/report/manifest или отключить hooks;
shell-команды допускают обход эвристик, интерактивный stdin и часть tool paths не
перехватываются. Не все ошибки самого hook runtime гарантированно блокируют tool.
Для гарантии вне дисциплины агента нужны защищённые CI/branch/deployment rules и
независимое одобрение того же артефакта. Здесь они не объявлены настроенными.
Переход ready и production разрешение не возникают автоматически от hooks.
