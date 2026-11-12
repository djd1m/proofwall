# Независимое QCSD: качество пользовательского пути

**Вердикт: CONDITIONAL.** Три структурных условия HIGH, критических находок нет. Это предварительная статическая оценка замысла, не проверка реализации и не приёмка сайта. Согласование конкретного предложения владельцем пока ожидается; это уже предусмотренный предкодовый gate, а не установленный дефект продукта. Условия и границы снимка приведены в `qcsd-ux-entry.json`; верификаций исправления нет.

Роль: `qe-qx-partner`, независимый `qcsd-ux`, family `codex`, фактически сконфигурированный запуск `gpt-6.1-terra` / `xhigh`, отдельный контекст без истории автора; автор архитектуры по handoff — `gpt-6-astra` / `xhigh`. Это provenance конфигурации, не независимая provider telemetry. Полная роль прочитана из upstream commit `98f241fc8b9d48d017cbdb63ab890104e30397d0`, `.claude/agents/v3/qe-qx-partner.md`, SHA-256 содержимого `e0bc536f296843843ae0a5cbe5e4d6fc1f8e3c0e3443068d22567585fc2f9144`. Прочитаны правила проекта, интеграция QE, полный ideation skill и относящиеся к этой роли шаги 3–4. Отдельный установленный `qx-partner` skill не найден. Численные QX/UX, корреляционные и продуктовые оценки не вычислялись: нет измерений пользователей или разрешённого запуска анализатора; оценка тестируемости здесь качественная.

## Наблюдения и путь

- **STATIC, onboarding/recovery:** PC-02, требования FR-302 и архитектура предусматривают allowlisted уведомления, постоянный verify/reissue и шаги к реальным секциям; статус completion опирается на сохранённые отзывы и установки, просмотр кода установкой не считается. Реальное поведение ещё не проверено.
- **STATIC, импорт:** предложение `preview/index.html:11–19` явно сообщает об отсутствии OCR и извлечения по URL; screenshot-only допустим, CSV демонстрируется отдельно. Его локальный парсер и демонстрационные файлы не являются серверной валидацией. Исходный `platform-form.tsx:64–75` позволяет screenshot либо URL+текст и поддерживает paste; существующий CSV — отдельные preview и commit. Замечания UX-01–02 ниже важны для сохранения смысла этих шагов.
- **STATIC, модерация и показ:** PC-04 описывает четыре статуса, допустимые переходы и provenance; предложение содержит synthetic empty/filled cards, явно не наблюдавшийся заполненный Proofo. PC-05 и proposal выставляют wall, collect, branding и snippet сразу при пустом проекте; открытие кода не означает установку. Реальная работа и публичная видимость не наблюдались.
- **STATIC, billing/password:** PC-06–07 и задачи 5/8 сохраняют фактическую тарифную конфигурацию, N3, идемпотентность, восстановление при ошибке и сессии после смены пароля. Статический preview показывает только синтетические состояния и отключённую форму; оплата, email и авторизация не выполнялись.
- **STATIC, proposal и доказательства:** publication report фиксирует `static-proposal-published`, `productImplementation: false`, `ownerDesignApproval: pending`; `preview/README.md` прямо ограничивает смысл демо. Нельзя считать это утверждённой адаптацией или наблюдённым populated Proofo. PC-09 и ADR-003 правильно разделяют immutable original, same-production-view offline и полноценные живые снимки; пробел связи с будущими утверждёнными областями — UX-03.

## Условия и сценарии отказа

### UX-01 — HIGH: CSV commit может расходиться с увиденным preview

**STATIC:** `apps/web/src/app/dashboard/[slug]/import-form.tsx:22–35,58–65,101–104`: запрос preview и commit использует текущие `csv` и `mapping`, но изменение индексов меняет mapping без сброса `preview`; доступность commit зависит от старого preview. Выбор нового файла отдельно сбрасывает его (`:43–47`). Нормативный PC-03 обещает отдельное обоснованное решение после preview; `05_architecture.md:15` сохраняет текущие state machines, задача 4 не описывает смену mapping после preview. Это статическая возможность в существующем коде, а не исполненный эксперимент.

Три режима риска: перестановка имени и текста приводит к иному содержимому; переход к пустой колонке меняет число отклонений; после нового file/mapping пользователь может полагаться на старые данные, если новая композиция утратит инвалидирование. **Условие:** связать preview с точным содержимым CSV и mapping; каждое изменение инвалидирует preview и блокирует commit до повторного успешного preview, не стирая draft. Явно разрешить нужное изменение client state при неизменном API. Именованный UI oracle: preview → изменение mapping → commit недоступен → новый preview → commit показанного набора; отдельно изменение CSV и неуспешный preview/commit. Никакого ложного успеха.

### UX-02 — HIGH: сохранение сложного черновика недостаточно наблюдаемо

**STATIC:** `05_architecture.md:13–15` требует mounted drafts и отсутствие ненужного reset; задача 4 плана упоминает switching, screenshot и error/retry, но не задаёт точные значения и проверку payload для paste, File, полей ручного ввода, CSV и mapping. `platform-form.tsx:48–55,67–75` хранит File и обрабатывает вставку изображения; `import-form.tsx:15–18,43–47` хранит CSV/mapping и preview. PC-03 требует recoverable input, поэтому общий текст «draft сохраняется» оставляет неясный oracle.

Три режима риска: потеря вставленного снимка при размонтировании вкладки; сохранение видимого имени файла при потере фактического File в retry; stale CSV preview/mapping после смены метода или ошибки. **Условие:** явно определить сохранение paste/выбранного File, URL, текста, дополнительных полей, CSV/mapping и валидности preview через переключение и recoverable error/retry; после успеха очищается только успешно отправленный draft. Именованный ordinary UI oracle должен делать round-trip между обоими методами, проверить paste и file, 400/429/503/network, фактическое содержимое повторного запроса и отсутствие ложного успеха. Сохранение после reload не обещается.

### UX-03 — HIGH: у согласованного предложения нет назначенного oracle соответствия

**STATIC:** `03_adr/003-separate-original-reference-from-live-adaptation.md:17–18` и `05_architecture.md:21–23` требуют строгую проверку выбранных регионов original с literal model и отдельные full live изображения; план `06:10,15–16` требует approval bytes и оригинального reference, но не определяет, как критерии будущего решения владельца проверяются на реальной адаптации. Знание hash или наличие screenshots само по себе не показывает, что нужные элементы соответствуют утверждённому предложению.

Три режима риска: адаптированные заполненные карточки исчезают при сохранённом original header; кнопки переставляются/пропадают внутри исключённых slots без падения original diff; демонстрационный модельный рендер скрывает расхождение с ordinary persisted экраном. **Условие:** до product writes связать реальное решение владельца с конкретными bytes/hash и областями предложения, включая заполненные/controls; назначить viewport, selectors/координаты, критерий сравнения и named oracle для выбранных применимых областей, отдельно указав несовпадающие состояния. Приложить полные ordinary live empty/filled/error/mobile screenshots. Offline original comparison остаётся отдельным доказательством; не требуется искусственное полное совпадение разнокомпонентных страниц или переписывание baseline.

## Метод, границы и зависимости

**EXECUTED:** независимый SHA-256 подсчёт 8 путей host manifest совпал с подготовленным snapshot во всех восьми случаях; нормативный spec совпал с hash, указанным в `01_requirements.md`. Команда: Python `hashlib.sha256(Path(p).read_bytes()).hexdigest()` по `snapshot.manifest` и перечисленным дополнительным зависимостям. Снимок revision `a02e007567b6e585aee8f6a15b2d563d21c6bd0e54207cd6ebfb1e43ee0cfa62`, nonce `0fef60e0-1ec5-4cd4-b693-c9991c49a4cc`.

| Путь measured host | SHA-256 |
|---|---|
| `00_complexity_assessment.md` | `86e6ca35254d7fe7defc12d068e597b84d3f2b60a21c41d6259582b00bc1007d` |
| `01_requirements.md` | `572d68fb62307f755824d09d1e55cbfe3c2df9389c10de6b165ec2366b660a53` |
| `02_research.md` | `d15adf498857d82350df96822626444e896f8451c85c114f3554b64f2d5a6ba0` |
| `03_adr/001-reuse-owned-project-capabilities.md` | `fb4ef2e82a09d3449203691f629b191dd3ad46b155ab6bb234f3296e09f69375` |
| `03_adr/002-scope-cabinet-palette-and-interaction.md` | `68287d023834f6194860bfa3f220cf1a1ef61ff69b805de3918427ccd8c53556` |
| `03_adr/003-separate-original-reference-from-live-adaptation.md` | `1028ab4bfd082c82bc742eb909a368fb0a7739cc5a7bb1167308747c25e97c29` |
| `04_domain_model.md` | `c2c6b701b5161b34d910ba002ed4397a3e0bbe9a13db2427c9ef50f4c3546742` |
| `05_architecture.md` | `6e6453b2325ad89f0326cebfda40072470cecf2c65f165d4f9d7987702452a62` |

Все пути таблицы относительно `features/proofo-ui/project-cabinet/`. Дополнительные зависимости **не входят** в 8 measured host paths:

| Файл | SHA-256 |
|---|---|
| `openspec/changes/proofo-project-cabinet/specs/project-cabinet/spec.md` | `aa16c0134dbd7decdc4e7d1ec8f7c323a0f79df0436a196bb32b87fb1b7e4ff7` |
| `features/proofo-ui/project-cabinet/06_implementation_plan.md` | `f6a4eb1601e4683a1478ce05130a71ee3d8b54eac926ef97cee843fdc9b87efd` |
| `features/proofo-ui/project-cabinet/design-adaptation.md` | `c83260191723fc8cfe78e387d5429c4cb08021aac2d544484f906b3dabec9143` |
| `features/proofo-ui/project-cabinet/preview/README.md` | `963274ca9b665236f5addbcc8c3942f67472a414a2bfe531605492b170bb1d4c` |
| `features/proofo-ui/project-cabinet/preview/index.html` | `ab7bab18e7c6543fca03eb79bb35869d465597a9648acf3edb369b1de1f41c9c` |
| `features/proofo-ui/project-cabinet/preview/proposal.js` | `b2252e7ce7342c4b54ed632234ce515ef43a9f7077204a88d9fcbee0a10be119` |
| `features/proofo-ui/project-cabinet/preview/proposal.css` | `fe959c30e5faa362adc28ec7be5212dfaae3b989785592fe941e040ed2e96a42` |
| `features/proofo-ui/project-cabinet/evidence/proposal-publication.json` | `940bdeb9e2c4f1c8bdd8c74224d2792dd96f64ae0f280d5aca74905b7a6376ce` |
| `apps/web/src/app/dashboard/[slug]/platform-form.tsx` | `e7275234e413c2fb34faf0281c903f613e76fc1bd27be458cdd51a92c7fffb14` |
| `apps/web/src/app/dashboard/[slug]/import-form.tsx` | `eb31877814364a440c84e34a3511c5ca39ed44de73be9f2bb6c7d4491548a947` |

Оценка получена статическим чтением, без browser fetch, скриншота, запуска сервера, тестов, AQE MCP/CLI, сети, внешних провайдеров, записей памяти или продуктовых изменений. Полный upstream role рекомендует анализатор, HTML и persistence, однако это отдельное предварительное ревью с явным ограничением на собственные два выходных файла и без provider/test/server операций; их успешное выполнение не заявляется. Никаких фактических показателей конверсии, успешности, accessibility или размера выборки нет. Изменения необходимо повторно независимо проверить после корректировки snapshot; structural verification не равна продуктовым тестам.

## Повторная независимая проверка исправленного дизайна

**Результат: CLEAN по трём структурным UX-условиям для revision `963294a11da2550521f81059a16fa1fc76420c06623aab200d5f916a6c80c009` / nonce `733ac1ec-9eb4-45bb-bbbc-e8391ed7f4ca`.** Это заключение только о договорённостях дизайна и запланированных oracle; `implementationVerified: true` в записи означает проверку исправленного дизайна, а не реализацию или прохождение тестов. Фактическое owner approval отсутствует и остаётся отдельным обязательным gate до product source writes.

- **UX-01 — verified structural.** PC-03 и `05_architecture.md` определяют точный snapshot CSV и mapping, инвалидирование при любом изменении, stale generation, блокировку pending controls и commit показанного snapshot. FR-303 и AM-11 называют будущий live oracle; он не выполнялся.
- **UX-02 — verified structural.** PC-03 и `05_architecture.md` определяют mounted drafts, paste/file и hash фактических screenshot bytes в multipart, остальные поля и CSV/mapping, сохранение через switching и 400/429/prewrite503/network, только свою очистку при успехе и честный неизвестный исход network failure. FR-303 и AM-12 назначают будущие oracles; они не выполнялись.
- **UX-03 — verified structural с отдельным ожидающим gate.** ADR-003 задаёт точные URL/4 hashes, предложенные O0–O2/A0–A7 и 3 viewport, mapping selectors, токены/геометрию/action order, named live oracle и отдельные полные снимки. PC-09, FR-309 и AM-13 связывают решение об этих bytes и областях с precode gate. **Решение владельца ещё не получено**, регионы лишь proposed; никто не утверждает их approved, текущий clean не разрешает source writes и не доказывает визуальное соответствие.

Авторский `author-rework-delta.json` и handoff прочитаны: автор указал три UX-ID как addressed, не closed; независимая проверка относится к текущему snapshot. `01_requirements.md` указывает текущий нормативный spec SHA `834c9e8bcd3db6851e3b00e24f7196370c48bf6b3afaef18ffc22aa19a622b40` и привязки FR-303/FR-309; план содержит AM-11–13 и 24 ожидаемых targets. Дополнительный `06_implementation_plan.md` SHA-256 `eaf18bc26b1d0f3b3c4a46233e3bd91f592d661e6b9778d46906e115e967673f`, он не входит в 8-path snapshot.

**EXECUTED:** независимо подсчитаны SHA-256 каждого из 8 host paths; все совпали с подготовленным manifest. Нормативный spec и четыре proposal файла также пересчитаны и совпадают с заявленными hashes. Текущие measured hashes:

| Путь относительно project-cabinet | SHA-256 |
|---|---|
| `00_complexity_assessment.md` | `b434f62c83e979ade1381e93ebe732d1595ae8add7d8e4eb964ae4e50cafa145` |
| `01_requirements.md` | `b6384fb57634b86fc9233fcf7158d557f8aacc4decb2c26a19084783fd4d9a74` |
| `02_research.md` | `6a20012b05384ca0171dcd0a90c93b174a2f8c4ea108b3cc5ed6d980757d84cf` |
| `03_adr/001-reuse-owned-project-capabilities.md` | `cbea146422ab55773792d6dc3c1ebc2636aa846f8793cabf285d817a8fe7270d` |
| `03_adr/002-scope-cabinet-palette-and-interaction.md` | `540b70501147adc6e8535caf2b9edde3c41fdbac403fc039d9d4e4fbf219933d` |
| `03_adr/003-separate-original-reference-from-live-adaptation.md` | `8764ae09f54a8dee1b3c15ed9f1974eebf76ec9b1bcd6dee81261143dc772bab` |
| `04_domain_model.md` | `1b1acaad1fd6494eec0afc4715e1dfae65f99d3a51db1feb5fd0906859797adf` |
| `05_architecture.md` | `d8bb12a1f4743d10b1d474e23c3f8fa3dbcc3561736ace9933f73a079dbd782c` |

Продукт, браузер, тесты, сервер, provider и source admission не запускались; K1/K2 также не заявляются. Корреляционные/UX метрики не измерялись. Существующий первоначальный отчёт сохранён выше как историческое свидетельство.
