# Контракт встраивания: изолированная QA-копия

**Встраиваемый виджет:** да
**Origin виджета:** http://127.0.0.1:33187
**Origin хозяйской страницы:** http://widget.synthetic.test:33189
**Учётные данные:** нет
**Разрешённые origin:** *
**Проверка на чужой странице:** ВЫПОЛНЕНА

Это контракт локального QA-артефакта branding/collect. Он не подтверждает публичную
test-публикацию или production. Hostname `widget.synthetic.test` направляется на loopback
только параметром тестового Chromium; DNS машины не меняется. Script загружается с
origin QA-приложения, имя берётся из `apps/web/public/widget-manifest.json` после сборки.
Страница проверки: `http://widget.synthetic.test:33189/widget?slug=<synthetic-slug>`.
Оба origin относятся к существующей изолированной оснастке, не к публичному стенду.

Запрос `/api/widget/config` выполняется с `credentials: 'omit'`, без Authorization;
ответ содержит `Access-Control-Allow-Origin: *`, OPTIONS разрешает GET/OPTIONS.
Owner session и cookies для чтения конфигурации не нужны. `domain` — hostname хозяйской
страницы, не origin скрипта. Аналитический `sendBeacon` не является authenticated API;
его браузерное поведение и доставка события не доказываются GET-проверкой CORS.

## Изоляция и возможности браузера

Widget находится в ShadowRoot, CSS начинается с `:host { all: initial }` и не добавляет
правила в light DOM. Host CSS и script должны продолжать работать после mount.
В современном браузере `injectScopedStyles(root)` создаёт CSSStyleSheet через
`root.ownerDocument.defaultView`, вызывает replaceSync и добавляет sheet в
`root.adoptedStyleSheets`, сохраняя предыдущие sheets. Inline `<style>` в этой ветке нет.

API требуется в realm того же Document: это ограничение описано в
[MDN adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets).
[MDN replaceSync](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/replaceSync)
описывает синхронное заполнение constructed sheet. Эти ссылки объясняют API, но сами
по себе не доказывают совместимость со всеми CSP и браузерами. Проверяемая цель —
закреплённый Chromium 148.0.7778.97 под фактическим ограничительным CSP оснастки.

Если constructed stylesheets/adoptedStyleSheets отсутствуют, остаётся прежний
`<style>` внутри ShadowRoot для legacy браузеров с разрешёнными inline styles.
Этот fallback **не поддерживает strict-CSP контракт**. Ошибка поддерживаемой adoption
пробрасывается; она не превращается молча в заблокированный inline fallback.
Bootstrap дополнительно задаёт shadow host block layout и ограничивает его ширину;
actual E2E проверяет геометрию document, host и ShadowRoot раздельно.

## CSP хозяйской страницы

Фактический response header host из общего rebuilt QA run 12.11.2026 записан в
`.secrets/branding-repair-e2e-measurements.json`, поле `widgetContract.policy`:

```text
default-src 'none'; script-src 'self' http://127.0.0.1:33187; connect-src http://127.0.0.1:33187; img-src http://127.0.0.1:33187 data:; style-src 'self'; base-uri 'none'; object-src 'none'
```

`script-src` разрешает QA widget origin и внешний host script; `connect-src` — QA API;
`img-src` — QA photo origin и data preview; `style-src 'self'` разрешает отдельный hostile
host CSS, без `unsafe-inline`. Фреймы не используются и запрещены через
`default-src 'none'`. Публичные origin и директивы для них проверяются отдельно после
test-публикации.

Фактический rebuilt файл: `http://127.0.0.1:33187/widget.0837c760.js`,
SHA-256 `0837c76006f9782264ca52f036c643ca1d9d04eada3ebfe92a1f5361967d132e`.
Chromium 148.0.7778.97; повторный прогон `.secrets/branding-repair-e2e-verified.log`:
14 PASS, 0 FAIL, 0 skipped. Measurements записывают `credentials: omit`, CORS `*`, оба
origin и точный header. Это локальная QA-сборка, не публичный адрес поставки.

Дополнительный авторский probe actual source bundle (без Next/БД, ответы HTTP
перехвачены браузером, listener не создавался) выполнен на тех же раздельных
hostname/origin в Chromium 148.0.7778.97. Его фактический response header:

```text
default-src 'none'; script-src 'self' http://127.0.0.1:33187; connect-src http://127.0.0.1:33187; style-src 'self'; img-src http://127.0.0.1:33187 data:; frame-src 'none'; object-src 'none'; base-uri 'none'
```

`.secrets/branding-csp-widget-browser-probe.json` фиксирует source SHA, bundle SHA,
host script marker и cross-origin config без cookie/Authorization. Repaired bundle:
один adopted sheet, ноль inline style nodes, dark surface rgb(24,24,24), white text,
font 14px, card padding 16px. Негативная замена того же CSS на inline `<style>` только
в памяти страницы вызвала CSP violation: background transparent, magenta text,
font 13px, padding 0. Это проверяет механизм исправления на synthetic config;
ordinary QA deployment и реальный moderation/data flow этим не доказаны.

## Классы отказа

| Класс | Статус | Признак у клиента | Лечение | Доказательство |
|---|---|---|---|---|
| перекрёстный-запрос | ПРОВЕРЕН | Браузер отбрасывает config response, хотя сервер ответил | GET без credentials, ACAO *, отдельный origin | http://widget.synthetic.test:33189/widget — `branding collect real flows`, helper `widget()` проверяет actual config 200 и ACAO *; `.secrets/branding-repair-e2e-verified.log`, `widgetContract` в measurements, 12.11.2026 |
| протечка-стилей | ПРОВЕРЕН | Host reset меняет widget либо widget ломает host | ShadowRoot, собственный reset; проверить оба направления и host script | http://widget.synthetic.test:33189/widget — `branding contrast covers accent text and accent fill`, `live forms and widget reflow without truncation`: actual computed styles, host marker magenta, host script running; document/host/ShadowRoot geometry при 320/360/390 обеих themes; тот же verified log и measurements |
| политика-безопасности | ПРОВЕРЕН | CSP блокирует inline stylesheet, теряются computed styles | Constructed sheet в ownerDocument realm без требования unsafe-inline | http://widget.synthetic.test:33189/widget и http://widget.synthetic.test:33189/inline-mutant — `strict CSP accepts constructed scoped CSS and detects an inline injector`: zero inline nodes, adopted sheet, computed font/background/padding; обратный inline mutant пойман; `strict-csp-inline-mutant: killed` в measurements, тот же verified log |

## Проверка объявления

Полностью прочитанный upstream utility сохранён отдельно от product source:
`.secrets/upstream-check-embed-contract.cjs`, upstream commit
`3b84e9ef5ce68fdbdcf34e0d1671bace8006aff4`, provenance —
`.secrets/upstream-check-embed-contract-source.json`.
Команда: `node_modules/node/bin/node .secrets/upstream-check-embed-contract.cjs /tmp/proofwall-branding-collect`.
До общего run черновик честно давал exit 2; лог —
`.secrets/branding-csp-embed-check-pending.log`. Финальная проверка объявления записывается
в `.secrets/branding-csp-embed-check-final.log`. Exit 0 этого utility проверяет только
полноту объявления и foreign origin, а не браузерную работу виджета. Независимое
повторное QE, owner acceptance и public widget probe остаются отдельными этапами.
