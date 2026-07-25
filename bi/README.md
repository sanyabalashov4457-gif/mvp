# Finance BI

Личный дашборд расходов на Streamlit. Читает таблицу `expenses` из
Postgres (той же базы, в которую пишет Telegram-бот) и даёт фильтровать
данные самостоятельно: по периоду, категориям, валюте, с группировкой
по времени.

Дашборд полностью read-only — ничего в базу не пишет.

## Настройка `.env`

Скопируй `.env.example` в `.env`:

```
DATABASE_URL=postgresql://expenses_app:password@postgres:5432/n8n
```

Пользователь `expenses_app` уже должен существовать (создан для бота) и
иметь `SELECT` на таблицу `expenses` — обычно так и есть, если
следовали README бота при создании роли.

## Локальный запуск (без Docker)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # и заполнить DATABASE_URL
streamlit run app.py
```

Откроется на `http://localhost:8501`.

## Запуск в Docker (отдельно, для локального теста)

```bash
docker build -t finance-bi .
docker run --rm --env-file .env -p 8501:8501 finance-bi
```

## Деплой как сервис в существующем docker-compose стеке

Добавь в тот же compose-файл, где уже описаны `postgres`, `n8n` и
`finance-bot`:

```yaml
  finance-bi:
    build: ./bi
    container_name: finance-bi
    restart: unless-stopped
    env_file: ./bi/.env
    networks:
      - internal
      - proxy
```

Сервис должен быть в сети `proxy` (как `n8n`), чтобы до него дотянулся
nginx-proxy-manager, и в `internal` — чтобы видеть `postgres`.

Порт наружу отдельно пробрасывать не нужно — nginx-proxy-manager
достучится до контейнера напрямую по имени сервиса и порту `8501`
внутри docker-сети.

## Публикация через nginx-proxy-manager с паролем

Раз это личные финансовые данные — доступ закрыт Basic Auth на уровне
nginx-proxy-manager, сам дашборд авторизацию не делает.

1. **Proxy Host** → **Add Proxy Host**:
   - Domain Names: поддомен, который хочешь использовать (например
     `expenses.твой-домен.ru`) — DNS-запись на него должна уже вести на
     сервер.
   - Scheme: `http`
   - Forward Hostname/IP: `finance-bi` (имя сервиса в compose)
   - Forward Port: `8501`
   - Включи `Block Common Exploits`.
   - На вкладке **SSL** — закажи Let's Encrypt сертификат (Force SSL).

2. **Access Lists** → **Add Access List**:
   - Вкладка **Authorization**: добавь логин/пароль (можно несколько
     пар, если нужно больше одного человека).
   - Вкладка **Access**: `Satisfy Any` не включать — нужен именно
     пароль, а не просто список IP.
   - Сохрани список и привяжи его к Proxy Host из шага 1 (поле
     `Access List` в настройках Proxy Host).

После этого сайт будет доступен только по логину/паролю, которые ты
задал в Access List.

## Данные и обновление

Дашборд кэширует данные на 60 секунд (`st.cache_data(ttl=60)`) — кнопка
«Обновить данные» сбрасывает кэш и подтягивает свежие записи сразу же,
не дожидаясь TTL.
