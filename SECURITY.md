# Security Policy

## Supported Versions

Security fixes are handled for the latest public release of DotaStreamKit.

Users should update to the newest release from:

```text
https://github.com/Seno47/DotaStreamKit/releases
```

Older releases are not guaranteed to receive backported security fixes.

## Reporting a Vulnerability

Please do not report security vulnerabilities in public GitHub issues, discussions, Twitch chat, or public Telegram comments.

Use GitHub's private vulnerability reporting flow when it is available for this repository:

```text
https://github.com/Seno47/DotaStreamKit/security/advisories/new
```

If that link is unavailable, contact the maintainer through Telegram first and ask for a private reporting channel without posting exploit details publicly:

```text
https://t.me/ivagakura_projects
```

Good reports include:

- affected DotaStreamKit version;
- operating system;
- clear reproduction steps;
- expected and actual behavior;
- impact of the issue;
- logs or screenshots if they do not expose secrets.

Do not include Twitch OAuth tokens, client secrets, local config files, or other private credentials unless the maintainer explicitly asks for a safe way to share them.

## Scope

Security reports that are in scope:

- exposure of Twitch OAuth tokens or client secrets;
- unauthorized Twitch prediction actions;
- unintended access to local DotaStreamKit data;
- unsafe file handling in uploads, generated assets, release archives, or GSI installation;
- dependency vulnerabilities that are reachable in normal DotaStreamKit usage.

Reports that are usually out of scope:

- issues that require full control of the user's PC before launching DotaStreamKit;
- social engineering attacks;
- denial-of-service reports against a local-only instance without a realistic security impact;
- vulnerabilities in Twitch, Steam, Dota 2, OBS, OpenDota, or other third-party services unless DotaStreamKit uses them unsafely.

## Response Expectations

The maintainer will try to acknowledge valid reports within 7 days.

If the issue is confirmed, the fix may be shipped as a patch release, a normal release, or a documented mitigation depending on severity and complexity.

Public disclosure should wait until a fix or mitigation is available, unless the maintainer and reporter agree otherwise.

## Русская версия

## Поддерживаемые версии

Исправления безопасности выпускаются для последнего публичного релиза DotaStreamKit.

Пользователям стоит обновляться до свежей версии:

```text
https://github.com/Seno47/DotaStreamKit/releases
```

Старые релизы не гарантируют получение отдельных backport-исправлений.

## Как сообщить об уязвимости

Пожалуйста, не публикуй уязвимости в открытых GitHub issues, discussions, Twitch-чате или публичных комментариях Telegram.

Если для репозитория доступна приватная отправка уязвимостей GitHub, используй её:

```text
https://github.com/Seno47/DotaStreamKit/security/advisories/new
```

Если ссылка недоступна, сначала свяжись с разработчиком через Telegram и попроси приватный канал для отчёта, не публикуя детали эксплуатации открыто:

```text
https://t.me/ivagakura_projects
```

Хороший отчёт содержит:

- версию DotaStreamKit;
- операционную систему;
- понятные шаги воспроизведения;
- ожидаемое и фактическое поведение;
- возможный ущерб;
- логи или скриншоты, если они не раскрывают секреты.

Не отправляй Twitch OAuth tokens, client secrets, локальные config-файлы и другие приватные данные, пока разработчик явно не предложит безопасный способ передачи.

## Что входит в scope

Подходящие отчёты:

- утечка Twitch OAuth tokens или client secrets;
- неавторизованные действия с Twitch Predictions;
- непредусмотренный доступ к локальным данным DotaStreamKit;
- небезопасная обработка файлов при загрузке ассетов, генерации изображений, сборке архивов или установке GSI;
- уязвимости зависимостей, которые реально достижимы при обычном использовании DotaStreamKit.

Обычно не входят в scope:

- проблемы, которые требуют полного контроля над компьютером пользователя ещё до запуска DotaStreamKit;
- social engineering;
- denial-of-service против локального экземпляра без реалистичного security impact;
- уязвимости Twitch, Steam, Dota 2, OBS, OpenDota или других сторонних сервисов, если DotaStreamKit не использует их небезопасным образом.

## Ожидаемая реакция

Разработчик постарается ответить на валидный отчёт в течение 7 дней.

Если проблема подтвердится, исправление может выйти как patch release, обычный релиз или documented mitigation - в зависимости от серьёзности и сложности.

Публичное раскрытие стоит отложить до выхода исправления или mitigation, если разработчик и автор отчёта не договорились иначе.
