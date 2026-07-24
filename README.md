# Finance Bot

Личный (single-user) Telegram-бот для учёта расходов. Собирает данные
диалогом и пишет их строками в таблицу `expenses` в Postgres. Перенос
из Postgres в Google Sheets делает отдельный n8n-флоу — бот об этом
ничего не знает.

## Функциональность

- Быстрый ввод одной строкой: `Кофе 250` или `Кофе 250 еда`.
- Пошаговый ввод через `/add` (wizard: товар → сумма → категория →
  валюта → дата → подтверждение).
- Локальная очередь (`data/pending.json`) на случай недоступности
  Postgres, с автоматическим повтором отправки каждые 2 минуты.
- Доступ только для одного Telegram-пользователя (`ALLOWED_USER_ID`).

## Настройка `.env`

Скопируй `.env.example` в `.env` и заполни:

```
BOT_TOKEN=
ALLOWED_USER_ID=
DATABASE_URL=postgresql://expenses_app:password@postgres_host:5432/dbname
DEFAULT_CURRENCY=RUB
```

### BOT_TOKEN

1. Напиши [@BotFather](https://t.me/BotFather) в Telegram.
2. Команда `/newbot`, следуй инструкциям (имя и username бота).
3. BotFather пришлёт токен вида `123456789:AAF...` — это и есть
   `BOT_TOKEN`.

### ALLOWED_USER_ID

1. Напиши [@userinfobot](https://t.me/userinfobot) в Telegram.
2. Он пришлёт твой numeric `Id` — это `ALLOWED_USER_ID`. Именно с этого
   Telegram-аккаунта бот будет принимать сообщения; все остальные
   получат в ответ «Этот бот приватный», и их сообщения не будут
   обработаны и никак не залогированы.

### DATABASE_URL

Формат: `postgresql://<user>:<password>@<host>:<port>/<database>`.

- `<user>` — `expenses_app` (пользователь, под которого выданы права на
  таблицу `expenses`).
- `<password>` — его пароль в Postgres.
- `<host>` — адрес сервера Postgres. Если бот и Postgres — сервисы
  одного docker-compose стека, обычно это имя сервиса Postgres в сети
  compose (например `postgres`), а не `localhost`.
- `<port>` — обычно `5432`.
- `<database>` — имя базы, где создана таблица `expenses`.

Таблица `expenses` должна быть уже создана заранее (бот её не создаёт):

```sql
create table expenses (
  id bigint generated always as identity primary key,
  item text,
  amount numeric,
  currency text,
  category text,
  expense_date date,
  created_at timestamptz default now(),
  synced_at timestamptz
);
```

## Локальный запуск (без Docker)

```bash
npm install
cp .env.example .env   # и заполнить значения
npm run dev            # ts-node-dev с hot reload
```

Продакшен-сборка локально:

```bash
npm install
npm run build
npm start
```

## Запуск в Docker (отдельно, для локального теста)

Сборка образа:

```bash
docker build -t finance-bot .
```

Запуск контейнера с `.env`-файлом:

```bash
docker run --rm --env-file .env --name finance-bot finance-bot
```

Если Postgres поднят в docker-compose и нужно достучаться до него из
отдельно запущенного контейнера — укажи в `DATABASE_URL` хост Postgres
так, как он виден извне (например `host.docker.internal`, либо подключи
контейнер к той же docker-сети через `--network`).

Логи пишутся в консоль и в `logs/bot.log` внутри контейнера; локальная
очередь неотправленных записей — в `data/pending.json`. Для сохранения
между перезапусками контейнера смонтируй эти пути как volume:

```bash
docker run --rm --env-file .env \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --name finance-bot finance-bot
```

## Запуск как сервис в существующем docker-compose стеке

Добавь сервис в существующий `docker-compose.yml` стека (сам файл этот
проект не создаёт):

```yaml
services:
  finance-bot:
    build: ./bot
    env_file: ./bot/.env
    restart: unless-stopped
    volumes:
      - ./bot/data:/app/data
      - ./bot/logs:/app/logs
```

Убедись, что сервис Postgres в том же compose-стеке доступен под именем,
указанным в `DATABASE_URL` (обычно имя сервиса, например `postgres`).

## Команды бота

- `/start` — приветствие и краткая инструкция.
- `/help` — список команд и формат быстрого ввода.
- `/add` — пошаговый ввод расхода.
- `/pending` — сколько записей висит в локальной очереди и их список.
- `/cancel` — отменить текущий диалог.
