# QCSD ideation — независимый security review

**Вердикт: CONDITIONAL.** Два конкретных precode условия: 1 HIGH и 1 MEDIUM, подтверждённых эксплойтов 0. Это оценка дизайна и статических источников, не SAST/DAST отчёт и не допуск реализации. Владелец ещё не утвердил конкретную adaptation и filled states; ожидаемое решение остаётся отдельным gate, не считается дефектом продукта. `qcsd-risk` уже владеет условиями сетевого карантина и orchestration, а testability — TST-03: эти условия остаются открытыми и не закрываются данным отчётом.

**Контекст:** conditional Batch 2, HAS_SECURITY=true; reviewer `qcsd-security`, family `codex`, independent=true. Информация о фактической конфигурации запуска, предоставленная координатором: `gpt-6.1-terra`, `xhigh`, `fork_turns=none`; архитектор `gpt-6-astra/xhigh`. Независимая provider telemetry не получена. Snapshot revision `a02e007567b6e585aee8f6a15b2d563d21c6bd0e54207cd6ebfb1e43ee0cfa62`, nonce `0fef60e0-1ec5-4cd4-b693-c9991c49a4cc`.

Роль `qe-security-auditor` прочитана полностью из pinned upstream commit `98f241fc8b9d48d017cbdb63ab890104e30397d0`, SHA-256 `de180aaf62fbf987461aec87c5eb9cf702867c9306fa344da7790e4fcfe457d5`. Прочитаны QCSD skill и step 04, полный установленный shift-left, а также full pinned `.claude/skills/security-testing/SKILL.md` (SHA-256 `1d34cdf5f9d1c85f81559e384b2a76d9c6b858d202f7656d669650dd0d8b6cbe`); отдельного installed security-testing skill не обнаружено. Указания skills на provider advisor, scanning, learning и vendor run-history не выполнялись: brief запрещает provider calls, tests/server и изменение installed skills; роль запущена collaboration, а не Claude Task. Не выдаём это за полный security scan, compliance audit или learning receipt.

## Исправление контракта записи

Первоначальная canonical evaluation отклонила запись как `reviewer-contract-invalid`: helper допускает `BLOCKER`, `CRITICAL`, `HIGH`, `WARNING`, `SUGGESTION`, но не `MEDIUM`. Исходная экспертная оценка QCSEC-02 остаётся **MEDIUM** в отчёте; в native entry она закодирована как **WARNING**. Первоначальный файл сохранён как `qcsd-security-entry-invalid-medium.json`; это исправление формата исходной записи, а не новое ревью, изменение требования или закрытие условия. Сам отказ сохранён координатором в `.secrets/project-cabinet-qcsd-initial-evaluation.json`.

## Условия и воспроизводимое основание

**QCSEC-01 — HIGH, structural, STATIC, FR-301/PC-01.** `01_requirements.md:11`, `05_architecture.md:6–7,26` описывают owner/RLS, active predicate и SQL role/GUC. `06_implementation_plan.md:11` (вне host manifest) называет loader tests active/foreign/missing/inactive, а `:12` — ordinary persisted owner journey; конкретный HTTP denial status/body oracle отсутствует. Нормативная spec `PC-01:11–15` требует redirect для anonymous и 404 без проектного содержимого для foreign/absent/deactivated. **INFERRED:** корректный loader unit сам по себе не доказывает, что page возвращает отказ без утечки вместо stale или другого HTML. До source admission связать FR-301 с именованным ordinary HTTP тестом: active owner видит свои persisted данные; anonymous получает login redirect с encoded next; owner A к foreign, отсутствующему и собственному inactive получает 404 без уникальных project name, отзывов, ссылок и snippet. Указать test file, synthetic identities и assertions; SQL executing-role/GUC и negative mutants остаются отдельными проверками. `TST-02` касается SQL ошибок против empty/404 и не закрывается этим условием.

**QCSEC-02 — MEDIUM, structural, STATIC, FR-307/PC-07.** `05_architecture.md:15` добавляет show/cancel, очищающий значения и ошибки без вызова API; однако не определяет состояние запроса после submit. Существующий `change-password.tsx:17–55,112` асинхронно отправляет POST и блокирует submit; отдельного cancel пока нет. `06_implementation_plan.md:14` говорит cancel no side effect, не задавая in-flight oracle. **INFERRED:** новый cancel может очистить или скрыть форму, когда операция уже принята сервером, ошибочно обещая отсутствие смены пароля. Определить до реализации: cancel до submit очищает данные и не делает POST; после отправки не обещать отмену серверной операции (например, блокировать cancel до результата и показывать busy); показать действительный success/error и сохранить новую сессию. В будущем synthetic UI тесте проверить cancel до submit, задержанный ответ и попытку cancel во время POST, success/error, недействительность старых сессий и работоспособность reissued cookie. Abort клиента не доказывает откат сервера. Это не утверждение о существующей эксплуатации.

## Трассировка security boundaries и план проверок

| Область | Статическое наблюдение и соответствие | Будущий проверяемый oracle |
|---|---|---|
| A01 access / FR-301 | `page.tsx:43–56` берет currentAccountId, параметризует slug и вызывает withAccount; explicit `deactivated=false` в текущем SELECT отсутствует. Требуемая новая защита описана `05:6–7`. Мы не утверждаем, что отсутствует какая-либо внешняя/RLS защита или что чужие данные уже раскрыты. | Реальный SELECT с ролью/GUC и мутантами withService/active; отдельные HTTP отказы QCSEC-01. |
| A07 credentials / FR-307 | `change-password.tsx:25–51` проверяет повтор, не передаёт account ID, сбрасывает форму после успеха; `password-change.ts:191–227` содержит CAS обновление, revoke и создание новой session, `route.ts:114–118` устанавливает cookie после результата транзакции. Это статический код, не проверенный runtime. | Synthetic mismatch, неверный current, cancel и in-flight QCSEC-02; old cookies rejected, новая действует, error не превращается в успех. |
| A03 injection / FR-304–305 | `moderation-list.tsx:95–100,126–142` выводит авторский текст через JSX и ссылку в href; `platform-proof.ts:50–65` проверяет HTTPS и host для named platforms, other допускает любой HTTPS host; `page.tsx:128–130` выводит сниппет как текст, `urls.ts:112–115` строит его по текущим authority и slug. Нельзя считать JSX экранирование полной проверкой произвольного URL или вставки за пределами React. | Persisted безвредный XSS corpus — literal, без исполнения в cabinet, wall и чужом widget origin; сохранить безопасную ссылку/source и настоящий origin/asset/snippet; не заменять provenance HTML-инъекцией. |
| A04 design / FR-303–306 | Реальные platform/CSV, moderation и подтверждение share должны оставаться доступны, не создавать ложную запись, success или side effect. `share-cta.tsx:22–45` предусматривает наличие install и POST после confirm. | Synthetic URL/screenshot, CSV preview no insert, commit/dedup, все allowed states и 409, сохранение source и полных данных; cancel share до confirm — без POST/browser share. |
| A05 environment / NFR-303 | Allowlist runner и synthetic env не доказывают принудительную изоляцию всех процессов; оценка и конкретные remedial design requirements принадлежат `QCRISK-01`, `QCRISK-02`, `TST-03`. | Доказать egress и запуск именно project targets через fail-closed локальную границу, по открытым условиям их владельцев; без настоящих провайдеров. |
| A10 SSRF | `platform-proof.ts:80–105` распознаёт источник локальным разбором URL; архитектура `05:14` запрещает fetch/OCR. | Убедиться, что UI не инициирует серверного извлечения удалённого URL. Никаких новых API по этой проверке не требуется. |

A02 (криптография), A06 (зависимости), A08 (поставка), A09 (журналы) полностью не оценены; A01/A03/A04/A05/A07/A10 рассмотрены только в перечисленных границах, без выводов о полном соответствии OWASP. Нет подтверждения SOC2, GDPR, PCI или других нормативных стандартов. Прочитанные файлы не являются полным security audit системы. Не подтверждались production configuration, секреты, сетевые эффекты, исходники всех endpoints или надёжность существующих backend contracts.

## Метрики и границы доказательств

- 8/8 подготовленных host paths независимо совпали по SHA-256 с manifest: команда Python `hashlib.sha256(path.read_bytes())` сравнена с `review-convergence-ideation-host.json`. Это проверка bytes, не поведения; таблица ниже.
- Пять областей сценариев в scope: owner/RLS; пароль и сессии; XSS/provenance/snippet; сохранность intake/moderation/share; QA/provider boundary. Каждая изучена статически; это не процент тестового покрытия и не security score.
- Инвентарь находок: HIGH 1, MEDIUM 1, LOW 0, CRITICAL 0; эксплуатация и product security tests не выполнялись. Уровни — экспертная приоритизация структурных требований, не вероятность.
- Из других ролей приняты как вход реальные `qcsd-risk.md`, `qcsd-testability.md`, `batch1-received.json`; их условия не закрываются и авторами не переоцениваются. Не запускались приложение, БД, тесты, сканеры, миграции, provider или advisor; секреты и реальные credentials не использовались. Отсутствует динамическое доказательство отсутствия уязвимостей. `implementationVerified` на последующей ideation-проверке может означать только корректировку design, не работающий продукт.

## Хеши измеренного host snapshot

| Путь | SHA-256 |
|---|---|
| `features/proofo-ui/project-cabinet/00_complexity_assessment.md` | `86e6ca35254d7fe7defc12d068e597b84d3f2b60a21c41d6259582b00bc1007d` |
| `features/proofo-ui/project-cabinet/01_requirements.md` | `572d68fb62307f755824d09d1e55cbfe3c2df9389c10de6b165ec2366b660a53` |
| `features/proofo-ui/project-cabinet/02_research.md` | `d15adf498857d82350df96822626444e896f8451c85c114f3554b64f2d5a6ba0` |
| `features/proofo-ui/project-cabinet/03_adr/001-reuse-owned-project-capabilities.md` | `fb4ef2e82a09d3449203691f629b191dd3ad46b155ab6bb234f3296e09f69375` |
| `features/proofo-ui/project-cabinet/03_adr/002-scope-cabinet-palette-and-interaction.md` | `68287d023834f6194860bfa3f220cf1a1ef61ff69b805de3918427ccd8c53556` |
| `features/proofo-ui/project-cabinet/03_adr/003-separate-original-reference-from-live-adaptation.md` | `1028ab4bfd082c82bc742eb909a368fb0a7739cc5a7bb1167308747c25e97c29` |
| `features/proofo-ui/project-cabinet/04_domain_model.md` | `c2c6b701b5161b34d910ba002ed4397a3e0bbe9a13db2427c9ef50f4c3546742` |
| `features/proofo-ui/project-cabinet/05_architecture.md` | `6e6453b2325ad89f0326cebfda40072470cecf2c65f165d4f9d7987702452a62` |

## Дополнительные прочитанные зависимости вне host manifest

| Путь | SHA-256 |
|---|---|
| `openspec/changes/proofo-project-cabinet/specs/project-cabinet/spec.md` | `aa16c0134dbd7decdc4e7d1ec8f7c323a0f79df0436a196bb32b87fb1b7e4ff7` |
| `features/proofo-ui/project-cabinet/06_implementation_plan.md` | `f6a4eb1601e4683a1478ce05130a71ee3d8b54eac926ef97cee843fdc9b87efd` |
| `features/proofo-ui/project-cabinet/design-adaptation.md` | `c83260191723fc8cfe78e387d5429c4cb08021aac2d544484f906b3dabec9143` |
| `features/proofo-ui/project-cabinet/preview/README.md` | `963274ca9b665236f5addbcc8c3942f67472a414a2bfe531605492b170bb1d4c` |
| `apps/web/src/app/dashboard/[slug]/page.tsx` | `86be10119cd89198d0709fcc90870b1a97a662d0804ef3603e3500841a587ac6` |
| `apps/web/src/app/dashboard/[slug]/moderation-list.tsx` | `2491f0adc20556c6b42ecd90d756867d5d68dc0ed277073fbeaf8b3775758a0d` |
| `apps/web/src/app/dashboard/[slug]/platform-form.tsx` | `e7275234e413c2fb34faf0281c903f613e76fc1bd27be458cdd51a92c7fffb14` |
| `apps/web/src/app/dashboard/[slug]/import-form.tsx` | `eb31877814364a440c84e34a3511c5ca39ed44de73be9f2bb6c7d4491548a947` |
| `apps/web/src/app/dashboard/[slug]/change-password.tsx` | `9992520120a3a879e32ffc9806b80430d2bbf650ea130e8c201e7d2061161d1d` |
| `apps/web/src/app/dashboard/[slug]/billing-block.tsx` | `b4172b4a5e0a91ca7328b97c55142267c99c528b87114293b1f9b5578393a472` |
| `apps/web/src/app/dashboard/[slug]/n3-status.tsx` | `76610c6917f4a70d821566ab221f1b08f1cf88ba2a6af6326707dfbe62f5a2ae` |
| `apps/web/src/app/dashboard/[slug]/share-cta.tsx` | `9e8b4b7c6ef256f14b850ae2fe7a0ad931448a71b1db65e5e9ba7f4c3613ebb4` |
| `apps/web/src/app/api/testimonials/[id]/moderate/route.ts` | `4b81be100fddb6958a17e2ff4c9741cdffb1ed0b4e9d280b4b74161aecf84e43` |
| `apps/web/src/app/api/testimonials/platform/route.ts` | `b12be619abb4ca97c56bbab98d863eb0f8d271638088d691c19320de33e2a7e1` |
| `apps/web/src/app/api/auth/password/route.ts` | `48ab73b7f07022453e2bd97f049d9d80c78bf665157f408605f63140f253180b` |
| `apps/web/src/lib/password-change.ts` | `be38cc40f1f36b2b4883ceaefe8a782d105d9a7a01545111f74978125cb49a4e` |
| `apps/web/src/lib/session.ts` | `5f22ed53dc93ca1c775c101a59835f19459ab525f678e5298579c6ae54b32376` |
| `apps/web/src/lib/urls.ts` | `3ecb88b243db37921430053d54aef87a9cd6cb10ce76a80d316db0519bf5ac6c` |
| `apps/web/src/lib/platform-proof.ts` | `ae634a6b205c3035377b1a015c6f69b599b9d578ce5a77e164b63aa083d812be` |
| `scripts/run-branding-collect-preview.mjs` | `d2f3fe6bc480c444de0aadfc1701b42c6b2d2b5bea7ac80f04a981cd4fafdd37` |
| `.agents/agentic-qe/skills/shift-left-testing/SKILL.md` | `3e60dccf6dc39d0745770941cab492f3080b786ec82e1b36ace5a4fca99bcb66` |

Spec hash совпадает с привязкой в `01_requirements.md`; ни spec, ни план, ни перечисленный текущий код не входят в восемь measured host paths. Scope обоих условий ограничен `01_requirements.md` и `05_architecture.md`; согласованные изменения spec/плана после пересмотра должны отдельно хешироваться координатором. Целевые remediations — уточнение design/test oracle, без произвольного расширения API или переписывания существующего backend.

## Focused verification rework — 2026-11-12

**Вердикт: CLEAN для двух собственных design условий.** Новый nonce `733ac1ec-9eb4-45bb-bbbc-e8391ed7f4ca`, revision `963294a11da2550521f81059a16fa1fc76420c06623aab200d5f916a6c80c009`. Авторская `author-rework-delta.json` прочитана и оценена: addressed — предложение автора, не его самостоятельное закрытие. Independently verified оба исправления ниже; остальные роли и итоговый gate оценивает координатор.

**QCSEC-01-http-denial — structural verified.** `01_requirements.md:31`, `05_architecture.md:49–52`, `06_implementation_plan.md:11,61`, spec PC-01:11–24 задают обычный GET с synthetic A/B и named live test `project cabinet HTTP denies anonymous foreign missing and inactive access` в `tools/visual/project-cabinet.e2e.test.mjs`: anonymous redirect с безопасным encoded next, A→B/absent/Ainactive 404 без name/text/URLs/snippet в raw body и DOM, A→active 200 только свои данные; отдельный SQL executing role/GUC и negative mutants сохранены.

**QCSEC-02-password-cancel-inflight — structural verified.** `01_requirements.md:34`, `05_architecture.md:42–46`, `06_implementation_plan.md:14,63`, spec PC-07:121–135 и named live test `project cabinet password cancel respects in-flight mutation` задают pre-submit clear/POST0, disabled cancel/Escape и busy при задержанном POST, фактические success/error и честный unknown outcome; при success проверяются old-cookie rejection и current-cookie access. Это не обещание отката серверной операции.

Восемь подготовленных путей независимо совпали с host и rework-prepared manifest по SHA-256:

- `features/proofo-ui/project-cabinet/00_complexity_assessment.md` — `b434f62c83e979ade1381e93ebe732d1595ae8add7d8e4eb964ae4e50cafa145`
- `features/proofo-ui/project-cabinet/01_requirements.md` — `b6384fb57634b86fc9233fcf7158d557f8aacc4decb2c26a19084783fd4d9a74`
- `features/proofo-ui/project-cabinet/02_research.md` — `6a20012b05384ca0171dcd0a90c93b174a2f8c4ea108b3cc5ed6d980757d84cf`
- `features/proofo-ui/project-cabinet/03_adr/001-reuse-owned-project-capabilities.md` — `cbea146422ab55773792d6dc3c1ebc2636aa846f8793cabf285d817a8fe7270d`
- `features/proofo-ui/project-cabinet/03_adr/002-scope-cabinet-palette-and-interaction.md` — `540b70501147adc6e8535caf2b9edde3c41fdbac403fc039d9d4e4fbf219933d`
- `features/proofo-ui/project-cabinet/03_adr/003-separate-original-reference-from-live-adaptation.md` — `8764ae09f54a8dee1b3c15ed9f1974eebf76ec9b1bcd6dee81261143dc772bab`
- `features/proofo-ui/project-cabinet/04_domain_model.md` — `1b1acaad1fd6494eec0afc4715e1dfae65f99d3a51db1feb5fd0906859797adf`
- `features/proofo-ui/project-cabinet/05_architecture.md` — `d8bb12a1f4743d10b1d474e23c3f8fa3dbcc3561736ace9933f73a079dbd782c`

Дополнительно отдельно хешированы spec `834c9e8bcd3db6851e3b00e24f7196370c48bf6b3afaef18ffc22aa19a622b40`, plan `eaf18bc26b1d0f3b3c4a46233e3bd91f592d661e6b9778d46906e115e967673f`, author delta `63c7a70afa39110b32d42be26957feb071abaaefc981d9b5a4154bf3ed45501a`; они вне host manifest. FR-301/PC-01 и FR-307/PC-07 связаны, target inventory содержит 24 уникальных пути.

Новых материальных security условий в focused scope нет. Ограничение автора на наблюдаемые Node/browser transports не является OS-wide sandbox; оценки QCRISK/TST-03 остаются за соответствующими владельцами. Owner approval точного proposal по-прежнему pending. Код, SQL/HTTP, product tests, server, provider, K1/K2 и source admission не выполнялись: `implementationVerified: true` означает только независимо проверенный исправленный **дизайн**, не проверку продукта. Исходные condition objects и отдельная история invalid MEDIUM сохранены.
