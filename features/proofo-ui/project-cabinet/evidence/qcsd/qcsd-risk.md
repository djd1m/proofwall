# Независимое QCSD: риск-шторминг project cabinet

**Вердикт: CONDITIONAL.** Два структурных условия HIGH: конкретизировать и связать с проверкой границу сетевой изоляции QA (RISK-01) и фактический запуск проектных E2E/mutation с точными портами и общим lock (RISK-02). Наличие этих находок не означает обнаруженную утечку или ошибку будущего продукта. До любого product source write также необходимо отдельное решение владельца о конкретном preview, filled/control states и границах визуального сравнения; оно уже явно предусмотрено требованиями и не выдаётся здесь за новый дефект или полученное согласие.

## Происхождение и границы

Независимая роль `qcsd-risk` / upstream `qe-risk-assessor`: фактическая конфигурация передана координатором при spawn как `gpt-6.1-terra`, `xhigh`, `fork_turns=none`; provider telemetry недоступна, это не наблюдаемый provider model ID. Автор архитектуры — отдельный `gpt-6-astra/xhigh`, fork none, по переданному provenance. Прочитан полный файл через `git show 98f241fc8b9d48d017cbdb63ab890104e30397d0:.claude/agents/v3/qe-risk-assessor.md`; SHA-256 `2209955b10105256a2ea4d6fd4cd8a4a57712ce2d79b7243b9f5424cd33db2d3` совпал с `role-references.json`. Прочитаны локальные integration, политика/model matrix, полный `qcsd-ideation-swarm`, steps 02/03 и полный `risk-based-testing`. Внешний advisor, код, tests, runtime, network/providers и AQE memory не вызывались: прямой brief запрещает provider calls и запуск кода; поэтому независимые history/weights и persistence недоступны. Нет оснований для ML-прогнозов, покрытия, времени или вероятности инцидентов в процентах. Нет утверждения о выполнении остального swarm или gate.

**EXECUTED:** `sha256sum` восьми файлов manifest; все восемь совпали с `prepared.json` (см. таблицу). Нормативная spec независимо хэширована и совпала с FR-привязкой. Это проверка bytes, не product тест. **STATIC** ниже означает наблюдение при чтении названного источника; **INFERRED** — возможное последствие, а не подтверждённый дефект реализации. Код и серверы не запускались; все тестовые стратегии будущие.

| Измеренный host path (от `features/proofo-ui/project-cabinet/`) | SHA-256 |
|---|---|
| `00_complexity_assessment.md` | `86e6ca35254d7fe7defc12d068e597b84d3f2b60a21c41d6259582b00bc1007d` |
| `01_requirements.md` | `572d68fb62307f755824d09d1e55cbfe3c2df9389c10de6b165ec2366b660a53` |
| `02_research.md` | `d15adf498857d82350df96822626444e896f8451c85c114f3554b64f2d5a6ba0` |
| `03_adr/001-reuse-owned-project-capabilities.md` | `fb4ef2e82a09d3449203691f629b191dd3ad46b155ab6bb234f3296e09f69375` |
| `03_adr/002-scope-cabinet-palette-and-interaction.md` | `68287d023834f6194860bfa3f220cf1a1ef61ff69b805de3918427ccd8c53556` |
| `03_adr/003-separate-original-reference-from-live-adaptation.md` | `1028ab4bfd082c82bc742eb909a368fb0a7739cc5a7bb1167308747c25e97c29` |
| `04_domain_model.md` | `c2c6b701b5161b34d910ba002ed4397a3e0bbe9a13db2427c9ef50f4c3546742` |
| `05_architecture.md` | `6e6453b2325ad89f0326cebfda40072470cecf2c65f165d4f9d7987702452a62` |

Host revision `a02e007567b6e585aee8f6a15b2d563d21c6bd0e54207cd6ebfb1e43ee0cfa62`, nonce `0fef60e0-1ec5-4cd4-b693-c9991c49a4cc`. Дополнительные зависимости ниже прочитаны и хэшированы отдельно, **не входят** в восемь измеренных host paths:

| Путь | SHA-256 |
|---|---|
| `openspec/changes/proofo-project-cabinet/specs/project-cabinet/spec.md` | `aa16c0134dbd7decdc4e7d1ec8f7c323a0f79df0436a196bb32b87fb1b7e4ff7` |
| `features/proofo-ui/project-cabinet/06_implementation_plan.md` | `f6a4eb1601e4683a1478ce05130a71ee3d8b54eac926ef97cee843fdc9b87efd` |
| `features/proofo-ui/project-cabinet/design-adaptation.md` | `c83260191723fc8cfe78e387d5429c4cb08021aac2d544484f906b3dabec9143` |
| `features/proofo-ui/project-cabinet/preview/README.md` | `963274ca9b665236f5addbcc8c3942f67472a414a2bfe531605492b170bb1d4c` |
| `scripts/run-branding-collect-preview.mjs` | `d2f3fe6bc480c444de0aadfc1701b42c6b2d2b5bea7ac80f04a981cd4fafdd37` |
| `apps/web/src/app/dashboard/[slug]/page.tsx` | `86be10119cd89198d0709fcc90870b1a97a662d0804ef3603e3500841a587ac6` |
| `apps/web/src/app/dashboard/[slug]/share-cta.tsx` | `9e8b4b7c6ef256f14b850ae2fe7a0ad931448a71b1db65e5e9ba7f4c3613ebb4` |
| `apps/web/src/app/dashboard/[slug]/platform-form.tsx` | `e7275234e413c2fb34faf0281c903f613e76fc1bd27be458cdd51a92c7fffb14` |
| `apps/web/src/app/dashboard/[slug]/import-form.tsx` | `eb31877814364a440c84e34a3511c5ca39ed44de73be9f2bb6c7d4491548a947` |
| `apps/web/src/app/dashboard/[slug]/billing-block.tsx` | `b4172b4a5e0a91ca7328b97c55142267c99c528b87114293b1f9b5578393a472` |
| `apps/web/src/app/dashboard/[slug]/n3-status.tsx` | `76610c6917f4a70d821566ab221f1b08f1cf88ba2a6af6326707dfbe62f5a2ae` |
| `apps/web/src/app/dashboard/[slug]/change-password.tsx` | `9992520120a3a879e32ffc9806b80430d2bbf650ea130e8c201e7d2061161d1d` |
| `apps/web/src/app/dashboard/[slug]/moderation-list.tsx` | `2491f0adc20556c6b42ecd90d756867d5d68dc0ed277073fbeaf8b3775758a0d` |
| `.agents/agentic-qe/skills/risk-based-testing/SKILL.md` | `369447d4903cd1265f78e8ed69be3f085a901f5015c79fa20d218497147837a7` |

## Статические условия

**RISK-01 — HIGH, structural, NFR-303/PC-10.** `00_complexity_assessment.md:32` требует, чтобы outbound quarantine выявлял каждый escape; `05_architecture.md:28-29` предполагает существующий allowlist, synthetic services и общий lock. Однако `scripts/run-branding-collect-preview.mjs:19-25,47-66,88-90` проверяет адреса конфигурации и передаёт урезанное окружение дочернему процессу; в самом показанном механизме нет блокировки/учёта всех исходящих сетевых соединений browser, app и дочерних процессов. Fixture маршрута браузера или отсутствие provider env не доказывают запрет серверного egress. **INFERRED:** неожиданный жёстко заданный адрес или иной транспорт может обойти конфигурационные проверки и попасть к реальному провайдеру; это риск, не утверждение о факте вызова. Условие: до допуска verification зафиксировать в измеренной архитектуре конкретную принудительную deny-by-default сетевую границу для всех QA процессов с разрешением только названных loopback endpoints; определить контролируемый негативный пробник без реального внешнего эффекта, assertion/журнал отказа и fail-closed при недоступности механизма. В 06 связать её с задачами/оракулами и собственником. Имеющиеся данные не доказывают фактическую реализацию такой границы.

**RISK-02 — HIGH, structural, NFR-303/FR-309.** `05_architecture.md:28-29` и `01_requirements.md:20` ссылаются на точные PG33186/app33187/S3 33188/foreign 33189 и общий lock; `06_implementation_plan.md:17` требует выполнить проектный E2E и mutation через существующий runner/lock. **STATIC:** `scripts/run-branding-collect-preview.mjs:19-24,32-43` допускает произвольные три разных loopback-порта, кроме 33181–33184, а строки 102–106,122–129 выбирают для `e2e` только `tools/visual/branding-collect.e2e.test.mjs`, не project E2E или mutation; сам runner lock не захватывает. Совместимость внешнего orchestrator не доказана. **INFERRED:** можно получить успешный запуск чужого теста или проверить не тот runtime/порты и приписать это project evidence; возможна гонка при незахваченном lock. Условие: определить в измеренной архитектуре точный fail-closed маршрут orchestration, который до spawn проверяет все четыре endpoints и удерживает общий `flock` на всём lifecycle, запускает каждый из двух конкретных проектных файлов и фиксирует идентичность теста/exit status; привязать это к задачам 06 и предусмотреть отказ на неправильный порт, занятый lock и неверный target. Прежние девять visual cases остаются нетронутыми. Назначение конкретных файлов может потребовать обновления 20-target inventory до K1; молча считать его неизменным нельзя.

## Риск-шторминг и стратегия проверки

Шкала: экспертные порядковые L/I 1–5, произведение; 20–25 CRITICAL, 12–19 HIGH, 6–11 MEDIUM, 1–5 LOW согласно установленному risk-based-testing. L отражает сложность и число изменяемых границ, I — потенциальный ущерб; это **INFERRED**, не статистическая вероятность. Одинаковые оценки не обозначают равный бюджет. 9 сценариев: **0 CRITICAL, 8 HIGH, 1 MEDIUM, 0 LOW**. `riskScore=16/25 HIGH` — максимум оценок, не среднее и не вероятность. HIGH может перейти в QCSD CONDITIONAL при наличии выполнимых мер; результирующее решение всех ролей принимает координатор. Спецификация называет tenant/XSS/provider последствия критичными по impact; это совместимо с отсутствием оценок 20+ в данной L×I шкале.

| ID / требования | L×I, уровень | Сценарий и воздействие | Мера и будущий тест / ценность против затрат |
|---|---|---|---|
| T1 FR-301/NFR-302 | 3×5=15 HIGH | Перенос loader ослабляет owner/RLS или забывает inactive guard → раскрытие чужого/деактивированного проекта. STATIC: `page.tsx:43-56` currentAccountId/withAccount, без explicit active predicate; будущая архитектура `05:6-8` добавляет guard. | Сохранять withAccount и реальный SQL role/GUC; owner/foreign/inactive/anonymous через обычный HTTP, withService и удалённый predicate как red mutants. Дорогой интеграционный setup оправдан границей данных. |
| T2 NFR-303/PC-10 | 3×5=15 HIGH | Исходящий side effect при QA в email/payment/STT/storage: потеря изоляции и побочный эффект. STATIC: A13 требует quarantine, но имеющийся runner проверяет только config (RISK-01). | Принудительная deny-by-default граница с локальными stubs, отдельный безопасный отрицательный probe, запись отказа. Дороже browser-only fixture, зато охватывает сервер/дочерние процессы. |
| T3 FR-303/304 | 4×4=16 HIGH | Замена семи действующих компонентов на пустой macro теряет ручное доказательство, CSV preview/commit, переходы и provenance; false success при ошибке. STATIC: `page.tsx:145-179`, существующие platform/import формы и `06:13`. | Сохранить API/модули; test screenshot-only и URL/text, pending/provenance, preview без insert, commit/дубликаты, 400/429/503/network, все восемь переходов и reload/public visibility. Интеграция плюс выборочные E2E дороже smoke, но выявляет потерю данных. |
| T4 FR-302/305 | 3×4=12 HIGH | При reorder пропадают recovery после reload, пустые wall/form/snippet, либо простое копирование считается install и share выполняется без consent. STATIC: `page.tsx:110-130`, `share-cta.tsx:22-48`. | После empty login проверить URL/snippet/origin/encoding, reload recovery, отсутствие install/POST/share при cancel, явное подтверждение на реальном persisted install. Низкая стоимость относительно потери onboarding/нежелательных действий. |
| T5 FR-306/307 | 3×4=12 HIGH | Смена shell скрывает N3/checkout или теряет retry key; expired paid показан paid; password cancel или success неверно управляет сессиями. STATIC: `billing-block.tsx:20-44`, `n3-status.tsx:10-19`, `05:15-19`. | Проверить free/current/expired, disabled/all N3 states, retry/canceled/new key на transport fixtures (не provider), реальный local password endpoint: mismatch/cancel, revoke старых и reissue текущей cookie. |
| T6 FR-308/PC-08 | 4×3=12 HIGH | Legacy purple просачивается в новые controls или публичный пользовательский accent перезаписывается/становится цветом chrome. STATIC: ADR-002 разделяет два источника, `06:31` называет цвета. | На ordinary persisted default/custom выполнить computed color и hover/focus/error, DB и public collect/wall/widget, границы/контраст; fixture palette отдельно. Средняя стоимость, предотвращает дефект live-only. |
| T7 FR-309 | 4×4=16 HIGH | Fixture копирует эталон вместо production view, baseline перезаписывается, либо разница реально иных возможностей скрывается маской. STATIC: ADR-003:15-18 требует 3 отдельных доказательства. | Immutable original/hash; сравнение заранее согласованных shell/header/title/onboarding областей из того же production view на трёх размерах с red font/spacing/color mutants; отдельные честные полные live screenshots empty/filled/error/mobile. Не обещать полную идентичность macro и live. |
| T8 FR-309/NFR-303 | 4×4=16 HIGH | План запускает branding E2E вместо project test либо использует некорректные порты/lock → ложное подтверждение и возможная гонка (RISK-02). | Зафиксировать target-aware безопасный маршрут и assert фактического файла, exit code, точных портов и lock в безопасных негативных проверках. Затраты на orchestration меньше стоимости ложной приёмки. |
| T9 NFR-301 | 3×3=9 MEDIUM | Длинный контент или мобильный размер скрывает управление, сообщения ошибок либо делает фокус/контраст неразличимыми. STATIC: `01:18`, `05:25-26`. | На 320/360/390/1440 обычные session/data, проверка полного текста, scrollWidth, клавиатуры, labels/error/status и вычисленного контраста по composed background; targeted E2E + ручная проверка. |

Зависимости: loader→RLS→items/installs→view и публичная видимость; capability slots→восемь API boundaries (`05:18-19`); scoped CSS→семь клиентов и независимые публичные surfaces; runtime/orchestrator→все тесты; original capture→same-view regions и отдельный live evidence. Это качественная карта, а не вычисленный транзитивный граф вызовов.

## Статус принятия и ограничения

План `06` перечисляет 20 targets; он и UI proposal не входят в host manifest и не могут считаться автоматически измеренными prepare. Owner approval pending; исходная и заполненная визуальные формы ещё не утверждены. Исходный captured candidate, preview и старые QE receipts не доказывают действующую функциональность. Код продукта отсутствует в текущем инкременте; реализация, RLS, network isolation, контраст, ред-мутации, E2E и ручная приёмка здесь не проверялись. Все условия адресованы к текущему design snapshot; при исправлении их подтверждает этот же независимый reviewer на новом nonce/revision. Имена `implementationVerified` в ideation означают только структурно проверенный исправленный дизайн, не продуктовый тест.

## Focused rework verification — revision `963294a11da2550521f81059a16fa1fc76420c06623aab200d5f916a6c80c009`

**Результат: собственные QCRISK-01 и QCRISK-02 независимо подтверждены на уровне дизайна; новых условий в рамках focused review нет.** Это не принятие продукта, не результат E2E и не общий вердикт всех ролей. Исходные condition objects и исходный отчёт выше сохранены как история. Author `addressed` — предложение исправления, независимо проверенное здесь только в части моих двух условий; author delta и оценка его новых рисков прочитаны. `implementationVerified:true` в этом ideation означает лишь проверку исправленных плановых контрактов и оракулов.

**QCRISK-01, STATIC:** `05_architecture.md`, раздел Runtime/rollback, определяет закрытый allowlist четырёх synthetic loopback endpoints, предзагрузку guard на контролируемые Node transports и children, отдельный browser-context guard, запрет неподдерживаемых transports, безопасные synthetic DNS/socket/HTTP/browser/child/worker probes и отказ при отсутствии ack или audit; ожидаемые отказы отделены от нештатных, нештатный deny завершает проверку неуспешно. `01_requirements.md` NFR-303 и spec PC-10 связывают этот ограниченный контракт с QA; `06_implementation_plan.md` TASK-QA/AM-2 задают будущий `project QA boundary records and refuses synthetic egress` и зависимость TASK-8 от TASK-QA. **Граница доказательства:** проект явно не заявляет kernel firewall или контроль native/Chromium-internal egress; ненаблюдаемый транспорт оставляет сценарий unresolved/failure. Поскольку guards ещё не реализованы и probes не выполнялись, фактическая изоляция не доказана.

**QCRISK-02, STATIC:** `05_architecture.md` и TASK-QA задают новый project runner, строгие 127.0.0.1:33186/33187/33188/33189, единственного владельца `flock -n` от preflight до полного teardown, fail-closed для занятого lock, closed `e2e`/`mutation`/`all` с конкретными project suite, realpath/SHA/exit и guard-ack receipt; named test охватывает неправильный порт, занятый lock, неверный target и отсутствие guard. `06` TASK-8 теперь использует отдельный runner и зависит от TASK-QA; четыре новых runner/guard/test файла входят в перечень 24 planned targets. Фактический запуск, удержание lock и выходы пока не проверены.

**EXECUTED:** `sha256sum` всех восьми host paths совпал с `rework-prepared.json`/host snapshot, nonce `733ac1ec-9eb4-45bb-bbbc-e8391ed7f4ca`:

| Host path от `features/proofo-ui/project-cabinet/` | SHA-256 |
|---|---|
| `00_complexity_assessment.md` | `b434f62c83e979ade1381e93ebe732d1595ae8add7d8e4eb964ae4e50cafa145` |
| `01_requirements.md` | `b6384fb57634b86fc9233fcf7158d557f8aacc4decb2c26a19084783fd4d9a74` |
| `02_research.md` | `6a20012b05384ca0171dcd0a90c93b174a2f8c4ea108b3cc5ed6d980757d84cf` |
| `03_adr/001-reuse-owned-project-capabilities.md` | `cbea146422ab55773792d6dc3c1ebc2636aa846f8793cabf285d817a8fe7270d` |
| `03_adr/002-scope-cabinet-palette-and-interaction.md` | `540b70501147adc6e8535caf2b9edde3c41fdbac403fc039d9d4e4fbf219933d` |
| `03_adr/003-separate-original-reference-from-live-adaptation.md` | `8764ae09f54a8dee1b3c15ed9f1974eebf76ec9b1bcd6dee81261143dc772bab` |
| `04_domain_model.md` | `1b1acaad1fd6494eec0afc4715e1dfae65f99d3a51db1feb5fd0906859797adf` |
| `05_architecture.md` | `d8bb12a1f4743d10b1d474e23c3f8fa3dbcc3561736ace9933f73a079dbd782c` |

Дополнительные не измеренные host dependencies: spec SHA `834c9e8bcd3db6851e3b00e24f7196370c48bf6b3afaef18ffc22aa19a622b40` совпал с `01_requirements.md`; `06_implementation_plan.md` SHA `eaf18bc26b1d0f3b3c4a46233e3bd91f592d661e6b9778d46906e115e967673f`; `author-rework-delta.json` SHA `63c7a70afa39110b32d42be26957feb071abaaefc981d9b5a4154bf3ed45501a`. Ни эти hashes, ни статическое ревью не измеряют product behavior. Проверки K1/K2, source admission, runtime, product tests и провайдеры не запускались; owner approval точного proposal/regions/filled controls остаётся pending.
