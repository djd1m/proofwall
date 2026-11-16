# Независимое QCSD: доступность project cabinet

**Вердикт CONDITIONAL: два HIGH structural условия A11Y-01 и A11Y-02.** Это пробелы спецификации проверки и архитектурного контракта, выявленные статически, а не результаты тестирования будущего UI. Согласование владельцем конкретной новой адаптации, заполненных/control states и областей визуального сравнения остаётся отдельным precode gate; оно ожидается и не подменяется этим отчётом. Ни один finding Batch1 не закрывается данным reviewer.

## Роль и доказательства

`qcsd-accessibility`, conditional Batch2 при HAS_UI=true; полная роль upstream `qe-accessibility-auditor` прочитана через `git show 98f241fc8b9d48d017cbdb63ab890104e30397d0:.claude/agents/v3/qe-accessibility-auditor.md`, независимо вычисленный SHA-256 `0f936da5dc5d5f1be2fdef4dda8b362cb3430d4cf7a5a473403107273893f089` совпал с role-references. Configured при spawn `gpt-6.1-terra`/`xhigh`/`fork_turns=none`, автор архитектуры `gpt-6-astra`/`xhigh`/`fork_turns=none` согласно handoff; provider telemetry недоступна. Прочитаны AGENTS, политика, matrix, integration, полный QCSD и steps 03/04, установленные accessibility-testing и visual-testing-advanced; их инструкции о выполнении browser/видео/learning не отменяют прямой запрет product tests, server, providers и сторонних записей в этом review. Прочитаны три отчёта Batch1 и batch1-received; общий testability 85/100 — оценка Batch1, не наша оценка доступности продукта.

**EXECUTED:** Python SHA-256 каждого из 8 host manifest файлов дал 8 MATCH; нормативная spec независимо равна SHA в 01. Локальный вычислитель относительной яркости для заданных opaque пар дал следующие *теоретические* значения, не вычисленные стили и не результат живого экрана: `#c8492f/#fffdf8` 4.642:1, `#c8492f/#ffffff` 4.719:1, `#8e806b/#f7f4eb` 3.504:1, `#8e806b/#fffdf8` 3.790:1. Эти примеры не доказывают, что пары вообще используются для текста/границ, и не охватывают hover, focus, opacity/compositing или другие цвета. **STATIC** — прочитанные source/design; **INFERRED** — риск, а не подтверждённый сбой. Product code, браузер, screen reader, axe, server и providers не запускались; screenshot/compliance/coverage не измерялись. Preview не есть production evidence.

## Условия и предлагаемые проверки

**A11Y-01 HIGH, STATIC — фокус и клавиатурная последовательность недостаточно определены.** `05_architecture.md:14–16` требует roving keyboard/tab semantics при tabs либо disclosure, `01_requirements.md:11–12,18` включает keyboard/focus. Дополнительный `06_implementation_plan.md:13,17` называет tab/focus, но не задаёт проверяемый порядок или обработку фокуса после исчезновения action. Existing `moderation-list.tsx:32–36,67–68,145–155` по успешному ответу заменяет набор кнопок изменением состояния; **INFERRED:** активная кнопка может исчезнуть и клавиатурный пользователь потеряет положение. Static proposal `preview/index.html:12–13` и `proposal.js:6–8,23` описывает связку tab/tabpanel, стрелки/Home/End и возвращение фокуса на другую кнопку после перерисовки, но это демонстрация, а не контракт production. Уточнить измеренные architecture/requirements и связать их с именованными live tests: Tab, Left/Right wrap, Home/End, aria-selected/tabindex, controls/labelledby, скрытая панель, оба сохранённых draft; альтернативное disclosure проверять согласно выбранному реальному поведению. Установить и проверить логичный видимый focus после success и failure moderation и password cancel, дальнейшую клавиатурную навигацию, без принудительного focus как замены реальному Tab. Никакого утверждения о сработавшем screen reader здесь нет.

**A11Y-02 HIGH, STATIC — состояние и связь ошибки с полем не имеют конкретного oracle.** `01_requirements.md:18`, `05_architecture.md:25–26`, ADR-002:15 требуют labels/status/error/focus; дополнительный `06_implementation_plan.md:13,17` лишь перечисляет эти аспекты. Existing `platform-form.tsx:176–180` выводит error и done без явной live/alert семантики, `moderation-list.tsx:55–76,90` выводит общую ошибку обычным p; `import-form.tsx:70,91–94` и `change-password.tsx:99–109` напротив имеют alert/status. Это не доказательство реакции AT и не дефект ещё не написанного продукта; оно показывает, что reuse и общая фраза не гарантируют единообразия. В измеренной architecture/requirements определить и связать с named future live test: доступные имена и условия обязательности screenshot/URL/text, CSV и password; конкретная field-specific ошибка связана с конкретным полем, исправляемый ввод сохранён; общая network/409 распознаваема как ошибка без ложного success; busy → success/error → retry доступны без одного только цвета. Указать DOM/accessibility-tree assertion и отдельный ручной keyboard + реальный screen reader сценарий manual, CSV preview/commit, moderation, password mismatch на synthetic test copy; непроведённую AT-проверку маркировать не проверено.

## Traceability и границы охвата

| Область | Наблюдение и будущий oracle | Статус |
|---|---|---|
| FR-303, PC-03 — manual/CSV | Существуют label, preview/commit, сохранение drafts в 05; детали переключения и field/status oracle A11Y-01/02. | STATIC, условно |
| FR-304, PC-04 — четыре состояния, ошибки | Existing статус текстовый, media indicator `moderation-list.tsx:102–108`, screenshot `alt` строки 114–123, transcript строки 140–143; предполагаются выбранные фокус/сообщения и конкретная проверка A11Y-01/02. | STATIC, условно |
| FR-307 — password | Existing labels, `role=alert/status` и busy `change-password.tsx:61–114`; реальный disclosure/cancel ещё планируются. A11Y-01/02. | STATIC, условно |
| FR-308/NFR-301 — contrast | `06:31` задаёт текст ≥4.5:1, крупный ≥3:1, необходимые границы/focus ≥3:1 с composed background; ADR-002:21 явно охватывает hover/focus. Проверять фактические normal/hover/focus/error в default/custom live после реализации. Значения palette сами по себе не тест продукта. | STATIC, оракул задан |
| NFR-301 — reflow | `06:17,32` задаёт 320/360/390/1440, 120+ неразрывное имя, длинные author/text/role/URL, 255 filename и длинную ошибку, scrollWidth≤clientWidth+1 и полное содержимое без clamp; дополнительно проверять отсутствие скрытых элементов и keyboard reachability. | STATIC, оракул задан |
| PC-04 — media | В просмотренных `preview/index.html`, `proposal.js`, `moderation-list.tsx` поиск `<video`, `<audio`, `<iframe`, YouTube/Vimeo/Wistia/player не обнаружил actual player/embed: есть лишь синтетический placeholder и текстовые video/transcript indicators. Этот поиск ограничен названными файлами, не доказательство отсутствия видео во всём продукте. При обнаружении реального видео в будущем нужна отдельная полноценная оценка captions/description по содержимому; надписей из кадров недостаточно для синхронных аудиосубтитров. Никакое media не скачивалось. | STATIC, проверка настоящих медиа не проведена |

Рабочая метрика только полноты **четырёх рассмотренных групп плановых oracle: 2/4 конкретизированы (50%)**: contrast и long/reflow в 06:31–32; keyboard/focus и fields/status неполны по A11Y-01/02. Это собственная бинарная шкала документов, не WCAG score, процент соответствия, оценка работающего UI или применимый swarm gate. Сценарии будущего тестирования не исполнялись. Нет основания заявлять WCAG AA, сертификат либо число нарушений.

## Связанные inputs и хеши

Host nonce `0fef60e0-1ec5-4cd4-b693-c9991c49a4cc`, revision `a02e007567b6e585aee8f6a15b2d563d21c6bd0e54207cd6ebfb1e43ee0cfa62`. Независимое чтение и SHA-256 подтвердило все восемь:

| Измеренный path относительно `features/proofo-ui/project-cabinet/` | SHA-256 |
|---|---|
| `00_complexity_assessment.md` | `86e6ca35254d7fe7defc12d068e597b84d3f2b60a21c41d6259582b00bc1007d` |
| `01_requirements.md` | `572d68fb62307f755824d09d1e55cbfe3c2df9389c10de6b165ec2366b660a53` |
| `02_research.md` | `d15adf498857d82350df96822626444e896f8451c85c114f3554b64f2d5a6ba0` |
| `03_adr/001-reuse-owned-project-capabilities.md` | `fb4ef2e82a09d3449203691f629b191dd3ad46b155ab6bb234f3296e09f69375` |
| `03_adr/002-scope-cabinet-palette-and-interaction.md` | `68287d023834f6194860bfa3f220cf1a1ef61ff69b805de3918427ccd8c53556` |
| `03_adr/003-separate-original-reference-from-live-adaptation.md` | `1028ab4bfd082c82bc742eb909a368fb0a7739cc5a7bb1167308747c25e97c29` |
| `04_domain_model.md` | `c2c6b701b5161b34d910ba002ed4397a3e0bbe9a13db2427c9ef50f4c3546742` |
| `05_architecture.md` | `6e6453b2325ad89f0326cebfda40072470cecf2c65f165d4f9d7987702452a62` |

Дополнительные, **не измеренные prepare** зависимости, SHA-256 независимо вычислены:

| Путь | SHA-256 |
|---|---|
| `openspec/changes/proofo-project-cabinet/specs/project-cabinet/spec.md` | `aa16c0134dbd7decdc4e7d1ec8f7c323a0f79df0436a196bb32b87fb1b7e4ff7` |
| `features/proofo-ui/project-cabinet/06_implementation_plan.md` | `f6a4eb1601e4683a1478ce05130a71ee3d8b54eac926ef97cee843fdc9b87efd` |
| `features/proofo-ui/project-cabinet/design-adaptation.md` | `c83260191723fc8cfe78e387d5429c4cb08021aac2d544484f906b3dabec9143` |
| `features/proofo-ui/project-cabinet/preview/README.md` | `963274ca9b665236f5addbcc8c3942f67472a414a2bfe531605492b170bb1d4c` |
| `features/proofo-ui/project-cabinet/preview/index.html` | `ab7bab18e7c6543fca03eb79bb35869d465597a9648acf3edb369b1de1f41c9c` |
| `features/proofo-ui/project-cabinet/preview/proposal.css` | `fe959c30e5faa362adc28ec7be5212dfaae3b989785592fe941e040ed2e96a42` |
| `features/proofo-ui/project-cabinet/preview/proposal.js` | `b2252e7ce7342c4b54ed632234ce515ef43a9f7077204a88d9fcbee0a10be119` |
| `apps/web/src/app/dashboard/[slug]/moderation-list.tsx` | `2491f0adc20556c6b42ecd90d756867d5d68dc0ed277073fbeaf8b3775758a0d` |
| `apps/web/src/app/dashboard/[slug]/platform-form.tsx` | `e7275234e413c2fb34faf0281c903f613e76fc1bd27be458cdd51a92c7fffb14` |
| `apps/web/src/app/dashboard/[slug]/import-form.tsx` | `eb31877814364a440c84e34a3511c5ca39ed44de73be9f2bb6c7d4491548a947` |
| `apps/web/src/app/dashboard/[slug]/change-password.tsx` | `9992520120a3a879e32ffc9806b80430d2bbf650ea130e8c201e7d2061161d1d` |
| `.agents/agentic-qe/skills/accessibility-testing/SKILL.md` | `d7eedf6d520d511994b973677b64745c8836be59c180ef559622425aa7b05551` |
| `.agents/agentic-qe/skills/visual-testing-advanced/SKILL.md` | `dcf863fa7aec7fa45707105f8f4168ad40e41c85b7ba30e0f53b2627b1322183` |
| `.agents/agentic-qe/skills/qcsd-ideation-swarm/SKILL.md` | `4f9958206be90609a06e5709d486d71cccfcf79799ef450278b15e26af8c9227` |
| `.agents/agentic-qe/skills/qcsd-ideation-swarm/steps/03-batch1-results.md` | `ddaf64b2bff27081954577b97968f2ce181c41d3f2386364a2de0b9ec311cd5b` |
| `.agents/agentic-qe/skills/qcsd-ideation-swarm/steps/04-conditional-agents.md` | `752b00367d4b5cd75fa17cd96cf9c268e032fba47e0d5806aa3bf6539d773f36` |

Условия связаны только с host paths. После переработки reviewer должен проверить новую ревизию; `implementationVerified` в ideation будет означать только проверенную коррекцию дизайна, не исполненные продуктовые тесты. Canonical receipt и итоговый gate — ответственность координатора.

## Focused re-review исправленной ревизии

**Вердикт для собственных условий: CLEAN, A11Y-01 и A11Y-02 подтверждены как исправленные в дизайне; незакрытых собственных условий нет.** Это не независимое закрытие чужих условий, не подтверждение продукта или итогового gate. Исходные условия, evidence и первоначальный отчёт сохранены; `implementationVerified=true` здесь означает только проверку design/oracles.

- **A11Y-01 — VERIFIED, STATIC.** `05_architecture.md:14,42–46` выбирает mounted tabs: один Tab-stop, Left/Right wrap, Home/End, согласованные selected/controls/labelledby, hidden/inert inactive panel и сохранение drafts. План `06_implementation_plan.md:57,71` называет `project cabinet keyboard tabs preserve drafts and focus` и `project cabinet moderation and password retain keyboard focus` в `tools/visual/project-cabinet.e2e.test.mjs`: реальные keyboard events, после успешной модерации другая доступная action той же карточки, после неуспеха исходная action, до submit cancel — password opener, не body. Это будущие тесты.
- **A11Y-02 — VERIFIED, STATIC.** `05_architecture.md:44–47` определяет имена и обязательность screenshot/URL/text, CSV и пароля; field-specific aria-invalid/describedby и видимую ошибку, alert summary с переходами к полям, общий alert для unknown-field API ошибки, сохранение корректируемых данных, busy/disabled/live status и retry; отдельные DOM/ARIA-tree и ручной keyboard + настоящий screen reader на synthetic test copy для manual/CSV/moderation/password с записью AT/browser/version. Нет AT — unverified. `06_implementation_plan.md:59` называет `project cabinet fields announce validation busy errors and retry`; `spec.md:151–158` содержит PC-08 сценарий. Исполнение не утверждается.

Авторская дельта `author-rework-delta.json` прочитана полностью (SHA-256 `63c7a70afa39110b32d42be26957feb071abaaefc981d9b5a4154bf3ed45501a`), в ней оба ID помечены предложенными исправлениями, а не ранее закрытыми. Самостоятельно прочитаны изменённые восемь design paths, plan и spec; остальные условия оставлены originating reviewers. Новый host nonce `733ac1ec-9eb4-45bb-bbbc-e8391ed7f4ca`, revision `963294a11da2550521f81059a16fa1fc76420c06623aab200d5f916a6c80c009`; **EXECUTED** независимый SHA-256 всех восьми совпал с manifest:

| Host path относительно `features/proofo-ui/project-cabinet/` | SHA-256 |
|---|---|
| `00_complexity_assessment.md` | `b434f62c83e979ade1381e93ebe732d1595ae8add7d8e4eb964ae4e50cafa145` |
| `01_requirements.md` | `b6384fb57634b86fc9233fcf7158d557f8aacc4decb2c26a19084783fd4d9a74` |
| `02_research.md` | `6a20012b05384ca0171dcd0a90c93b174a2f8c4ea108b3cc5ed6d980757d84cf` |
| `03_adr/001-reuse-owned-project-capabilities.md` | `cbea146422ab55773792d6dc3c1ebc2636aa846f8793cabf285d817a8fe7270d` |
| `03_adr/002-scope-cabinet-palette-and-interaction.md` | `540b70501147adc6e8535caf2b9edde3c41fdbac403fc039d9d4e4fbf219933d` |
| `03_adr/003-separate-original-reference-from-live-adaptation.md` | `8764ae09f54a8dee1b3c15ed9f1974eebf76ec9b1bcd6dee81261143dc772bab` |
| `04_domain_model.md` | `1b1acaad1fd6494eec0afc4715e1dfae65f99d3a51db1feb5fd0906859797adf` |
| `05_architecture.md` | `d8bb12a1f4743d10b1d474e23c3f8fa3dbcc3561736ace9933f73a079dbd782c` |

Зависимости вне host: spec SHA `834c9e8bcd3db6851e3b00e24f7196370c48bf6b3afaef18ffc22aa19a622b40` совпадает с `01_requirements.md`; plan `06_implementation_plan.md` SHA `eaf18bc26b1d0f3b3c4a46233e3bd91f592d661e6b9778d46906e115e967673f`, в inventory 24 уникальных targets. В новых рисках assessed: client-state/guard ограничения и awaiting owner decision; новых материальных accessibility conditions в focused scope не выявлено. Клавиатура, accessibility tree, screen reader, контраст и живой продукт не запускались и не измерялись; решение владельца по точным bytes/regions/filled-controls pending, K1/K2/source admission и implementation не выполнялись.
