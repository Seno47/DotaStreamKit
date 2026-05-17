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
  - [Match Intel и статистика стримера](#match-intel-и-статистика-стримера)
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
  - [Match Intel and Streamer Stats](#match-intel-and-streamer-stats)
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
- Match Intel оверлей: отмеченные игроки, флаги, держатель Aegis и таймер Рошана;
- статистика стримера на оверлее: Dota-медаль, звёзды/пипы, ранг в leaderboard, MMR и W-L счётчик;
- цель MMR на оверлее: текущий MMR, старт, цель, прогресс-бар, W-L, winrate и сколько побед осталось до цели;
- настройка внешнего вида цели MMR: фон можно убрать, размер полоски увеличить, выбрать стиль, анимацию, скорость, отступы и свой CSS;
- настройка положения отдельных блоков оверлея: медали в меню, медали в игре, цели MMR, таймера Рошана и Twitch-прогноза;
- режим калибровки: при MMR `0` показывается отдельная calibration-медаль, а MMR после матчей не меняется;
- автоматическое создание Twitch Predictions после пика героя стримером;
- автоматическое закрытие, отмена и ручное управление прогнозами;
- оверлей Twitch-прогноза: название, таймер закрытия, баллы канала, проценты и анимированная полоса исходов;
- отдельные настройки просмотра чужих игр: свои шаблоны прогнозов, переменные команд/героев и отдельный Match Intel без масок драфта или миникарты;
- поддержка личного Twitch-аккаунта или отдельного аккаунта-модератора;
- установщик Windows с выбором папки, ярлыками и нормальным отображением в поиске Windows;
- проверка обновлений из опубликованных GitHub Releases, без установки сырого кода из ветки;
- экспорт и импорт настроек с выбором разделов: можно перенести всё сразу или только нужные части;
- локальная установка Dota Game State Integration.

Серверный режим в интерфейсе есть, но эта инструкция пока описывает только локальное использование. Для публичного сервера проект ещё не считается готовым сценарием.

### Быстрый старт через релиз

1. Открой страницу релизов:

   ```text
   https://github.com/Seno47/DotaStreamKit/releases
   ```

2. Открой самый свежий релиз и скачай сборку для своей системы:
   - Windows, обычная установка: `DotaStreamKit-<version>-win-x64-Setup.exe`
   - Windows, portable-версия без установки: `DotaStreamKit-<version>-win-x64.zip`
   - Linux Debian/Ubuntu x64: `DotaStreamKit-<version>-linux-x64.tar.gz`
   - macOS Apple Silicon: `DotaStreamKit-<version>-darwin-arm64.tar.gz`
   - macOS Intel: `DotaStreamKit-<version>-darwin-x64.tar.gz`
3. На Windows проще запустить установщик: он предложит папку установки, ярлык на рабочем столе и добавит DotaStreamKit в меню Пуск. Если программа уже установлена, установщик предложит исправить/обновить установку или удалить её.
4. Для portable-архива распакуй сборку в удобную папку и запусти:
   - Windows: `DotaStreamKit.exe`
   - Linux/macOS: `bash DotaStreamKit`
5. Открой панель:

   ```text
   http://localhost:37273
   ```

Если Windows SmartScreen предупреждает о неизвестном приложении, это нормально для unsigned-сборки. Запускай только файлы, скачанные из релизов этого репозитория.

В разделе `Setup` можно вручную проверить обновления или включить проверку при запуске. DotaStreamKit устанавливает только готовые GitHub Release assets, поэтому случайный коммит из ветки `master` не попадёт пользователю как обновление.

Там же есть экспорт и импорт настроек. По умолчанию переносится всё, включая Twitch/Dota-настройки, пресеты защиты, цель MMR, прогнозы, Win/Lose/MMR и загруженные картинки, но перед импортом или экспортом можно оставить только нужные разделы. Настройки цели MMR входят в раздел `Защита и overlay`; текущая W-L/MMR статистика сессии переносится разделом `Win/Lose/MMR`.

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

В настройках можно выбрать, скрывать ли все пики или только сторону стримера. Если команда стримера ещё неизвестна, DotaStreamKit временно скрывает все пики, чтобы не раскрыть лишнее.

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

### Match Intel и статистика стримера

Match Intel добавляет на OBS-оверлей небольшие игровые подсказки, которые не требуют открывать отдельные сайты во время матча.

Что можно включить:

- отмеченные игроки - имена над слотами героев;
- флаги игроков, если страна известна или задана вручную;
- таймер Aegis под игроком, который держит Aegis: ровно 5 минут после подбора;
- таймер Рошана с окном возрождения;
- статистику стримера: медаль, MMR, ранг в leaderboard и W-L за сессию;
- цель MMR: отдельный компактный блок с прогрессом от стартового MMR до выбранной цели.

Отмеченные игроки берутся из двух источников. DotaStreamKit может использовать данные OpenDota для игроков с высоким рангом в leaderboard, а ещё позволяет добавить игроков вручную по Dota account id. Ручной список удобен для друзей, частых соперников, известных игроков или любых аккаунтов, которые ты хочешь отмечать всегда. Для каждого такого игрока можно задать ник и двухбуквенный код страны.

Статистика стримера на оверлее настраивается отдельно от отмеченных игроков. Можно показывать только медаль, только MMR, только W-L или любую комбинацию. Источник медали выбирается в настройках: по Dota-аккаунту, по ручному MMR или автоматически - сначала аккаунт, потом ручной MMR.

MMR можно вести вручную или обновлять автоматически после победы/поражения. Авто-обновление применяет заданные `Win MMR` и `Loss MMR`, но не выходит за диапазон `1..99999`. Если поставить MMR `0`, программа считает аккаунт на калибровке: показывает calibration-медаль и не трогает MMR после матчей.

Цель MMR настраивается отдельно для аккаунтов стримера. Можно указать стартовый MMR для расчёта прогресса, целевой MMR и выбрать, какие части показывать: текущий MMR, старт, цель, сколько MMR осталось, счёт W-L, winrate и количество побед до цели. Если нужен минимальный вид для OBS, можно убрать общий фон/рамку и оставить только хотбар, цифры и текст.

Внешний вид цели MMR можно собрать без ручного CSS: есть пресеты полоски, готовые анимации, настройка скорости, высоты прогресс-бара, скругления, свечения, цветов и отдельных отступов сверху/снизу/слева/справа. Для тонкой доработки остаётся поле custom CSS.

В этой же вкладке есть редактор положения оверлея. Можно выбрать нужный блок, посмотреть его на превью со скриншотом или на чёрном/белом фоне, сдвинуть по горизонтали и вертикали, сбросить один блок или вернуть все позиции к значениям по умолчанию. Так настраиваются медаль в меню, медаль в игре, цель MMR, таймер Рошана и блок Twitch-прогноза.

Интерфейс Match Intel разбит на сворачиваемые секции: игровая информация, статистика стримера, позиции оверлея и кастомные notable players. Верхняя строка показывает короткий статус включённых подсказок и помогает быстро понять, что сейчас активно.

Во время драфта и стадии планирования медаль, MMR и W-L по умолчанию скрываются, чтобы не мешать защите пиков. Это можно выключить отдельным переключателем, если статистику нужно оставить видимой даже на драфте. После выхода из матча Match Intel очищается с оверлея, чтобы старые отметки, Aegis или таймер Рошана не оставались на экране.

Для просмотра чужих игр есть отдельные настройки Match Intel. В этом режиме DotaStreamKit может показывать отмеченных игроков, флаги, Aegis и Рошана, но не включает защитные маски драфта, верхней панели или миникарты: при spectate-режиме карта и интерфейс остаются открытыми.

### Прогнозы за баллы канала

DotaStreamKit может автоматически создавать прогноз после того, как:

- GSI увидел пик героя стримером;
- завершилась вся pick-фаза, в которой стример выбрал героя;
- Twitch-канал находится online.

Для All Pick и похожих режимов программа ждёт конец именно той фазы, где был пик стримера: сначала обе команды должны добрать героев этой фазы, и только после этого создаётся прогноз и меняется логика draft-оверлея.

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

На OBS-оверлее можно показывать только тот прогноз, который создал и отслеживает DotaStreamKit. Блок показывает название прогноза, время до закрытия приёма, названия исходов, количество баллов канала и проценты. Полоса исходов плавно анимируется при изменении соотношения ставок, а очень маленький исход всё равно остаётся читаемым.

DotaStreamKit специально не подхватывает чужие активные прогнозы на канале. Если на Twitch уже есть прогноз, созданный вручную или другим ботом, программа не будет его закрывать, отменять или завершать.

Опция `Отменять незасчитанную игру` отменяет активный прогноз при сильных сигналах, что матч не должен засчитываться: долгий disconnect, новый match id при старом прогнозе, ранний post-game без победителя или выход из активного лобби/матча. Для краша/перезахода используется задержка, чтобы обычные 5 минут reconnect не отменяли прогноз сразу.

Опция `Отменять, если один исход без ставок` отменяет прогноз после игры, если хотя бы на один исход не поставили баллы канала. Перед отменой или завершением программа перечитывает состояние прогноза с Twitch, чтобы не решать исход по устаревшим локальным данным.

Для просмотра чужих игр есть отдельный раздел `Настройки просмотра`. Там можно держать свои шаблоны ставок и не смешивать их с обычными прогнозами стримера. Встроенные шаблоны для просмотра рассчитаны на команды и общий матч: победа Radiant/Dire, длительность игры, общий темп киллов и киллы сторон к выбранной минуте.

В шаблонах просмотра доступны переменные для команд и состава матча:

```text
{radiant_team}
{dire_team}
{winning_team}
{match_id}
{radiant_heroes}
{dire_heroes}
{radiant_hero_1} ... {radiant_hero_5}
{dire_hero_1} ... {dire_hero_5}
{radiant_player_1} ... {radiant_player_5}
{dire_player_1} ... {dire_player_5}
{radiant_kills}
{dire_kills}
{total_kills}
{minute}
```

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
- Match Intel overlay: notable players, country flags, Aegis holder, and Roshan timer;
- streamer stats overlay: Dota rank medal, pips/stars, leaderboard rank, MMR, and W-L counter;
- MMR goal overlay: current MMR, start MMR, target, progress bar, W-L, winrate, and wins needed for the goal;
- MMR goal styling without custom code: hide the panel background, enlarge the bar, choose a style preset, animation, speed, padding, and custom CSS;
- position customization for overlay blocks: menu medal, in-game medal, MMR goal, Roshan timer, and Twitch prediction;
- calibration mode: MMR `0` shows a calibration medal and disables automatic MMR changes;
- creates Twitch Channel Points Predictions after the streamer picks a hero;
- supports manual prediction controls and automatic lock/resolve/cancel flows;
- Twitch prediction overlay: title, close timer, channel points, percentages, and animated outcome bar;
- separate spectator settings for watched games: independent prediction templates, team/hero variables, and Match Intel without draft or minimap masks;
- supports personal Twitch account mode and separate moderator account mode;
- Windows installer with install path selection, shortcuts, and Windows search/start menu integration;
- update checks from published GitHub Releases only, never from raw branch commits;
- settings export/import with section selection, from one section to the full local setup;
- installs Dota Game State Integration locally.

The dashboard contains a server mode, but this README intentionally covers only local usage for now. Public server deployment is not documented as a stable path yet.

### Quick Start With a Release

1. Open the releases page:

   ```text
   https://github.com/Seno47/DotaStreamKit/releases
   ```

2. Open the latest release and download the build for your system:
   - Windows, normal installer: `DotaStreamKit-<version>-win-x64-Setup.exe`
   - Windows, portable build: `DotaStreamKit-<version>-win-x64.zip`
   - Linux Debian/Ubuntu x64: `DotaStreamKit-<version>-linux-x64.tar.gz`
   - macOS Apple Silicon: `DotaStreamKit-<version>-darwin-arm64.tar.gz`
   - macOS Intel: `DotaStreamKit-<version>-darwin-x64.tar.gz`
3. On Windows, the installer is the recommended path. It lets you choose the install folder, create a desktop shortcut, and adds DotaStreamKit to the Start menu. If DotaStreamKit is already installed, setup offers to repair/update or remove it.
4. For the portable archive, extract it and run:
   - Windows: `DotaStreamKit.exe`
   - Linux/macOS: `bash DotaStreamKit`
5. Open:

   ```text
   http://localhost:37273
   ```

If Windows SmartScreen warns you about an unknown app, that is expected for an unsigned build. Only run files downloaded from this repository's releases.

The `Setup` page can check for updates manually or on startup. Updates are installed only from published GitHub Release assets, so an unfinished commit on `master` will not be treated as an update.

The same page has settings export/import. By default it transfers everything, including Twitch/Dota setup, protection presets, MMR goal settings, predictions, Win/Lose/MMR, and uploaded images. Before importing or exporting, you can keep only the sections you need. MMR goal configuration belongs to `Protection and overlay`; current session W-L/MMR state belongs to `Win/Lose/MMR`.

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

You can choose whether to hide all picks or only the streamer's team side. If the streamer's team is not known yet, DotaStreamKit temporarily hides all picks to avoid leaking information.

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

### Match Intel and Streamer Stats

Match Intel adds small in-game helpers to the OBS overlay, so the streamer does not need to keep extra sites open during a match.

Available overlay pieces:

- notable players - marked player names above hero slots;
- player flags when the country is known or set manually;
- Aegis timer under the current Aegis holder: exactly 5 minutes after pickup;
- Roshan timer with the respawn window;
- streamer stats: rank medal, MMR, leaderboard rank, and session W-L;
- MMR goal: a compact progress block from a chosen start MMR to the account target.

Notable players come from two places. DotaStreamKit can use OpenDota data for high leaderboard players, and you can also add any Dota account id manually. The manual list is useful for friends, frequent stream snipers, known players, or any account you want to mark every time. Each manual player can have a custom nickname and a two-letter country code.

Streamer stats are configured separately from notable players. You can show only the medal, only MMR, only W-L, or any combination. The rank medal source can be the Dota account, manual MMR, or automatic fallback from account to manual MMR.

Manual MMR can be updated automatically after wins and losses. The configured `Win MMR` and `Loss MMR` values are applied after the match, clamped to `1..99999`. If MMR is set to `0`, DotaStreamKit treats the account as calibrating: it shows the calibration medal and does not change MMR after matches.

The MMR goal block is configured per streamer account. You can set the start MMR used for progress calculation, the target MMR, and choose which parts are visible: current MMR, start, target, remaining MMR, W-L record, winrate, and wins needed to reach the target. For a clean OBS-only look, the panel background/frame can be hidden while the bar, numbers, and text stay visible.

MMR goal styling does not require hand-written CSS. The dashboard includes bar presets, ready animations, animation speed, bar height, radius, glow, colors, and separate top/right/bottom/left padding controls. Custom CSS is still available for final tweaks.

The same tab includes an overlay position editor. Choose a block, preview it on a screenshot or a black/white background, move it horizontally and vertically, reset one block, or reset every overlay position. It supports the menu medal, in-game medal, MMR goal, Roshan timer, and Twitch prediction block.

The Match Intel page is grouped into collapsible sections for game information, streamer stats, overlay positions, and custom notable players. A small status row shows which helper groups are currently active.

During draft and strategy time, the medal, MMR, and W-L are hidden by default so they do not interfere with pick protection. A separate switch can keep streamer stats visible during those stages. After leaving a match, Match Intel is cleared from the overlay so old player marks, Aegis, or Roshan timers do not stay on screen.

Watched games have separate Match Intel settings. In spectator mode DotaStreamKit can still show notable players, flags, Aegis, and Roshan, but it does not enable draft, top-bar, or minimap protection masks: the watched game UI stays visible.

### Channel Points Predictions

DotaStreamKit can auto-create a prediction after:

- GSI sees the streamer's picked hero;
- the full pick phase where the streamer picked that hero has ended;
- the Twitch channel is online.

For All Pick and similar modes, the app waits for the whole phase to finish, including the opponent pick in that phase, before creating the prediction or switching draft protection behavior.

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

The OBS overlay can show only the prediction created and tracked by DotaStreamKit. The block shows the prediction title, time until betting closes, outcome names, channel points, and percentages. The outcome bar animates smoothly when the split changes, and a very small outcome still keeps readable text.

DotaStreamKit intentionally does not adopt unrelated active predictions on the channel. If Twitch already has a prediction created manually or by another bot, the app will not lock, cancel, or resolve it.

The `Cancel invalid game` option cancels active predictions on strong signals that a match should not count: long disconnect, a new match id while an old prediction is active, early post-game without a winner, or leaving an active lobby/match view. Crash/reconnect handling uses a delay so a normal reconnect window does not cancel instantly.

The `Cancel if one outcome has no points` option cancels the prediction after the game if at least one outcome received no Channel Points. Before canceling or resolving, DotaStreamKit refreshes the prediction from Twitch so it does not decide from stale local data.

Watched games use a separate `Spectator settings` page. It has independent prediction templates, so regular streamer bets do not mix with bets for games you are watching. Built-in spectator templates focus on the teams and the full match: Radiant/Dire winner, game duration, total kills pace, and side kills by a selected minute.

Spectator templates can use match and lineup variables:

```text
{radiant_team}
{dire_team}
{winning_team}
{match_id}
{radiant_heroes}
{dire_heroes}
{radiant_hero_1} ... {radiant_hero_5}
{dire_hero_1} ... {dire_hero_5}
{radiant_player_1} ... {radiant_player_5}
{dire_player_1} ... {dire_player_5}
{radiant_kills}
{dire_kills}
{total_kills}
{minute}
```

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
npm run build:win:installer
npm run build:linux
npm run build:mac
```

Build portable release archives:

```powershell
npm run build:win
npm run build:win:installer
npm run build:linux
npm run build:mac
```

The archives are written to:

```text
dist/DotaStreamKit-<version>-win-x64.zip
dist/DotaStreamKit-<version>-win-x64-Setup.exe
dist/DotaStreamKit-<version>-linux-x64.tar.gz
dist/DotaStreamKit-<version>-darwin-arm64.tar.gz
dist/DotaStreamKit-<version>-darwin-x64.tar.gz
```

The Windows installer build requires Inno Setup 6.

Local data, config, OAuth tokens, uploaded screenshots, and generated assets are stored in `data/`. This folder is ignored by Git.

## Official References

- Twitch Developer Console: https://dev.twitch.tv/console
- Twitch app registration docs: https://dev.twitch.tv/docs/authentication/register-app
- Twitch OAuth token docs: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth
