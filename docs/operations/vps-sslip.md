# Стенд Proofwall на VPS

Рабочий каталог `/home/proofwall`. Временный адрес:
`https://proofwall.78.17.53.233.sslip.io`. Будущий домен — `proofwall.aicoding.space`.
Текущее состояние и ограничения записываются в отчёте запуска, а не выводятся из этого плана.

## Состав

Postgres, web, worker, Caddy. Хранилище — существующий приватный S3-бакет `proofwall`
в Cloud.ru. MinIO и transcribe выключены профилями. Приём видео выключен до отдельной
настройки STT и расхода. Без соответствующих ключей также недоступны почта, Yandex OAuth
и реальные платежи; заглушка платежей не включена.

Порт 80 занят существующим VPN. Caddy публикует только TCP/443 и получает сертификат
через TLS-ALPN-01; перенаправления HTTP выключены. Открывать сайт нужно по HTTPS.
Postgres и web не имеют публикации портов; существующий VPN не перенастраивается.

## Ключи Cloud.ru

Файл `/home/proofwall/.env`, права `600`, в Git не входит. Пользователь заполняет:

```dotenv
S3_ACCESS_KEY=<tenant_id>:<key_id>
S3_SECRET_KEY=<Key Secret>
```

Остальные настройки:

```dotenv
S3_ENDPOINT=https://s3.cloud.ru
S3_REGION=ru-central-1
S3_BUCKET=proofwall
S3_PHOTO_BUCKET=proofwall
S3_FORCE_PATH_STYLE=false
```

Это API-ключ Object Storage; ключ Foundation Models не подходит. Ключи Clipmkr не
копируются. Использовать доступ к бакету `proofwall` для чтения/записи/удаления объектов;
публиковать бакет или менять ACL/политики для работы приложения не требуется.
Фото по-прежнему выдаёт `/api/photo/...` после проверки типа; видео — подписанные URL.

Источник совместимости — `.env.example` и `packages/s3/src/client.ts` в
`https://github.com/djd1m/clipmkr`. Документация Cloud.ru:
`https://cloud.ru/docs/s3e/ug/topics/api__getting-started`.

## Запуск и обслуживание

Все команды — из `/home/proofwall`; `stand.sh` всегда использует оба Compose-файла.

```bash
scripts/stand.sh config --quiet
scripts/stand.sh preflight
scripts/stand.sh build web worker
scripts/stand.sh up -d --wait postgres
python3 scripts/migrate-local.py
scripts/stand.sh up -d web worker caddy
scripts/stand.sh ps
```

`preflight` проверяет объединённый конфиг, хранит временную нормализованную копию с
правами 600 и удаляет её. Проверка свободных портов предназначена для первого запуска:
при уже работающем Caddy она видит собственный 443 как занятый. Для повторной операции
сначала установить владельца binding по `stand.sh ps`/`docker inspect`; не принимать
такую ожидаемую занятость за доказательство чужого конфликта и не пропускать новые конфликты.

Миграции выполняются только в postgres этого стека, каждая — одной транзакцией вместе
с записью в schema_migrations. Скрипт не содержит пароля и останавливается при ошибке.
Для новой пустой БД повтор безопасен. Перед будущими изменениями данных делать backup.

```bash
scripts/stand.sh logs --tail=80 web worker caddy
bash scripts/check-cjm.sh https://proofwall.78.17.53.233.sslip.io
```

CJM создаёт отдельный технический аккаунт/проект и отзыв в новой базе. Исторические
базы, медиа и пользователи старого сайта этим стендом не переносятся.

## Переход на proofwall.aicoding.space

Сначала отдельно спланировать перенос старых данных, если они нужны. По состоянию
на подготовку стенда этот домен указывал на другой сервер; здесь DNS не изменялся.

1. Изменить A-запись `proofwall.aicoding.space` на `78.17.53.233`. Проверить/убрать
   старую AAAA-запись, если она направляет на прежний сервер. Если используется DNS-прокси,
   сначала обеспечить прямую доступность 443 для выпуска сертификата TLS-ALPN.
2. После обновления DNS заменить в `.env` только APP_DOMAIN и BASE_URL:
   `APP_DOMAIN=proofwall.aicoding.space`, `BASE_URL=https://proofwall.aicoding.space`.
3. Пересоздать `scripts/stand.sh up -d --no-deps web caddy`. Одного reload Caddy недостаточно:
   оба контейнера должны получить обновлённые переменные окружения.
4. Проверить сертификат без `-k`, страницы, выданные ссылки и полный CJM на новом домене.

Менять бакет/ключи S3 при смене домена не требуется. Caddy хранит сертификаты в своём
постоянном томе. `down -v` удалит данные стенда — при обслуживании его не использовать.
