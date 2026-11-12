# Кабинет проекта Proofo — сложность

Статус: оценка архитектора; gates не выполнялись. Tier: **L**, Direct `--full-qe`.
База `5513c574c5406e017d3e210ee1c4bb0704752144`.

| Измерение | Оценка | Обоснование |
|---|---|---|
| Files | L, 24 targets | Loader/view/CSS + семь current capability modules + visual/live/integration tools/tests |
| Domains | L, 4 связанных контекста | Owned project/auth, intake/moderation, presentation/install/share, account billing/password status; backend contracts повторно используются |
| Integrations | S, 0 новых | Existing PostgreSQL/RLS, storage и transport; QA synthetic only |
| Breaking/API/schema | S, 0 | Routes/payloads не меняются, migrations нет |
| Risk | L | Потеря onboarding/paid/security capabilities при визуальном переносе и ложное fixture evidence |

Итог L по риску и затрагиваемым границам. S/M недостаточны; XL не обоснован без новых backend подсистем. Если цели превысят 30 файлов или потребуется новый OCR/scraping — пересмотр scope/requirements/tier до source write. Активны шаги 0–9, research/domain/architecture, Direct QCSD, K1/K2/native checkpoints, cross-model review и fleet.

## Acid corpus

| Token | Заведомо плохой вход / поведение | Ожидаемый отказ / oracle |
|---|---|---|
| A1 | Foreign/inactive project или withService вместо withAccount | 404/no disclosure; actual SQL role+tenant GUC assertion fails |
| A2 | Unknown email_delivery + потеря /verify-email при reload | Нет HTML/query injection; persistent recovery test fails при удалении |
| A3 | UI обещает OCR/link extraction/20-file scan | Honesty DOM/API assertion fails; manual+CSV остаются |
| A4 | Upload/CSV network500/503/quota или duplicate retry | Ошибка без success; pending/provenance и counts корректны |
| A5 | Invalid/conflicting moderation, stored XSS/source URLs | State не меняется ложно; full text escaped; all valid transitions retained |
| A6 | Empty project gate скрывает links/snippet, wrong origin | Immediate-link and actual origin assertions fail |
| A7 | Expired paid показан paid; checkout canceled/retry; N3 disabled | Effective-tier/status/error flow корректны, внешних вызовов нет |
| A8 | Share cancel либо viewing snippet считается installation | Нулевой outbound/метрика, completion по persisted install |
| A9 | Password mismatch/cancel/error, stale session | Ошибка/cancel без mutation; success revoke+reissue exact semantics |
| A10 | Default/live CSS purple leakage или custom accent в product chrome | Computed default/custom runtime colors fail; public custom remains |
| A11 | Long name/URL/text/filename/error, narrow viewport | Полный content/controls без page overflow; focus/contrast oracle |
| A12 | Изменение original baseline, copied fixture, font/margin/color mutant | Hash/capture/same-view tests отказывают; no Next fixture route |
| A13 | Nonallowlisted QA env/ports/provider, real mail/payment | Exact-port/lock/suite runner refuses before spawn; scoped Node/browser synthetic attempt observed+denied; unobserved native/OS traffic не покрыт |

Model provenance: координатор подтвердил actual collaboration.spawn_agent для `/root/project_architecture`: fork_turns=none, configuredModel/modelFromSpawn=`gpt-6-astra`, reasoning_effort=`xhigh`. Provider-reported runtime/usage telemetry недоступна (null), не выводится из матрицы. Тесты/серверы архитектором не запускались.

QCSD rework:4QA targets добавлены к прежним20, итого24 (L). A13 теперь означает конкретные контролируемые Node JS transports/guarded children и browser-context requests с negative probes по05, не firewall всей ОС.13origin corrections предложены, independent verification pending; owner decision/K1/K2/admission pending.
