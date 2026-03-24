# Avito Seller AI

Тестовое задание для стажировки Avito Frontend.

Проект состоит из двух частей:
- `server` — готовый mock API, который был дан в рамках задания
- `frontend` — клиентское приложение на React + Vite + TypeScript

Во фронтенде используется:
- React 19
- Vite
- TypeScript
- Material UI
- Zustand
- TanStack Query
- Feature-Sliced Design
- Vitest
- ESLint + Prettier

## Возможности проекта

- список объявлений с поиском, фильтрами, сортировкой, пагинацией и переключением layout
- подробная страница объявления
- страница редактирования объявления
- AI-помощь для генерации описания
- AI-оценка рыночной цены
- AI-чат по конкретному объявлению
- тёмная тема
- отмена запросов при переходах

## Структура проекта

```text
.
├─ server
└─ frontend
```

## Требования

Желательно иметь:
- Node.js 20+ или 22+
- npm 10+

## Быстрый запуск

### 1. Установить зависимости

Сервер:

```powershell
cd server
npm install
```

Фронтенд:

```powershell
cd frontend
npm install
```

### 2. Запустить сервер

По умолчанию сервер стартует на `http://localhost:8080`.

```powershell
cd server
npm run start
```

Если нужно, можно явно указать порт:

```powershell
$env:PORT=8080
npm run start
```

### 3. Настроить фронтенд `.env`

В папке `frontend` есть файл `.env.example`.  
Скопируйте его в `.env`:

```powershell
cd frontend
Copy-Item .env.example .env
```

Минимальная конфигурация:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_OPENROUTER_API_KEY=
VITE_OPENROUTER_MODEL=openai/gpt-4o-mini
VITE_LLM_PROXY_URL=
```

### 4. Запустить фронтенд

```powershell
cd frontend
npm run dev
```

После запуска приложение обычно доступно на:

`http://localhost:5173`

## Запуск через Docker Compose

В проекте есть возможность поднять клиент и сервер одной командой через `docker compose`.

### Что нужно

- установленный Docker Desktop
- доступные команды `docker` и `docker compose`

### Подготовка

В корне проекта можно создать `.env` для `docker compose`, если хотите передать AI-настройки в сборку фронтенда:

```env
VITE_OPENROUTER_API_KEY=
VITE_OPENROUTER_MODEL=openai/gpt-4o-mini
VITE_LLM_PROXY_URL=
```

Если AI не нужен, можно оставить ключ пустым.

### Запуск

Из корня проекта:

```powershell
docker compose up --build
```

После запуска:

- frontend будет доступен на `http://localhost:3000`
- server будет доступен на `http://localhost:8080`

### Остановка

```powershell
docker compose down
```

### Что проверить после запуска

- открывается `http://localhost:3000`
- загружается список объявлений
- работают переходы по страницам
- обновление страницы на маршрутах вроде `/ads`, `/ads/1`, `/ads/1/edit` не даёт `404`
- редактирование объявлений и сохранение работают

## Настройка AI

Сейчас AI во фронтенде работает через OpenRouter.

Используются 2 сценария:
- генерация и улучшение описания
- оценка цены

Для чата и описания достаточно обычной текстовой модели.  
Для цены приложение пытается использовать online-вариант модели и web search, чтобы искать реальные ориентиры, а не просто придумывать число.

### Важные замечания по AI

- Если `VITE_OPENROUTER_API_KEY` пустой, AI не будет работать.
- После изменения `.env` нужно перезапустить Vite:

```powershell
Ctrl + C
npm run dev
```

- Для оценки цены приложение использует online-режим модели. Если у выбранной модели или аккаунта OpenRouter нет доступа к online/web search, запрос цены может завершаться ошибкой доступа.

## Полезные замечания

- Сервер хранит данные в памяти. После перезапуска сервера изменения объявлений сбрасываются.
- В форме редактирования есть draft в `localStorage`.
- На странице редактирования работают hotkeys:
  - `Ctrl/Cmd + Z` — undo
  - `Ctrl/Cmd + Shift + Z` — redo
- В AI-чате:
  - `Enter` — отправка сообщения
  - `Shift + Enter` — перенос строки

## Тесты и качество кода

Во фронтенде подключены:
- ESLint
- Prettier
- Vitest

### Запуск тестов

```powershell
cd frontend
npm run test
```

### Что уже покрыто

- доменные хелперы для характеристик объявлений
- маппинги DTO -> UI model
- валидация формы редактирования
- diff-логика для блока «Было → Стало»
- часть formatting helpers

## Возможные проблемы

### `tsx` не является внутренней или внешней командой

Значит в `server` не установлены зависимости:

```powershell
cd server
npm install
```

### Ошибка порта `Received type number (NaN)`

Обычно это происходит, если некорректно задан `PORT`.  
Либо не задавайте его вообще, либо укажите нормальный числовой порт:

```powershell
$env:PORT=8080
```

### AI не работает

Проверьте:
- заполнен ли `VITE_OPENROUTER_API_KEY`
- перезапущен ли `npm run dev` после изменения `.env`
- есть ли доступ у модели к online/web search, если речь про оценку цены
