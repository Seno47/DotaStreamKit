# DotaStreamKit

Local desktop tool for Dota 2 streamers: stream protection overlays for OBS plus Twitch Channel Points Predictions automation.

Русская версия ниже. English version is after it.

> [!IMPORTANT]
> **Sponsor: [XyraNet VPN](https://xyranet.pro)**
> VPN service for streamers and gamers. Website: [xyranet.pro](https://xyranet.pro), Telegram bot: [@XyraNet_bot](https://t.me/XyraNet_bot).

If the project helps you, please leave a star on GitHub: https://github.com/Seno47/DotaStreamKit

## Навигация

- [Русский](#русский)
  - [Спонсор](#спонсор)
  - [Что умеет DotaStreamKit](#что-умеет-dotastreamkit)
  - [Быстрый старт через релиз](#быстрый-старт-через-релиз)
  - [Настройка Twitch](#настройка-twitch)
  - [Настройка Dota GSI](#настройка-dota-gsi)
  - [Настройка OBS](#настройка-obs)
  - [Защита стрима](#защита-стрима)
  - [Прогнозы за баллы канала](#прогнозы-за-баллы-канала)
  - [Частые проблемы](#частые-проблемы)
  - [Support](#support)
- [English](#english)
  - [Sponsor](#sponsor)
  - [What DotaStreamKit Does](#what-dotastreamkit-does)
  - [Quick Start With a Release](#quick-start-with-a-release)
  - [Twitch Setup](#twitch-setup)
  - [Dota GSI Setup](#dota-gsi-setup)
  - [OBS Setup](#obs-setup)
  - [Stream Protection](#stream-protection)
  - [Channel Points Predictions](#channel-points-predictions)
  - [Troubleshooting](#troubleshooting)
  - [Developer Support](#developer-support)
- [Development](#development)

## Русский

### Спонсор

> [!NOTE]
> **XyraNet VPN** поддерживает разработку DotaStreamKit.
> Сайт: [xyranet.pro](https://xyranet.pro)
> Telegram-бот: [@XyraNet_bot](https://t.me/XyraNet_bot)

Если тебе нужен VPN для стримов, игр и повседневного использования, посмотри XyraNet VPN. Поддержка спонсора помогает проекту развиваться.

Если проект понравился, поставь звезду на GitHub. Это помогает другим стримерам найти DotaStreamKit:

```text
https://github.com/Seno47/DotaStreamKit
```

### Что умеет DotaStreamKit

DotaStreamKit запускается локально на компьютере стримера и отдаёт панель управления в браузере:

```text
http://localhost:37273
```

OBS-оверлей для стрима:

```text
http://localhost:37273/overlay.html
```

Основные возможности:

- скрытие стадии драфта и верхней панели с пиками;
- скрытие миникарты fake-vision маской, чтобы не палить варды;
- скрытие меню поиска игры через загруженный или встроенный скрин меню;
- автоматическое создание Twitch Predictions после пика героя стримером;
- автоматическое закрытие, отмена и ручное управление прогнозами;
- поддержка личного Twitch-аккаунта или отдельного аккаунта-модератора;
- локальная установка Dota Game State Integration.

Серверный режим в интерфейсе есть, но эта инструкция пока описывает только локальное использование. Для публичного сервера проект ещё не считается готовым сценарием.

### Быстрый старт через релиз

1. Открой страницу релизов:

   ```text
   https://github.com/Seno47/DotaStreamKit/releases
   ```

2. Скачай архив для своей системы:
   - Windows: `DotaStreamKit-1.0.0-win-x64.zip`
   - Linux Debian/Ubuntu x64: `DotaStreamKit-1.0.0-linux-x64.tar.gz`
   - macOS Apple Silicon: `DotaStreamKit-1.0.0-darwin-arm64.tar.gz`
   - macOS Intel: `DotaStreamKit-1.0.0-darwin-x64.tar.gz`
3. Распакуй архив в удобную папку.
4. Запусти:
   - Windows: `DotaStreamKit.exe`
   - Linux/macOS: `bash DotaStreamKit`
5. Открой панель:

   ```text
   http://localhost:37273
   ```

Если Windows SmartScreen предупреждает о неизвестном приложении, это нормально для unsigned portable-сборки. Запускай только архив, скачанный из релизов этого репозитория.

### Настройка Twitch

DotaStreamKit нужен Twitch app, чтобы получить `Client ID` и `Client Secret` для OAuth.

1. Открой Twitch Developer Console:

   ```text
   https://dev.twitch.tv/console
   ```

2. Войди в Twitch-аккаунт. У аккаунта должна быть подтверждена почта и включена 2FA.
3. Перейди во вкладку `Applications`.
4. Нажми `Register Your Application` / `Зарегистрировать приложение` / `Подать заявку`.
5. Заполни поля:

   | Поле Twitch | Что указать |
   | --- | --- |
   | `Name` | Любое уникальное имя, например `DotaStreamKit Local` |
   | `OAuth Redirect URLs` | `http://localhost:37273/auth/twitch/callback` |
   | `Category` | Любая подходящая категория, например `Application Integration`, `Website Integration` или `Other` |

6. После ввода redirect URL нажми `Add`, если Twitch показывает отдельную кнопку добавления URL.
7. Пройди captcha и нажми `Create`.
8. Открой созданное приложение через `Manage`.
9. Скопируй `Client ID` в поле `Client ID` в DotaStreamKit.
10. Нажми `New Secret`, скопируй секрет и вставь его в `Client Secret` в DotaStreamKit.
11. В DotaStreamKit нажми `Подключить Twitch`.
12. Twitch откроет страницу разрешений. Подтверди доступ.

Запрашиваемые права:

- `channel:manage:predictions` - создавать, закрывать, отменять и завершать прогнозы;
- `user:write:chat` - отправка сообщений в чат, если эта функция используется.

Важно:

- `Client Secret` нельзя публиковать и нельзя показывать зрителям.
- Если Twitch показывает `reconnect`, нажми `Подключить Twitch` ещё раз и подтверди новые права.
- Для управления прогнозами чужого канала OAuth-аккаунт должен иметь права управлять Predictions этого канала.

#### Личный аккаунт или отдельный модератор

В блоке Twitch есть поле `Канал для прогнозов`.

- `Личный Twitch аккаунт` - прогнозы создаются на канале аккаунта, через который ты авторизовался.
- `Отдельный аккаунт / канал стримера по нику` - авторизуется отдельный аккаунт, а канал для прогнозов выбирается по нику стримера. Программа сохраняет broadcaster ID, поэтому смена ника стримера не должна ломать привязку.

### Настройка Dota GSI

GSI - это встроенный механизм Dota 2. Это не сторонняя программа.

DotaStreamKit устанавливает только cfg-файл:

```text
gamestate_integration_dotastreamkit.cfg
```

Он говорит Dota 2 отправлять состояние игры на локальный адрес:

```text
http://127.0.0.1:37273/gsi/dota2
```

Как настроить:

1. В панели DotaStreamKit нажми `Найти Dota`.
2. Если путь найден правильно, нажми `Установить GSI`.
3. Перезапусти Dota 2.
4. Вверху панели должен появиться статус `Dota GSI online`, когда Dota начнёт отправлять состояние.

Если авто-поиск Dota не сработал, укажи путь вручную. Пример:

```text
C:\SteamLibrary\steamapps\common\dota 2 beta
```

Ручная установка через PowerShell всё ещё доступна:

```powershell
npm run install:gsi -- -DotaCfgDir "D:\SteamLibrary\steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration"
```

### Настройка OBS

1. В OBS добавь `Browser Source`.
2. URL:

   ```text
   http://localhost:37273/overlay.html
   ```

3. Ширина и высота должны совпадать с canvas OBS:

   | Canvas OBS | Browser Source |
   | --- | --- |
   | `1920x1080` | width `1920`, height `1080` |
   | `2560x1440` | width `2560`, height `1440` |
   | `3840x2160` | width `3840`, height `2160` |

4. Поставь Browser Source выше захвата Dota 2.
5. Если OBS показывает старую маску после обновления, нажми `Refresh cache of current page` в свойствах Browser Source.

### Защита стрима

#### Draft

Можно загрузить один полный draft-скрин. Программа сама нарежет нужные области:

- верхнюю панель пиков;
- основную область выбора героев;
- области, которые должны скрывать пики, но не закрывать чат.

Если свой скрин не загружен, используется встроенный шаблон из проекта.

Логика авто-скрытия:

- до пика героя стримером скрывается draft-экран;
- после завершения pick-фазы, в которой стример выбрал героя, остаётся скрытие верхней панели;
- после завершения драфта и перехода к планированию маски убираются.

#### Миникарта

Миникарта закрывается встроенной fake-vision маской. Пользовательская загрузка миникарты не используется.

Настройки:

- размер миникарты: обычная или большая;
- сторона: слева или справа;
- фон миникарты: реалистичный, простой или пустой.

Маска старается оставить героев, крипов и другие иконки видимыми, но скрыть информацию о настоящих вардах.

#### Поиск игры

Для скрытия поиска можно загрузить скрин меню Dota. Если скрин не загружен, используется встроенный ассет.

Режимы:

- `Только поиск` - авто-скрытие включается только если Dota/GSI даёт явный сигнал поиска или matchmaking.
- `Меню + поиск` - авто-скрытие включается в меню Dota и во время поиска.
- кнопка `Поиск` вручную - принудительно держит маску включённой, пока ты сам её не выключишь.

Если Dota закрыта полностью, авто-скрытие поиска выключается. Если Dota запущена, но первый матч ещё не был сыгран и GSI молчит, режим `Меню + поиск` всё равно может включить маску по процессу `dota2.exe`.

### Прогнозы за баллы канала

DotaStreamKit может автоматически создавать прогноз после того, как:

- GSI увидел пик героя стримером;
- завершилась pick-фаза, в которой стример выбрал героя;
- Twitch-канал находится online.

Доступны встроенные типы прогнозов:

- победа / поражение;
- киллы стримера;
- смерти стримера;
- ассисты стримера;
- не умереть до выбранной минуты;
- last hits к выбранной минуте.

У каждого типа можно настроить:

- вес для случайного выбора;
- шаблон заголовка;
- названия исходов;
- диапазоны случайных значений.

Также есть конструктор пользовательских прогнозов с переменными:

```text
{hero}
{target}
{minute}
{kills}
{deaths}
{assists}
{last_hits}
{denies}
{level}
{team_kills}
{enemy_kills}
{total_kills}
```

Опция `Отменять незасчитанную игру` отменяет активный прогноз при сильных сигналах, что матч не должен засчитываться: долгий disconnect, новый match id при старом прогнозе, ранний post-game без победителя. Для краша/перезахода используется задержка, чтобы обычные 5 минут reconnect не отменяли прогноз сразу.

### Частые проблемы

#### Порт занят: `EADDRINUSE 127.0.0.1:37273`

Уже запущена другая копия DotaStreamKit.

Решение:

```powershell
npm run stop
npm start
```

В релизной сборке просто закрой старое окно/процесс DotaStreamKit и запусти заново.

#### Twitch подключён, но статус `disconnected` или `reconnect`

1. Проверь `Client ID` и `Client Secret`.
2. Нажми `Подключить Twitch`.
3. Подтверди разрешения.
4. Если менял scopes или secret в Twitch Developer Console, подключение нужно обновить.

#### Прогноз не создаётся автоматически

Проверь:

- Twitch подключён;
- канал online;
- включено `Создавать автоматически`;
- GSI online;
- герой уже пикнут, и pick-фаза стримера завершилась;
- нет активного прогноза, который ещё не закрыт.

#### OBS не обновляет картинку

В свойствах Browser Source нажми `Refresh cache of current page`.

#### Авто-скрытие поиска не нужно прямо сейчас

Выключи `Авто скрывать поиск` или выключи ручную кнопку `Поиск`, если она активна.

### Support

Если DotaStreamKit оказался полезен, можно поддержать разработку:

- Telegram-канал разработчика: https://t.me/ivagakura_projects
- GitHub проекта: https://github.com/Seno47/DotaStreamKit
- Поставить звезду проекту на GitHub: https://github.com/Seno47/DotaStreamKit
- T-Bank: https://www.tinkoff.ru/rm/r_rjNFcYKfDe.jmzXvHFVxI/35eKu35373
- TRON / TRC20: `TGZZQaMAvqVF7ae8C6Gfr8MxkTz3j1xqsg`
- TON: `UQCpse9_qEK4xCAeYKI1xJc9pCqroEu6IYffnjnw4iEfBbrG`
- BTC: `1KcxKVuU6T5SHbzT5nN8hCgJRe1MWjqTS9`
- ERC20: `0x8fcbf61653aaba7326cc33ee1dda62949757592b`
- BEP20: `0x8fcbf61653aaba7326cc33ee1dda62949757592b`

Проверяй сеть перед переводом. Для ERC20 и BEP20 адрес одинаковый, но сеть перевода должна быть выбрана правильно.

## English

### Sponsor

> [!NOTE]
> **XyraNet VPN** supports DotaStreamKit development.
> Website: [xyranet.pro](https://xyranet.pro)
> Telegram bot: [@XyraNet_bot](https://t.me/XyraNet_bot)

If you need a VPN for streaming, gaming, or everyday use, check out XyraNet VPN. Supporting the sponsor helps the project move forward.

If you like the project, please leave a GitHub star. It helps other streamers discover DotaStreamKit:

```text
https://github.com/Seno47/DotaStreamKit
```

### What DotaStreamKit Does

DotaStreamKit runs locally on the streamer's PC and opens a dashboard in the browser:

```text
http://localhost:37273
```

OBS overlay URL:

```text
http://localhost:37273/overlay.html
```

Main features:

- hides Dota 2 draft screen and top pick bar;
- hides minimap ward information with a fake-vision overlay;
- hides queue/search menu areas using a menu screenshot;
- creates Twitch Channel Points Predictions after the streamer picks a hero;
- supports manual prediction controls and automatic lock/resolve/cancel flows;
- supports personal Twitch account mode and separate moderator account mode;
- installs Dota Game State Integration locally.

The dashboard contains a server mode, but this README intentionally covers only local usage for now. Public server deployment is not documented as a stable path yet.

### Quick Start With a Release

1. Open the releases page:

   ```text
   https://github.com/Seno47/DotaStreamKit/releases
   ```

2. Download the archive for your system:
   - Windows: `DotaStreamKit-1.0.0-win-x64.zip`
   - Linux Debian/Ubuntu x64: `DotaStreamKit-1.0.0-linux-x64.tar.gz`
   - macOS Apple Silicon: `DotaStreamKit-1.0.0-darwin-arm64.tar.gz`
   - macOS Intel: `DotaStreamKit-1.0.0-darwin-x64.tar.gz`
3. Extract it.
4. Run:
   - Windows: `DotaStreamKit.exe`
   - Linux/macOS: `bash DotaStreamKit`
5. Open:

   ```text
   http://localhost:37273
   ```

If Windows SmartScreen warns you about an unknown app, that is expected for an unsigned portable build. Only run archives downloaded from this repository's releases.

### Twitch Setup

DotaStreamKit needs a Twitch app to get a `Client ID` and `Client Secret`.

1. Open Twitch Developer Console:

   ```text
   https://dev.twitch.tv/console
   ```

2. Log in. Your Twitch account needs a verified email and 2FA enabled.
3. Open `Applications`.
4. Click `Register Your Application`.
5. Fill the fields:

   | Twitch Field | Value |
   | --- | --- |
   | `Name` | Any unique name, for example `DotaStreamKit Local` |
   | `OAuth Redirect URLs` | `http://localhost:37273/auth/twitch/callback` |
   | `Category` | Any suitable category, for example `Application Integration`, `Website Integration`, or `Other` |

6. Click `Add` after entering the redirect URL if Twitch shows a separate add button.
7. Complete captcha and click `Create`.
8. Open the created app with `Manage`.
9. Copy `Client ID` into DotaStreamKit.
10. Click `New Secret`, copy it, and paste it into `Client Secret`.
11. Click `Connect Twitch` in DotaStreamKit.
12. Approve Twitch permissions.

Required scopes:

- `channel:manage:predictions` - create, lock, cancel, and resolve predictions;
- `user:write:chat` - send chat messages if enabled.

Important:

- Do not publish your `Client Secret`.
- If the dashboard shows `reconnect`, click `Connect Twitch` again and approve the updated permissions.
- To manage predictions on another channel, the OAuth account must have permission to manage Predictions for that broadcaster.

### Dota GSI Setup

GSI is a built-in Dota 2 feature, not a third-party program.

DotaStreamKit installs only this config file:

```text
gamestate_integration_dotastreamkit.cfg
```

It tells Dota 2 to send game state to:

```text
http://127.0.0.1:37273/gsi/dota2
```

Setup:

1. In DotaStreamKit, click `Find Dota`.
2. If the path is correct, click `Install GSI`.
3. Restart Dota 2.
4. The dashboard should show `Dota GSI online` when Dota starts sending state.

If auto-detection fails, set the Dota 2 folder manually. Example:

```text
C:\SteamLibrary\steamapps\common\dota 2 beta
```

### OBS Setup

1. Add an OBS `Browser Source`.
2. URL:

   ```text
   http://localhost:37273/overlay.html
   ```

3. Match the Browser Source size to your OBS canvas:

   | OBS Canvas | Browser Source |
   | --- | --- |
   | `1920x1080` | width `1920`, height `1080` |
   | `2560x1440` | width `2560`, height `1440` |
   | `3840x2160` | width `3840`, height `2160` |

4. Place the Browser Source above your Dota 2 capture.
5. If OBS keeps an old overlay after an update, click `Refresh cache of current page`.

### Stream Protection

#### Draft

You can upload one full draft screenshot. The app slices the needed areas automatically.

If no custom screenshot is uploaded, DotaStreamKit uses the bundled default asset.

Auto behavior:

- hide draft while the streamer is still in their pick phase;
- after the streamer's pick phase ends, hide only the top pick bar;
- remove draft/top masks after draft ends and strategy/planning starts.

#### Minimap

The minimap uses the built-in fake-vision overlay. Custom minimap uploads are not supported.

Settings:

- normal or large minimap;
- left or right minimap;
- realistic, simple, or empty minimap background.

The overlay tries to keep heroes, creeps, and map icons visible while hiding real ward information.

#### Queue / Search

You can upload a Dota menu screenshot for queue/search masking. If none is uploaded, the bundled asset is used.

Modes:

- `Search only` - auto-mask only when Dota/GSI provides an explicit queue/search/matchmaking signal.
- `Menu + search` - auto-mask in Dota menu and during search.
- manual `Queue` button - force the mask to stay on until you turn it off.

If Dota is closed, automatic queue masking turns off. If Dota is running but GSI has not sent data yet, `Menu + search` can still enable the mask by checking the local `dota2.exe` process.

### Channel Points Predictions

DotaStreamKit can auto-create a prediction after:

- GSI sees the streamer's picked hero;
- the pick phase where the streamer picked that hero has ended;
- the Twitch channel is online.

Built-in prediction types:

- win / loss;
- streamer kills;
- streamer deaths;
- streamer assists;
- no death until selected minute;
- last hits by selected minute.

Each type can configure:

- random selection weight;
- title template;
- outcome names;
- random value ranges.

Custom templates can use variables such as:

```text
{hero}
{target}
{minute}
{kills}
{deaths}
{assists}
{last_hits}
{denies}
{level}
{team_kills}
{enemy_kills}
{total_kills}
```

The `Cancel invalid game` option cancels active predictions on strong signals that a match should not count: long disconnect, a new match id while an old prediction is active, or early post-game without a winner. Crash/reconnect handling uses a delay so a normal reconnect window does not cancel instantly.

### Troubleshooting

#### Port is busy: `EADDRINUSE 127.0.0.1:37273`

Another DotaStreamKit copy is already running.

For development builds:

```powershell
npm run stop
npm start
```

For release builds, close the old DotaStreamKit process and start it again.

#### Twitch shows `disconnected` or `reconnect`

1. Check `Client ID` and `Client Secret`.
2. Click `Connect Twitch`.
3. Approve permissions.
4. If you changed scopes or generated a new secret, reconnect Twitch.

#### Auto prediction is not created

Check that:

- Twitch is connected;
- the channel is live;
- `Auto create` is enabled;
- GSI is online;
- the hero was picked and the streamer's pick phase ended;
- there is no active prediction already open.

#### OBS shows an old overlay

Click `Refresh cache of current page` in Browser Source properties.

#### Queue/search mask is stuck

Check whether the manual `Queue` button is enabled. Manual mode intentionally keeps the mask visible.

### Developer Support

If DotaStreamKit helps you, you can support development:

- Developer Telegram channel: https://t.me/ivagakura_projects
- GitHub repository: https://github.com/Seno47/DotaStreamKit
- Star the project on GitHub: https://github.com/Seno47/DotaStreamKit
- T-Bank: https://www.tinkoff.ru/rm/r_rjNFcYKfDe.jmzXvHFVxI/35eKu35373
- TRON / TRC20: `TGZZQaMAvqVF7ae8C6Gfr8MxkTz3j1xqsg`
- TON: `UQCpse9_qEK4xCAeYKI1xJc9pCqroEu6IYffnjnw4iEfBbrG`
- BTC: `1KcxKVuU6T5SHbzT5nN8hCgJRe1MWjqTS9`
- ERC20: `0x8fcbf61653aaba7326cc33ee1dda62949757592b`
- BEP20: `0x8fcbf61653aaba7326cc33ee1dda62949757592b`

Double-check the network before sending crypto. ERC20 and BEP20 use the same address here, but the selected transfer network still matters.

## Development

For contributors or local development without the release archive:

```powershell
npm install
npm start
```

Useful commands:

```powershell
npm run check
npm run stop
npm run build:win
npm run build:linux
npm run build:mac
```

Build portable release archives:

```powershell
npm run build:win
npm run build:linux
npm run build:mac
```

The archives are written to:

```text
dist/DotaStreamKit-1.0.0-win-x64.zip
dist/DotaStreamKit-1.0.0-linux-x64.tar.gz
dist/DotaStreamKit-1.0.0-darwin-arm64.tar.gz
dist/DotaStreamKit-1.0.0-darwin-x64.tar.gz
```

Local data, config, OAuth tokens, uploaded screenshots, and generated assets are stored in `data/`. This folder is ignored by Git.

## Official References

- Twitch Developer Console: https://dev.twitch.tv/console
- Twitch app registration docs: https://dev.twitch.tv/docs/authentication/register-app
- Twitch OAuth token docs: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth
