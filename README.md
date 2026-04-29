# DotaStreamKit

Локальный агент для стримера: скрывает чувствительные части Dota 2 через OBS overlay и управляет Twitch Channel Points Predictions без внешнего сервера.

## Запуск

```powershell
npm start
```

Панель: `http://localhost:37273`  
OBS Browser Source: `http://localhost:37273/overlay.html?v=27`

В панели защиты выбери размер миникарты, сторону (`Слева`/`Справа`) и фон миникарты: `Реалистичный`, `Простой` или `Пустой`. Для правой миникарты overlay зеркалит fake-vision слой и позицию от правого края экрана.

В OBS добавь Browser Source с размером твоего canvas, например `1920x1080`, `2560x1440` или `3840x2160`, и поставь его поверх захвата Dota 2. Если OBS показывает старую маску после обновления, нажми `Refresh cache of current page` или увеличь версию в URL, например `?v=7`.

Для маски draft загрузи в панели один полный draft-скрин. Сервер приведет его к reference-размеру `1920x1080`, нарежет верхнюю панель на 10 маленьких PNG-слотов высотой `66px`, а основную draft-маску покажет скрином ниже заголовка `Выберите героя`. Область чата снизу справа остается прозрачной.

Для миникарты используется локальная PNG-маска `data/assets/minimap-wards.png`, собранная из настоящих Dota-иконок `minimap_ward_obs` и `minimap_ward_invis`. Повторно извлечь их из установленной Dota можно так:

```powershell
npm run extract:dota-assets -- -DotaPath "C:\SteamLibrary\steamapps\common\dota 2 beta"
```

## Dota 2 Game State Integration

GSI - это встроенный механизм Dota 2, не сторонняя программа. DotaStreamKit устанавливает только файл `gamestate_integration_dotastreamkit.cfg`, который говорит игре отправлять состояние на `http://127.0.0.1:37273/gsi/dota2`.

В панели нажми `Найти Dota`, затем `Установить GSI` и перезапусти Dota 2. Если авто-поиск не сработал, вставь путь к папке Dota 2 вручную, например:

```text
C:\SteamLibrary\steamapps\common\dota 2 beta
```

Ручной PowerShell-способ все еще доступен:

```powershell
npm run install:gsi -- -DotaCfgDir "D:\SteamLibrary\steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration"
```

## Twitch Predictions

1. Создай Twitch app в Developer Console.
2. Redirect URL: `http://localhost:37273/auth/twitch/callback`
3. В панели введи Client ID и Client Secret.
4. Нажми `Подключить Twitch`.

Для создания и закрытия ставок нужен scope `channel:manage:predictions`. Для отправки сообщений в чат нужен scope `user:write:chat`. Если Twitch в панели показывает `reconnect`, нажми `Подключить Twitch` еще раз и подтверди новые права.

Опция `Отменять незасчитанную игру` автоматически отменяет активный прогноз при сильных сигналах, что матч не должен считаться: Dota отдала disconnect слишком долго, матч закончился без победителя на раннем времени или начался новый match id при старом прогнозе. Для краша/перезахода используется задержка `390` секунд, чтобы обычные 5 минут на reconnect не отменяли прогноз.

Локальные настройки и OAuth-токены хранятся в папке `data/`. Она добавлена в `.gitignore`.

## Что уже есть

- локальный HTTP сервер;
- Dota GSI endpoint `/gsi/dota2`;
- OBS overlay для draft, миникарты и верхней панели;
- ручные переключатели защиты;
- авто-защита draft по фазе hero selection;
- авто-защита миникарты во время игры;
- Twitch OAuth через localhost;
- создание, lock, cancel и resolve Predictions;
- опции auto-create и auto-resolve.

## Важные ограничения

GSI не дает надежные координаты вардов на миникарте, поэтому MVP закрывает миникарту целиком. Это стабильнее и меньше зависит от патчей Dota 2.

Авто-resolve лучше включать после проверки на твоем аккаунте и реальных GSI payload. Если Dota не отдаст `win_team` или команду игрока в ожидаемом виде, ставка останется открытой для ручного закрытия.
