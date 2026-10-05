# Чат на WebSocket

[![Build and deploy](https://github.com/MaksPinch/ahj-chat-frontend/actions/workflows/web.yml/badge.svg)](https://github.com/MaksPinch/ahj-chat-frontend/actions/workflows/web.yml)

[GitHub Pages](https://MaksPinch.github.io/ahj-chat-frontend/)

[Backend](https://github.com/MaksPinch/ahj-chat-backend)

Вход по свободному псевдониму, список участников и отправка сообщений.
Свои сообщения справа с подписью `You`, чужие слева.
При выходе участник удаляется из списка.

## Запуск

Нужен Node.js 24 и npm. Сначала в папке backend:

```sh
npm ci
npm start
```

Затем в папке frontend, в другом терминале:

```sh
npm ci
npm start
```

Открыть http://localhost:8080 в двух вкладках и войти под разными именами.
Backend работает на http://localhost:3000.

## Проверки и сборка

```sh
npm run lint
npm run build
```

Сборка находится в `dist`. Webpack собирает JavaScript, CSS и изображения.
Автотесты по условию не требуются. Проверка чата: два разных ника,
повтор занятого ника, сообщения в обе стороны, закрытие вкладки и повторный вход.

## Публикация

GitHub Actions проверяет код, собирает проект и публикует `dist` на Pages.
В настройках репозитория: Settings → Pages → Source → GitHub Actions.

**Render недоступен, поэтому публикация backend пропущена по условию задания.**
На GitHub Pages размещён только frontend. Для работы нужен запущенный локально
backend и разрешение браузера на доступ к локальной сети, если оно запрашивается.
Если браузер блокирует такой доступ, проверять через http://localhost:8080.
Чат между разными компьютерами через интернет пока недоступен.

Когда backend будет опубликован, заменить `serverUrl` в `src/js/app.js`
на его HTTPS-адрес без завершающего `/` и отправить изменения в GitHub.
WebSocket-адрес с `wss` получится из него автоматически.

## Код

- `src/index.html` — окно входа и чат.
- `src/css/style.css` — оформление.
- `src/js/app.js` — регистрация через fetch, WebSocket и обновление страницы.

Backend основан на примере Нетологии. В него добавлена связь соединения с `id`
пользователя, чтобы участник удалялся не только по команде выхода, но и при разрыве связи.
