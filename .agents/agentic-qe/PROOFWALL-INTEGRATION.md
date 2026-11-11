# Полная интеграция QE для Proofwall

Проверено 11.11.2026: upstream HEAD `98f241fc8b9d48d017cbdb63ab890104e30397d0`.
Полные инструкции — из этого GitHub commit; опубликованный runtime — `agentic-qe@3.15.19`
из npm, закреплён package-lock. Runtime не объявляется сборкой unreleased HEAD.
MIT notice — `LICENSE`, исходные файлы и SHA-256 — `UPSTREAM-MANIFEST.json`.

## Маршрутизация /feature-adr --full-qe

| Этап | Полный источник относительно этого каталога |
|---|---|
| 3 ADR/testability | skills/shift-left-testing/SKILL.md |
| 3.5 QCSD | skills/qcsd-ideation-swarm/SKILL.md |
| 6 план | agents/code-goal-planner.md |
| 8 независимое QE | skills/brutal-honesty-review/SKILL.md |
| 9 traceability | skills/qe-requirements-validation/SKILL.md |
| 9 риск | skills/risk-based-testing/SKILL.md |
| 9 интеграция | skills/enterprise-integration-testing/SKILL.md |
| 9 регрессия | skills/regression-testing/SKILL.md |
| 9 покрытие | skills/qe-coverage-analysis/SKILL.md |

Дополнительно установлены visual-testing-advanced/accessibility-testing и пять
штатных Codex entry skills aqe-{research,plan-work,plan-quality,test-change,review-quality}.
Все companion-файлы выбранных upstream skills сохранены. Ссылки на другие, неустановленные
upstream-инструменты не доказывают их доступность; для визуальных тестов выбран Playwright.

## Codex вместо Claude-only действий

Task/Skill/SendMessage и именованные Claude agents в upstream — инструкции о ролях,
а не существующие здесь инструменты. Запуски делать доступными collaboration tools,
с фактической матрицей docs/model-matrix.md. Максимум 4 одновременных агента включая
координатора; большой swarm исполнять волнами. Reviewer — новая сессия без истории автора.
Не заменять недоступную модель или непройденный gate авторской самопроверкой.

## Память и MCP

Локальный CLI: `npm run aqe -- ...`; MCP: `.codex/config.toml`, без npx @latest.
До AQE MCP tools вызвать fleet_init. Затем memory_query → memory_retrieve для каждого
найденного ключа: query возвращает ключи, не полное значение/confidence. При CLI:
memory search → memory get. Только после чтения value применять уроки; сохранять
подтверждённые выводы memory_store. Отдельно сохраняется проектный dz recall/teach.

Лексический persistent KV работает независимо от embeddings. Семантический поиск
не считать доступным, если vectorIndex.status=failed. Ошибка обучения не создаёт
успешную приёмку и не заменяет обязательные продуктовые gates.

## Хуки и ограничения

Проектные native Codex hooks: `.codex/hooks.json`; строгий guard — scripts/process-guard.mjs.
Upstream route/post-command не подключены: сохраняют исходные prompts/commands;
upstream stop безусловно пишет success=true. Это непригодно для доказательства приёмки.
Открытые протоколы можно читать уже сейчас; discovery установленных skills обновляется
со следующего хода, hooks/MCP — в новом проектном запуске после активации.

Не менять или регенерировать visual baselines ради прохождения тестов. Сначала отдельная
фиксация эталона и решение владельца, затем реализация и сравнение. Политика Proofwall
по этой границе имеет приоритет над upstream советом «первый прогон создаёт baseline».
