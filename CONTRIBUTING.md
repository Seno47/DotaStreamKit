# Contributing to DotaStreamKit

Thanks for taking the time to improve DotaStreamKit.

This project is a local tool for Dota 2 streamers. Changes should keep that use case in mind: reliable GSI handling, predictable OBS overlays, safe Twitch prediction automation, and clear setup for people who are not developers.

## Before You Start

- Search existing issues and pull requests first.
- Open an issue before large changes, UI redesigns, new integrations, or behavior that affects Twitch predictions.
- Do not include Twitch tokens, client secrets, local `data/` files, OBS credentials, or private screenshots.
- Security reports should follow `SECURITY.md`, not public issues.

## Development Setup

Requirements:

- Node.js 20 or newer
- npm
- PowerShell for the bundled Windows helper scripts

Install dependencies and start the local app:

```powershell
npm install
npm start
```

Dashboard:

```text
http://localhost:37273
```

OBS overlay:

```text
http://localhost:37273/overlay.html
```

## Useful Checks

Run the focused checks before opening a pull request:

```powershell
npm run check
npm run test:prediction-safety
npm run test:game-intel
npm run test:streamer-stats
git diff --check
```

For release packaging work:

```powershell
npm run build:win
npm run build:linux
npm run build:mac
```

## Pull Request Guidelines

- Keep pull requests focused. One behavior change is easier to review than a mixed refactor.
- Match the existing style of the file you are editing.
- Add or update tests when changing prediction safety, GSI lifecycle, Match Intel, streamer stats, or release packaging.
- Update `README.md` when user-facing behavior changes.
- Do not commit local `data/`, OAuth tokens, generated personal screenshots, or private config.
- Explain how you tested the change.

## Text and UI Guidelines

- Use clear human language. Avoid filler and vague feature claims.
- Keep the dashboard useful for repeated stream setup, not just pretty on first launch.
- Overlay changes should be readable in OBS and should not cover critical Dota UI unless that is the feature.
- Twitch prediction behavior should be conservative: do not touch predictions the app did not create.

## Русская версия

Если хочешь помочь проекту, спасибо.

DotaStreamKit - локальный инструмент для Dota 2 стримеров. Изменения должны сохранять главный фокус: надёжная работа GSI, предсказуемый OBS overlay, безопасная автоматизация Twitch Predictions и понятная настройка для обычных пользователей.

Перед началом:

- проверь существующие issues и pull requests;
- для крупных изменений сначала открой issue;
- не публикуй Twitch tokens, client secrets, папку `data/`, OBS credentials и приватные скриншоты;
- security reports отправляй по `SECURITY.md`, а не в публичные issues.

Проверки перед pull request:

```powershell
npm run check
npm run test:prediction-safety
npm run test:game-intel
npm run test:streamer-stats
git diff --check
```

В pull request опиши, что изменилось и как это проверялось. Если изменение видно пользователю, обнови `README.md`.
