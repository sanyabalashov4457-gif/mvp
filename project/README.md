# AI-консультант по API-документации (локально)

Локальный сервис на **FastAPI + ChromaDB + Ollama**, который:

- принимает PDF-документацию из `data/docs`
- делает chunking + embeddings
- сохраняет данные в векторную БД
- отвечает на вопросы через `POST /ask` с RAG-пайплайном
- возвращает структурированный JSON, удобный для n8n

## 1) Установка

```bash
cd project
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2) Установка Ollama

Установите Ollama по инструкции: https://ollama.com/download

Проверьте, что сервис Ollama запущен локально на `http://localhost:11434`.

### macOS (быстрый путь)

Если команда `ollama` не найдена:

```bash
brew install ollama
```

Запустите фоновый сервис:

```bash
brew services start ollama
```

Проверка:

```bash
ollama --version
curl http://localhost:11434/api/tags
```

Альтернатива: установить Ollama.app и запустить приложение вручную.

## 3) Скачивание моделей

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

## 4) Загрузка PDF

Положите PDF-файлы в папку:

```text
project/data/docs/
```

## 5) Запуск ingest (индексация)

```bash
python scripts/ingest.py
```

Если Ollama не установлен или не запущен, скрипт выведет понятную ошибку с инструкцией.

Что происходит:

- читаются все PDF из `data/docs`
- текст режется на чанки (`800` символов, overlap `100`)
- создаются embeddings через Ollama (`nomic-embed-text`)
- данные сохраняются в ChromaDB (`db/`)

## 6) Запуск API

```bash
uvicorn app.main:app --reload
```

Если Ollama недоступен, `POST /ask` вернет `503 Service Unavailable` с диагностикой.

API поднимется на:

```text
http://127.0.0.1:8000
```

## 7) Тест через curl

```bash
curl -X POST "http://127.0.0.1:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Какой endpoint используется для создания токена?"
  }'
```

Пример ответа:

```json
{
  "answer": "....",
  "sources": [
    {
      "text": "....",
      "page": 12
    }
  ]
}
```

## n8n интеграция

Используйте в `HTTP Request` node:

- Method: `POST`
- URL: `http://<host>:8000/ask`
- Body (JSON):

```json
{
  "question": "Ваш вопрос"
}
```

Сервис возвращает JSON и рассчитан на быстрый ответ (таймаут вызова генерации по умолчанию `10` сек через `ASK_TIMEOUT_SECONDS=10`).

## Конфигурация (.env)

```env
OLLAMA_URL=http://localhost:11434
MODEL_NAME=llama3
EMBED_MODEL=nomic-embed-text
```

Дополнительно:

- `ASK_TIMEOUT_SECONDS` (по умолчанию `10`)
- `INGEST_TIMEOUT_SECONDS` (по умолчанию `60`)

