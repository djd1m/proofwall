# Focused ops review: закрытие OPS-1 и OPS-2

Дата: 11.11.2026. Reviewer: `qe-integration`, независимая проверка фактического runtime. **OPS-1 — CLOSED; OPS-2 — CLOSED. Вердикт focused ops: clean по двум сохранённым условиям.** Новых незакрытых существенных ops-находок не осталось. Это не публикация и не подтверждение полной работоспособности всех API.

Исходный `operations-review.md` сохранён побайтово, SHA-256 `92f98eb3618259370a13e2accd00988c96411c8b730a99ad5f4834e5e3e2f532`. Его первоначальные условия не удалены и не переопределены; ниже зафиксирована их проверка после реального исправления. Initial product entry не изменён: `qe-integration-entry.json` SHA-256 `d564761b44a4a5f712373d77ed62a2d8e1b0087b2fcf895e14ab38b7a94998d9`.

## Точные входы принятой ops-ревизии

| Вход | SHA-256 |
|---|---|
| `features/proofo-ui/14_test_preview_operations.md` | `e0fcbd5cf01d977637b955fb1a38a28d1b233911ec94ff20891c1431bda07689` |
| `features/proofo-ui/evidence/dashboard-final/operations-artifact.json` после packaging repair | `d21516d5565a680078ae23e2919cfdec801ea28c0f7584c9761fd8c698925056` |
| `features/proofo-ui/evidence/dashboard-final/operations-isolation.json` | `15383ffa68336ed7b6e1b0acd029b1b41f0640460439e25d2f709d4ca1dfc884` |
| `/home/proofwall/.secrets/ui-preview/proofwall-ui-preview.service` | `7325fe7d50971bd43647b14fc730a7e5841fa07e34f5c8207784f350d8533287` |
| Установленный `/etc/systemd/system/proofwall-ui-preview.service` | `7325fe7d50971bd43647b14fc730a7e5841fa07e34f5c8207784f350d8533287` |
| `/home/proofwall/.secrets/ui-preview/Caddyfile.proposed` | `98316f0aa5f8c6c348f0de316f84bd44c41302704440ae98e0ef43d2078222b8` |
| Собственное evidence `operations-focused-predicates.json` | `3f4dde32dcbb7d3c941a9040a9e3c27a2af6bd87e865c5b075eb58516d1b93a9` |

Исторический `operations-prepared.json` остался с SHA `ade9290e28aacebeeba6ac26ee9ee7c5db73d453bb3cadd1a0643a25c21835ec`. Его старый serviceSha `d425…` относится к первоначальному подготовленному root-unit, не подменён новым SHA и не используется здесь как текущая authority. Текущие bytes unit сверены напрямую с installed unit и новым isolation report.

## OPS-1 — HIGH, закрыто фактической проверкой

Сохранённый смысл: публичный preview не должен исполнять приложение как root с доступом к соседним данным хоста. Исправление в unit: строки 8–9 задают отдельные `User=proofwall-preview`/`Group=proofwall-preview`; 18–26 задают PrivateDevices, ProtectHome, ProtectSystem=strict, ограниченный writable cache, RuntimeDirectory, пустые capability sets и RestrictSUIDSGID. EnvironmentFile загружает systemd manager, файл не открывается приложением напрямую.

Независимые наблюдения:

- Unit active/running; `MainPID=3497848`, `NRestarts=0`. `/proc/3497848/status`: все четыре UID = 20001, все GID = 988, supplementary group только 988. `CapEff`, `CapBnd`, `CapAmb` = `0000000000000000`; `NoNewPrivs=1`.
- `getent passwd` показывает `/nonexistent` и `/usr/sbin/nologin`; `id proofwall-preview` не содержит Docker group. Текущие `ProtectHome=yes`, `ProtectSystem=strict`, `PrivateDevices=yes`, capability sets пусты.
- `/proc/<pid>/cwd` и `/proc/<pid>/exe` действительно находятся внутри `/opt/proofwall-ui-preview/artifacts/u0skKIAfRIAw4AJWplbBw`, а не в старом `/tmp` worktree.
- `findmnt -N 3497848` показывает VFS mount `/` как `ro,nosuid`, а отдельный `.next/cache` как `rw,nosuid`. Это дополнение к access predicates, а не вывод только из текста unit.

Собственный повтор access predicates выполнен внутри **mount namespace действующего процесса**: `nsenter --target 3497848 --mount`, затем `setpriv --reuid 20001 --regid 988 --clear-groups --no-new-privs --inh-caps=-all --bounding-set=-all --ambient-caps=-all`, затем только `/usr/bin/test`. Содержимое файлов не читалось.

| Predicate | Ожидание / наблюдение |
|---|---|
| `-r /home/proofwall/.env` | false / false |
| `-r /home/proofwall/.secrets/proofo-access.env` | false / false |
| `-r /root/.codex/auth.json` | false / false |
| `-r /home/proofwall/.secrets/ui-preview/app.env` | false / false |
| `-x /home/proofwall`, `-x /root` | оба false / false |
| `-r <artifact>/apps/web/.next/server/app/dashboard/page.js` | true / true |
| `-w` того же compiled dashboard | false / false |
| `-w <artifact>/apps/web/.next/cache` | true / true |
| `-w /run/proofwall-ui-preview` | true / true |
| `-w /run/docker.sock` | false / false |

Все **11/11** прошли. Четыре private-файла дополнительно проверены только на существование в host namespace: все существуют. Поэтому отрицательные predicates не объясняются отсутствующими fixture-путями. Граница файловой изоляции и отсутствие root/capability полномочий реально изменились; OPS-1 закрыт.

## OPS-2 — WARNING, закрыто выбранным lifecycle

Сохранённый смысл: артефакт `/tmp` и disabled unit не обеспечивали определённое восстановление после reboot. Новый working directory/executable закреплён в versioned `/opt/proofwall-ui-preview/artifacts/u0skKIAfRIAw4AJWplbBw`; BUILD_ID совпадает с именем каталога. `systemctl is-enabled` возвращает `enabled`, реально существует symlink в `/etc/systemd/system/multi-user.target.wants/`. Сохранены `After`/`Requires=docker.service`, `Restart=on-failure`, `RestartSec=5`; unit проходит `systemd-analyze verify`, exit 0.

Docker inspect независимо подтверждает отдельные `proofwall-ui-preview-postgres`, `proofwall_ui_preview_data`, bind `127.0.0.1:33184` и `restart=unless-stopped`. Операционный план теперь фиксирует versioned artifact, независимость запуска от worktree и stop/disable при полном удалении review-стенда с отдельным решением об удалении тестовых данных. Структурные причины предупреждения устранены. Reboot, restart и восстановление из backup намеренно не выполнялись; это не заявляется как пройденный resilience test.

## Проверка переноса артефакта и частного backend

Независимо вычислены SHA всех **318** compiled/public файлов из `operations-artifact.json`: **318/318** совпадают и с артефактом в `/opt`, и с соответствующими исходными файлами проверенной production-сборки в worktree. Перенос не пересобирал эти bytes. Manifest compiled/public не является полным hash-manifest всех файлов внешних node_modules; такого утверждения здесь нет.

При первой проверке обнаружились отсутствующий `services/worker/package.json` в 12 Next NFT traces и четыре broken workspace directory links. Автор добавил только четыре tracked package manifests без изменения app/build. После этого reviewer повторно проверил:

- Все **5 591** зависимости в `.nft.json` существуют и находятся внутри artifact; отсутствующих и выходящих наружу путей — 0.
- Все **42** symlinks находятся внутри artifact и имеют существующие цели; broken links — 0. Это проверка directory links и traced dependencies, не гарантия запускоспособности отдельно worker/widget/gateway packages.
- Filename walk без чтения содержимого не нашёл `.env`, `.env.*`, `.secrets` или `ui-preview-access.env`. Наличие секретов, встроенных в произвольный compiled текст, этим методом не доказывается и не отрицается.
- Четыре добавленных package.json побайтово совпадают с source worktree и descriptor:

| Путь | SHA-256 |
|---|---|
| `apps/widget/package.json` | `d71b08b3a70074048d3d0345d662a90ca973cf70acbd6bfd6d02f74169c03242` |
| `services/agent-api/package.json` | `944b77fda10262960a1c80d05155218e481c5d8a8ab6447285b242f4b02ce326` |
| `services/transcribe/package.json` | `9f15f15229077f61385e23cefccb83e2d638ed13a1c4b6757c5c79bb5ac3a8b6` |
| `services/worker/package.json` | `ff4915c1b2e5abce541d4c6bde95a5b668550a5d6006d9ad4c3a02e806fa3c5a` |

Backend smoke выполнен чтением `http://172.21.0.1:33183`: `/login` → 200; `/dashboard` без cookie → 307 на `/login?next=/dashboard`; `/dashboard` с заведомо поддельной `pw_session` → тот же 307; `/dashboard.html` и `/__test/dashboard` → 404. Это проверяет routing/auth refusal, не успешный вход и не все API. `ss` подтверждает Next только на `172.21.0.1:33183` и PostgreSQL только на `127.0.0.1:33184`.

Proposed Caddy остался неизменным: один новый host и target `172.21.0.1:33183`, noindex/nofollow и no-store. SHA старого byte-prefix до нового host повторно вычислен как `c33acf48cda108f987ad9b9d339c027333f84f8b0b044fdc70f863d19cfde474`, совпадает с historical prepared digest. Действующий public gateway не reload/restart и не менялся этой ролью.

## Оставшиеся границы доказательства

OPS-1/OPS-2 закрыты на перечисленных bytes и текущем runtime. Успешный HTTPS/login с Secure cookie на будущем hostname, все существующие app API, фактическая изоляция значений env/SESSION_SECRET, содержимое synthetic DB, Caddy reload/rollback и reboot ещё не проверялись этой ролью. Ни один env/access-файл не открывался; environment процесса не читался. Нет сетевой egress sandbox-гарантии: закрытие OPS-1 касается non-root UID, capabilities и файловых границ, фактически предъявленных в исходном условии.

Этот отдельный ops review не закрывает product conditions других reviewer. Публикация остаётся последующим шагом координатора после product convergence; delivery digest должен связать данный focused report, исходный ops report и актуальные перечисленные inputs.
