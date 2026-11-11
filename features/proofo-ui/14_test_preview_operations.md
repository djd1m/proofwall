# Тестовая копия dashboard: операционный план

Доставка только после текущего независимого QE и актуального локального receipt.
Отдельный адрес: `https://ui-proofwall.78.17.53.233.sslip.io/dashboard`.
Существующий HTTPS-стенд, DNS и его база не переключаются.

Ресурсы подготовлены: отдельный PostgreSQL 16 container
`proofwall-ui-preview-postgres`, volume `proofwall_ui_preview_data`, порт только
`127.0.0.1:33184`, БД `proofwall_ui_preview`; 21 существующая миграция применена
только туда. Аккаунт и две стены синтетические. Доступ хранится в приватном
`/home/proofwall/.secrets/ui-preview-access.env`, значения не публикуются.
Сервис `proofwall-ui-preview.service` запускает копию проверенной Next production-сборки
из versioned `/opt/proofwall-ui-preview/artifacts/<BUILD_ID>`, bind
`172.21.0.1:33183` — адрес Docker bridge Caddy.
EnvironmentFile отдельный, без Resend/S3/платёжных/STT ключей; собственный session secret.
Это временный review-стенд, не production. Процесс работает от отдельного
`proofwall-preview` (UID 20001), без Docker group/capabilities; ProtectHome скрывает
домашние каталоги, ProtectSystem=strict оставляет writable только собственные cache
и runtime. В artifact не копировались env/private файлы. Сервис включён для restart;
образ PostgreSQL имеет restart unless-stopped. Исходный worktree для запуска не нужен.
Реальные UID и negative filesystem checks — `operations-isolation.json` в evidence.

После QE: проверить актуальный receipt, доступность Next из Caddy container и
валидировать будущую конфигурацию Caddy. Сохранить приватную резервную копию
текущего `/home/proofwall/deploy/sslip/Caddyfile`; добавить отдельный virtual host,
не меняя существующий блок:

```caddy
ui-proofwall.78.17.53.233.sslip.io {
    tls {
        issuer acme {
            disable_http_challenge
        }
    }
    encode gzip zstd
    header X-Robots-Tag "noindex, nofollow"
    header Cache-Control "no-store"
    reverse_proxy 172.21.0.1:33183
}
```

Reload существующего Caddy через его установленный binary; порты 80/8443 и VPN
не трогать. Проверить доверенный HTTPS, обычный вход демонстрационного аккаунта,
dashboard/cards/navigation, отсутствие production data и исходного fixture route.
Повторно проверить прежний HTTPS-стенд и static design preview. При неуспехе
восстановить резервную конфигурацию и reload; ошибочную публикацию не считать готовой.
При полном удалении review-стенда отдельно stop/disable его unit; база/volume удаляются
только после проверки, что в них не появились нужные владельцу тестовые данные.

Ограничения: проверяется dashboard, project route остаётся прежним; branding/collect
пока последующий инкремент. Письма, платежи и S3 на этой отдельной копии не включены.
Production-поставка и ручная приёмка владельцем остаются отдельными действиями.
