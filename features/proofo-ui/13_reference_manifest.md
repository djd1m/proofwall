# Первичный неизменяемый эталон трёх экранов

Дата: 11.11.2026. Исполнитель reference/capture: текущий Codex subtask
`/root/dashboard_reference`; фактическая модель унаследована от координатора,
отдельного model override в этом запуске не было. Применены AGENTS,
`visual-testing-advanced/SKILL.md` и `PROOFWALL-INTEGRATION.md`; выбранный
проектом pipeline — Playwright. Это инженерная самопроверка эталона,
не независимое ревью и не приёмка работающего приложения.

## Источник и область согласования

Исходный commit: `e2e2f963b1a0199d597396cfba1aef369b7e969d`.
Git tree `features/proofo-ui/preview`:
`d9acba4e57aacbd35c2736523d08a8874f744b30`.
Все 11 файлов этого дерева, включая HTML, оба CSS, оба JS, WOFF2, favicon
и сопроводительные документы, сохранены побайтово в
`reference/dashboard-v3/resources/`. Данные — синтетический «Тихий берег · демо»,
`tihiy-bereg-demo`, Free, четыре нулевые метрики, пустая стена.
Внешний Proofo, аккаунты, backend и credentials для capture не использовались.

Основание начала — ранее данное владельцем «да давай» для инкремента и трёх
макетов. Сняты только `dashboard`, `branding`, `collect` в исходном `initial-idle`
состоянии на 1440×900, 390×844, 360×800. Форма validation/focus/save, новые
loading/network/error/success состояния и заполненные данные этим не утверждены.
Эти состояния требуют своей матрицы, проверок и согласования.

## Зафиксированный артефакт

Рабочий baseline: [`reference/dashboard-v3/manifest.json`](reference/dashboard-v3/manifest.json).
SHA-256 manifest:
`e7999b11e9fb68cf57f64323c624df5d70693d366d1d69be01a1d7e9e3101684`.
Этот hash дополнительно закреплён в capture/verifier module; изменить PNG вместе
с hashes в manifest недостаточно для успешной проверки. Manifest содержит hashes
всех исходников, девяти PNG и девяти JSON с DOM/fixture measurements.

| Экран / viewport | Полный PNG, px | SHA-256 PNG |
|---|---|---|
| dashboard/1440x900 | 1184 × 997 | 11acc7dc151259c61b8389654c0be6938bfe385cec7f85fd5aaecaeb931d729a |
| dashboard/390x844 | 390 × 1370 | 527e699f2c088f605bb77d7423de2a8dad69b4390a0ff2b21064caba6b51da7c |
| dashboard/360x800 | 360 × 1436 | 6f0b3986592d9831da4048bae26b779227918f04eb684d4b9d74083261580223 |
| branding/1440x900 | 760 × 1041 | 769c1994ca5ffc701b7097f25c19de424e5077642c8517c2b27e7eb20515cb8a |
| branding/390x844 | 390 × 1118 | fa9d177be53f24c23a08b7aca9ce0e2fc104c26344f52ff2c11b3e1e771359d3 |
| branding/360x800 | 360 × 1140 | 0f51f25f22ba54978a5bdf2af260f65b781417b3c21ba383b36ebe19e3271d35 |
| collect/1440x900 | 560 × 1118 | 175636160f339a9a8d667c442f2c65f8f9038084685dd8373a0b995f85d144e2 |
| collect/390x844 | 390 × 1101 | 3aa12ec210f1077fe07d26fcf85265949300e1ba47da8c04d7e23750f5e1fffd |
| collect/360x800 | 360 × 1122 | 45cae2ae5000f33dc99e9eea8945aa0b53b672d5f1c0c50db73ec33872578e55 |

Регион — полный измеренный `main.cab-shell`: верхний бренд/ссылка, article,
для collect также attribution внутри main. Clip width/height явно округляются
вверх; `fullPage:true` позволяет снять весь main при исходном responsive viewport.
После каждого снимка PNG dimensions проверяются против `ceil(bbox)`.
Общий footer вне main содержит prototype-only текст и в регион не входит.
Полноэкранная приёмка остальных областей приложения этим не покрывается.

До capture выполняются ровно две явные нормализации test render context:
`.cab-notice` и `#preview-tools` получают `display:none!important`.
Это заранее названные demo-only элементы; `clean=1` также скрывает navigator.
CSS исходников и продуктовые DOM nodes не меняются. Масок нет. Spacer в app
не добавляется; body paper texture, fonts и позиции совпадают с обычным view.

## Окружение и команды

Node `v22.23.4`, Linux x64, Ubuntu 24.04 LTS, kernel `6.8.0-138-generic`.
Chromium `148.0.7778.97`; executable SHA-256:
`7f5c687c69c06c2b49f80755087b0575fa67633f359b0cdbe2ee40c33235fc98`.
Локальный executable по умолчанию:
`/root/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome`;
другой путь задаётся `PROOFO_CHROMIUM_EXECUTABLE`, но hash должен совпадать.
Playwright `1.65.0`, pixelmatch `8.0.0`, pngjs `7.0.0`: exact versions проверены
через npm registry metadata и согласованы координатором и архитектором.
Изолированные package/lock — `tools/visual/`, root workspace package не менялся.

```bash
PATH="$PWD/node_modules/.bin:$PATH" PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --prefix tools/visual --ignore-scripts
# Уже выполненная первичная фиксация; повторный запуск обязан отказать:
node_modules/node/bin/node scripts/capture-proofo-reference.mjs --approve-source e2e2f963b1a0199d597396cfba1aef369b7e969d
node_modules/node/bin/node scripts/check-proofo-visual.mjs --self-check --screen all --mutations --output /tmp/proofo-reference-selfcheck-v3
# После появления отдельного app fixture server:
node_modules/node/bin/node scripts/check-proofo-visual.mjs --url http://127.0.0.1:PORT/dashboard.html --screen dashboard --mutations
```

Capture работает только при отсутствующем целевом directory, проверяет approved
commit/tree, собирает staging вне репозитория и переносит готовый набор целиком.
Флага update нет. Обычный verifier никогда не создаёт baseline и запрещает вывод
внутрь него, включая путь через symlink. Отсутствующий/повреждённый/лишний ресурс,
изменённый manifest или несовпадающее renderer/tooling окружение дают exit 2.
Расхождение изображения/геометрии/fixture даёт exit 1; успешная проверка — exit 0.

Сравнение: raw RGBA pixel equality + настоящий pixelmatch с `threshold:0`,
`includeAA:true`, `maxDiffPixels:0`. Для каждого case сохраняются actual PNG,
diff PNG, 50% overlay PNG, actual DOM measurements и итоговый report JSON.
DOM дополнительно сравнивает relative boxes, fonts/color/spacing, body background,
видимый текст и значения полей. Ждём local fonts `body`/`display`, network idle,
стабильную геометрию; неожиданный внешний ресурс/HTTP error/page error — отказ.
DPR=1, locale ru-RU, UTC, light, reduced motion, clock 2026-11-11 12:00 UTC,
scroll=0, mouse=(0,0), caret hidden. CSP baseline включена.
Только ephemeral mutation contexts используют `bypassCSP:true` для addStyleTag;
CSS и этот факт явно записываются в actual JSON, baseline files не меняются.

## Фактический порядок и диагностические результаты

До работы прочитаны AGENTS/CLAUDE/workflow/core-CJM/применимые правила,
visual skill/integration doc и выполнен dz recall. Recall вернул нерелевантные
для геометрии записи; они не использовались как доказательство baseline.
Capture/check scripts были созданы **до** получения уточнения координатора
о K1 для support tools. Затем выполнены две настоящие команды:

```bash
npm run dz -- name-check --module capture-proofo-reference --project /home/proofwall --json
npm run dz -- name-check --module check-proofo-visual --project /home/proofwall --json
```

Оба JSON прочитаны: `outcome=free`, `exit=0`, `verdict=free`,
`scan.status=complete`, 226 files / 1 448 228 bytes в `/home/proofwall`.
Это post-creation name-check support tools, **не** pre-creation K1 приложения.
Продуктовый код этим subtask не создавался.

Первый frozen diagnostic v1 ошибочно использовал page screenshot clip без
`fullPage:true`: PNG ограничился пересечением с viewport. Набор не менялся;
координатор разрешил новую техническую фиксацию до реализации приложения.
Исходный v1 побайтово сохранён локально в ignored
`.reference/rejected/proofo-dashboard-v1/`; SHA-256 его manifest:
`5d339392b1092987833562961c1fe2564cea896d3b86a912a6bcd9cda1847191`.
Он не используется для pass. Попытка staging v2 дополнительно обнаружила
округление screenshot height 996 вместо ceil 997; staging не публиковался,
затем задан explicit ceil clip и проверка PNG dimensions.

V2 снял полный main, но сохранял внешний demo banner как источник смещения
body texture. До app creation координатор выбрал каноническое исключение
demo-only элементов перед capture. V2 также сохранён без перезаписи в
`.reference/rejected/proofo-dashboard-v2/`, manifest SHA-256:
`cabeccc628a41bc5145b85ac8bb64ba21887d1142d4a15e7cbe783f3499cf315`.
V2 self-check: 9 положительных raster comparisons дали 0 diff, 18 font/color
mutations обнаружены. Пробный `margin-top:3px` у paper оказался визуальным
no-op из-за схлопывания margin; raster mutation assertion честно покраснел.
Контрольная margin mutation заменена на реальный `h1{margin-left:3px}`.
Диагностические данные — `/tmp/proofo-reference-selfcheck-v2/report.json`.
Ни один из этих диагностических наборов не подменял baseline ради green app;
приложение ещё не сравнивалось.

Итоговый v3 self-check завершился с **exit 0**: все 9 положительных сравнений
дают ровно **0 изменённых RGBA pixels**, DOM boxes/styles/fixture/body совпадают.
Все **27 browser CSS mutations** (по font, margin, color для каждого из 9 cases)
дают реальное raster расхождение. Это не подмена PNG: используется addStyleTag
в отдельном ephemeral browser context, исходные resources не меняются.
Для dashboard 1440×900: font — 4915, margin — 3117, color — 5134 изменённых pixels.
Report, actual, diff и overlays:
`/tmp/proofo-reference-selfcheck-v3/`; JSON:
`/tmp/proofo-reference-selfcheck-v3/report.json`.
SHA-256 этого report:
`29118e526c81146d6ffccfa6a0c1296ad8eb74626fbb6390d922222818f54fc5`.

После capture отдельно проверены byteexact 11 исходников против git blobs
approved commit; целостность всех baseline files; синтаксис двух scripts;
`git diff --check`. На временной **копии** baseline внедрены повреждённый PNG
и подменённый manifest: integrity checker отказал обоим. Повторный capture
существующего v3 вернул exit 2. Verifier output через symlink внутрь baseline
также получил exit 2 до записи. Оригинальный v3 при этих probes не менялся.

Остаются проверки **реального** app presentation fixture через `--url`, затем
live dashboard/API/E2E, дополнительные состояния, независимое QE и ручная
приёмка. Self-check source против source доказывает воспроизводимость capture
и чувствительность comparator; он не доказывает соответствие приложения.
App unit/E2E или приёмка приложения этим документом не объявляются выполненными.

## Исправление tools после независимого ревью: nofollow-v1

Независимый reviewer `/root/dashboard_visual_tools_review` воспроизвёл два
пробела исходных tools: symlink `report.json` внутри разрешённого output directory
позволял перезаписать sentinel; symlink файла шрифта с совпадающими байтами
принимался integrity checker. Эти наблюдения исправлены в tools. Публичный v3
baseline, его ресурсы и manifest **не менялись**; manifest SHA остаётся
`e7999b11e9fb68cf57f64323c624df5d70693d366d1d69be01a1d7e9e3101684`.

Теперь каждый ancestor baseline/resource/input/output path проверяется через
`lstat`; symlink запрещён независимо от совпадения содержимого. Input открывается
через `O_NOFOLLOW`, проверяется regular-file descriptor. Все screenshot/report/
measurement/diff/overlay writes проходят через `O_CREAT|O_EXCL|O_NOFOLLOW`;
Playwright возвращает screenshot buffer, сам по файловому пути не пишет.
Перечень выходных файлов проверяется до browser work и повторно перед каждой
записью. Явный `--output` обязан указывать новый directory с существующим обычным
parent; существующий directory также отвергается. Каталоги результатов создаются
с mode 0700. Для повторного запуска нужна новая output path.

Дополнительно сравниваются точные абсолютные `x/y/width/height` shell bbox и
raster clip при DPR=1, tolerance=0; geometry включена в report. Это уточнение
геометрического контракта плана. Оно не объявляется исправлением доказанного
обхода через translateY: прежний raster diff уже замечал такую контрольную замену.

Новый воспроизводимый набор:
`node_modules/node/bin/node --test scripts/proofo-visual-paths.test.mjs`.
Истинный name-check `proofo-visual-paths` выполнен и прочитан **до создания**
test file: `outcome=free`, `exit=0`, `scan.status=complete`.
**6 tests passed**: same-byte font symlink через настоящий verifier CLI → exit 2;
report symlink и legacy PNG symlink → exit 2 с неизменившимися sentinel bytes;
exclusive writer отказывает существующим symlink/regular files; source/output
ancestor aliases и baseline-directory alias отвергаются. Мутации выполняются на
временных копиях, оригинальный baseline только читается.

Повторный полный self-check tools nofollow-v1: **36 cases passed**, exit 0 —
9 положительных с 0 RGBA diff и совпавшей абсолютной geometry, 27 настоящих CSS
mutations обнаружены. Артефакты:
`/tmp/proofo-reference-selfcheck-nofollow-v1/`; report SHA-256:
`2a71b559f0bef96c11fadad2274180de372535c416b61f2abd4c189c332ed95e`.
Изменение подсчёта bytes в initial-capture branch и нормализация локальных path
не затрагивали render; после них дополнительно повторён весь negative набор.
На временной копии resources также проверен `translateY(3px)` у shell:
настоящий verifier CLI вернул exit 1, оба absolute clip checks дали mismatch
для всех трёх dashboard viewports; raster также отличался. Копия затем удалена.

SHA-256 исправленных исходников для focused review:

| Файл | SHA-256 |
|---|---|
| scripts/capture-proofo-reference.mjs | 288afb457e1f089c9b173b01cb9822d18eb7b2f8b76289e185950b3ffef434b1 |
| scripts/check-proofo-visual.mjs | 9e74df16a924788c140c7cc610c85b908a2af23547c157ea6e00fca7a998fc83 |
| scripts/proofo-visual-paths.test.mjs | 9ebdde7372b3f817ebce3dda9e7ebb1d0cf90b5055a3147fd7fbba1009d2fc53 |

Это авторские результаты исправления. Focused verdict независимого reviewer
фиксирует координатор отдельно; результаты app verification ими не подменяются.
