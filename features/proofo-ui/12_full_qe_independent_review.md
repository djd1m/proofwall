# Независимое ревью установки QE, hooks и плана

11.11.2026. Автор установки/guard: Sol/high; исследование upstream: отдельный
Astra/xhigh. Независимый reviewer: `gpt-6.1-terra xhigh`, новая сессия
`/root/full_qe_process_review`, без истории авторского кодирования. Этот файл —
запись полученных результатов координатором, не новая авторская независимая проверка.

## Находки и закрытие

| Severity | Находка | Исправление | Focused verdict |
|---|---|---|---|
| P1 | Payload input/patch не покрыт при разборе apply_patch | Все поля/mixed payload + отказ при неразбираемом patch | Закрыто независимым reviewer |
| P1 | snapshots/ и Playwright *-snapshots не защищены | Расширено распознавание, негативные tests | Закрыто |
| P1 | Сгенерированный feature-adr/Direct routes не проверялся | Marker с hashes + проверка всех upstream installed skills; launcher/SessionStart/delivery требуют его | Закрыто |
| P1 | Поддельная hook command проходила trust precheck | Точная whitelist command, ровно 3 events/1group/1sync handler, match-all | Закрыто |
| P2 | Read-only команды ошибочно запрещались | Узкие безопасные формы cat/rg/bash-c/node-print/sed-print/python-read; mutators остаются gated | Закрыто |
| P2 | Для XL не перечислены security/performance | Plan+state+guard требуют отдельные evidence; complexity фиксируется до кода | Закрыто |

Reviewer также самостоятельно сверил GitHub tree: 72/72 upstream файла совпадают,
поддеревья восьми core skills полные; planner актуальный. Runtime 3.15.19 честно
отделён от GitHub HEAD. Самостоятельно проверил CLI/MCP smoke: passed KV и протокол;
semantic index failed и LLM-agent execution not-tested не скрыты.

Повтор: 61/61 executable tests независимо; два последних кейса sed/python reviewer
проверил прямыми вызовами. Координатор отдельно выполнил clean install/test: 63/63.
Настоящие native engine отказы проверял координатор, не reviewer; их evidence отдельно
в 11_process_verification.md. Разрешённый printf исполнился, запрещённые baseline command
и product patch не исполнились; synthetic product file отсутствует.

## Остаточные границы

Guard — эвристика для известных tool/shell routes, не полноценный shell sandbox.
Root/admin способен переписать конфигурацию, локальные attestations или сам guard.
Отсутствие продуктовых visual/E2E evidence означает закрытый delivery gate; прохождение
тестов самого guard не является UI parity, product QE или ручной приёмкой. Внешний
required GitHub check и отдельный deploy-runner имеют самостоятельную конфигурацию.

## SHA-256 проверяемой финальной редакции

```json
{
  "scripts/process-guard.mjs": "e93b6f4ebcd4d1515d416752b5e9fc5e39ae1fe00d749f00cd8663aa71375b1a",
  "scripts/test-process-guard.mjs": "95b7fc08559cc61b2e88dde74c9bfafbc7b74a0372777bdb82ae79e0fa53a2f1",
  "scripts/verify-qe-installation.mjs": "cef5b126e1b9adf09f49bc56c0a82a7eff2cf5b970a4ae270c80f377603c39d4",
  "scripts/install-qe-skills.mjs": "1f7e8ded3c6714b04b707a1abc45412425a6833e123c8e43a004496205fa64f8",
  "scripts/codex-project.mjs": "51c1a3d9c998997748c746a4318e372720bb19d127f56b2a4aa9f289645fed8a",
  ".codex/hooks.json": "e2ac84d3be7b74d19eed8668a902e0de62e163de3ee111b74379b18c1efd1b1d",
  ".github/workflows/process-guard.yml": "b1e20071150499ca132d936d4a0aa84132c0a5c83fcbcb48b88af6a969b9e403"
}
```
