# Независимый bounded ops review тестовой копии dashboard

Дата: 11.11.2026. Reviewer: `qe-integration`, отдельная операционная проверка после initial product review. **Вердикт: NO-GO для публичного подключения текущего процесса до устранения OPS-1.** Изоляция порта БД и отдельного volume подтверждена; существенная проблема — подготовленный Next-процесс работает от root с широкими capabilities. Это не меняет initial product entry и не относится к его manifest.

Проверка только чтением: перечисленные документы/configs, ограниченные `systemctl show`, `/proc/<pid>/status` без environ, `docker inspect` с явным allowlist полей без Config.Env, `ss`, `stat`, `systemd-analyze verify`, anonymous HTTP GET к приватному backend. Env/access-файлы не читались и не печатались. Reload/restart/публикация/изменение production не выполнялись.

## SHA-256 входов

Зафиксированы все четыре переданных входа, включая отдельный prepared descriptor:

| Вход | SHA-256 |
|---|---|
| `features/proofo-ui/14_test_preview_operations.md` | `6f8af243d6942f4b7d3ba797f818e9c386b3e77d55e78101c74a9ffea1356fbd` |
| `features/proofo-ui/evidence/dashboard-final/operations-prepared.json` | `ade9290e28aacebeeba6ac26ee9ee7c5db73d453bb3cadd1a0643a25c21835ec` |
| `/home/proofwall/.secrets/ui-preview/proofwall-ui-preview.service` | `d42518267e53f04f549183a6379bb641b304a3eeed73d50cbede632218221cf6` |
| `/home/proofwall/.secrets/ui-preview/Caddyfile.proposed` | `98316f0aa5f8c6c348f0de316f84bd44c41302704440ae98e0ef43d2078222b8` |

Установленный `/etc/systemd/system/proofwall-ui-preview.service` имеет тот же SHA, что подготовленный unit. Unit и proposed Caddyfile принадлежат root, mode 0600. Проверка `systemd-analyze verify` завершилась без замечаний, exit 0; это проверка синтаксиса/ссылок unit, не изоляции и не reboot test.

## Находки

### OPS-1 — HIGH: публичный preview-процесс запускается с полномочиями root хоста

Файл: `/home/proofwall/.secrets/ui-preview/proofwall-ui-preview.service:6` — секция Service, строки 7–15. `User`/`Group` не заданы; `NoNewPrivileges=true` в строке 13 оставляет уже полученные root-права. Нет filesystem namespace restrictions или отдельного пользователя, который отделял бы preview от соседних сервисов.

Независимое наблюдение текущего unit: `ActiveState=active`, `SubState=running`, `MainPID=3481224`, `User=`/`Group=` пусты, `DynamicUser=no`, `ProtectHome=no`, `ProtectSystem=no`, `PrivateUsers=no`, `ReadOnlyPaths=`/`ReadWritePaths=`/`InaccessiblePaths=` пусты. `/proc/3481224/status`: `Uid: 0 0 0 0`, `Gid: 0 0 0 0`, `CapEff: 000001ffffffffff`, `NoNewPrivs: 1`. То есть речь о фактическом effective UID, а не только о недостающей строке шаблона.

Сценарий: будущий virtual host проксирует внешние запросы непосредственно в этот Next. Ошибка исполнения кода или опасная операция в preview получит root-доступ к общему хосту. Отдельные DATABASE_URL/SESSION_SECRET и volume не предотвращают чтение/изменение файлов соседних сервисов таким процессом. Эксплуатация приложения и чтение чужих секретов не выполнялись; finding о доказанной границе полномочий, а не об обнаруженном RCE.

Условие до публикации: запускать preview от выделенного непривилегированного пользователя с доступом к своему artifact/runtime и своим настройкам, ограничить доступ к остальным данным хоста. Проверить effective UID/capabilities нового процесса и необходимые права на runtime; заново выполнить private backend smoke. Выбор конкретного сочетания Unix permissions и systemd sandbox — задача операционного автора. Одного `NoNewPrivileges` недостаточно.

### OPS-2 — WARNING: срок жизни и восстановление preview после перезагрузки не определены

Файлы: unit строки 8–12 и `14_test_preview_operations.md:12–18,36–40`. `WorkingDirectory` и executable указывают в `/tmp/proofwall-ui-dashboard`; фактический unit сейчас `disabled` (`systemctl is-enabled`, exit 1). `Restart=on-failure`, `RestartSec=5` обеспечивают повтор запуска активного unit при сбое, но не обеспечивают автозапуск после reboot или сохранность артефакта в `/tmp`. У процесса уже `NRestarts=2`; причины и сценарий восстановления не исследовались.

Это допустимо для явно короткоживущего review-стенда, если автор фиксирует этот режим. До выдачи стабильной ссылки нужно указать срок жизни и поведение после reboot: либо воспроизводимое ручное восстановление, либо persistent artifact и соответствующий автозапуск. БД имеет отдельный named volume и `restart=unless-stopped`, однако это само по себе не запускает disabled web unit. Reboot/restart не выполнялись, поэтому успешное восстановление не утверждается.

## Проверенные операционные свойства

| Область | Фактическое доказательство и предел |
|---|---|
| БД | Docker inspect: `proofwall-ui-preview-postgres`, image `postgres:16-alpine`, `restart=unless-stopped`, volume `proofwall_ui_preview_data` → `/var/lib/postgresql/data`; опубликован только `127.0.0.1:33184`. Отдельный volume и bind подтверждены. Содержимое БД/21 миграция/синтетичность rows не проверялись без env/access |
| Next bind | `ss` показывает только `172.21.0.1:33183`, PID совпадает с systemd; нет listener на wildcard. Это доступ из сети Docker bridge/хоста, не публичный bind. Проверка firewall/внешней маршрутизации не выполнялась |
| Маршруты backend | `GET /login` → 200; `GET /dashboard` → 307 на `/login?next=/dashboard`; `/dashboard.html` и `/__test/dashboard` → 404. Cookie не создавалась, credentials не использовались |
| Отдельный Caddy host | Prepared config содержит один новый host `ui-proofwall.78.17.53.233.sslip.io` с proxy `172.21.0.1:33183`, noindex/nofollow и no-store. Старый site по-прежнему направлен в `web:3000`, static design handler остаётся внутри старого блока |
| Сохранность старого блока | SHA точного byte-prefix proposed до добавленного host — `c33acf48cda108f987ad9b9d339c027333f84f8b0b044fdc70f863d19cfde474`, совпадает с `existingCaddyfileSha256` в prepared descriptor. Это независимая сверка bytes proposed с записанным old digest; текущий production Caddyfile дополнительно не читался |
| Caddy validation/reachability | Координатор сообщил validate exit 0 и backend login из Caddy exit 0. В переданном prepared JSON нет сырых результатов этих двух проверок; reviewer их не повторял внутри production Caddy container. Прямой anonymous backend GET подтверждён самостоятельно |
| Сессии | Исходный `apps/web/src/lib/session.ts:48–64` использует HttpOnly, SameSite=Lax, Path=/, Secure при NODE_ENV=production; Domain отсутствует, поэтому cookie host-only. Новый hostname не должен разделять cookie со старым. Фактические NODE_ENV/BASE_URL/отдельный secret не проверялись из-за запрета чтения env, обычный login по будущему HTTPS ещё обязателен |
| Откат | План требует backup, восстановления прежнего Caddyfile и reload при неуспехе. При точном восстановлении блока новая публикация удаляется без переключения старой БД/сайта. Наличие конкретного backup и работа rollback не проверены; перед действием должны быть фактический backup/digest и проверка старого host/static preview после reload. Unit и отдельный volume при таком откате сохраняются; уничтожение данных не требуется |
| Честность preview | План явно называет temporary review, dashboard-only acceptance, старый project route, будущие branding/collect и отключённые письма/платежи/S3. `operations-prepared.json` содержит `published:false`. В config есть поисковое исключение, но нет пользовательского preview-banner; ограничения должны сопровождать выданную владельцу ссылку |

## Предел вердикта

Этот отчёт не утверждает доверенный HTTPS, обычный вход на будущем hostname, effective Secure cookie, отсутствие production ключей в процессе, содержимое private DB, успешность перезапуска/rollback или отсутствие внешней сетевой доступности bridge. Соответствующие credentials/env не читались; опубликованный стенд ещё не существует в рамках проверки. Утверждение о независимом session secret и отсутствии внешних provider keys остаётся заявлением операционного автора до отдельного безопасного подтверждения.

После исправления OPS-1 нужен focused ops review новых unit/report SHA и текущего effective UID. OPS-2 требует явного решения о жизненном цикле preview. Initial `qe-integration-entry.json` и product review не изменялись; финальный delivery digest должен связать именно фактическую принятую ревизию отдельного ops-отчёта.
