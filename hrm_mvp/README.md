# HRM MVP - Employee Training Requests

Simple MVP web application for managing employee training requests.

## Tech stack

- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Jinja2 + Bootstrap

## Project structure

```text
hrm_mvp/
├── app/
│   ├── main.py
│   ├── db.py
│   ├── models.py
│   ├── schemas.py
│   ├── services.py
│   ├── seed.py
│   ├── routers/
│   │   ├── employees.py
│   │   ├── courses.py
│   │   ├── applications.py
│   │   └── analytics.py
│   ├── templates/
│   │   ├── base.html
│   │   ├── employees.html
│   │   ├── courses.html
│   │   ├── applications.html
│   │   ├── application_create.html
│   │   └── analytics.html
│   └── static/
├── requirements.txt
├── README.md
└── .env.example
```

## Run locally

### 1) Create and activate virtual environment

```bash
cd hrm_mvp
python3 -m venv .venv
source .venv/bin/activate
```

### 2) Install dependencies

```bash
pip install -r requirements.txt
```

### 3) Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` if needed:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hrm_mvp
```

### 4) Create PostgreSQL database

Example command:

```bash
createdb hrm_mvp
```

### 5) Seed demo data

```bash
python -m app.seed
```

### 6) Start server

```bash
uvicorn app.main:app --reload
```

Open in browser:

- http://127.0.0.1:8000/applications
- http://127.0.0.1:8000/employees
- http://127.0.0.1:8000/courses
- http://127.0.0.1:8000/analytics

## Notes

- No authentication
- One app, no microservices
- MVP-level simple code and structure
