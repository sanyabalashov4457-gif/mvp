import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import inspect, text

from app import models
from app.auth import LoginRequired
from app.db import Base, SessionLocal, engine
from app.routers import analytics, applications, auth, courses, employees, notifications
from app.template_context import inject_global_template_context

Base.metadata.create_all(bind=engine)


def ensure_schema_updates() -> None:
    # MVP-safe schema patch for existing databases without migrations.
    with engine.begin() as connection:
        inspector = inspect(connection)
        table_names = set(inspector.get_table_names())

        if "applications" in table_names:
            columns = {column["name"] for column in inspector.get_columns("applications")}
            if "comparison_snapshot_json" not in columns:
                connection.execute(
                    text(
                        "ALTER TABLE applications "
                        "ADD COLUMN comparison_snapshot_json TEXT NOT NULL DEFAULT '[]'"
                    )
                )

        if "notifications" not in table_names:
            connection.execute(
                text(
                    "CREATE TABLE notifications ("
                    "id SERIAL PRIMARY KEY, "
                    "user_id INTEGER NULL, "
                    "message VARCHAR(255) NOT NULL, "
                    "type VARCHAR(50) NULL, "
                    "target_url VARCHAR(255) NULL, "
                    "is_read BOOLEAN NOT NULL DEFAULT FALSE, "
                    "created_at TIMESTAMP NOT NULL DEFAULT NOW()"
                    ")"
                )
            )
        else:
            notification_columns = {
                column["name"] for column in inspector.get_columns("notifications")
            }
            if "target_url" not in notification_columns:
                if "link" in notification_columns:
                    connection.execute(
                        text(
                            "ALTER TABLE notifications "
                            "RENAME COLUMN link TO target_url"
                        )
                    )
                else:
                    connection.execute(
                        text(
                            "ALTER TABLE notifications "
                            "ADD COLUMN target_url VARCHAR(255) NULL"
                        )
                    )


ensure_schema_updates()

app = FastAPI(title="HRM MVP")
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", "hrm-mvp-session-secret"),
)
app.mount(
    "/static",
    StaticFiles(directory=str(Path(__file__).resolve().parent / "static")),
    name="static",
)
app.middleware("http")(inject_global_template_context)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(courses.router)
app.include_router(applications.router)
app.include_router(analytics.router)
app.include_router(notifications.router)


@app.get("/")
def root_redirect(request: Request):
    session_data = request.scope.get("session") or {}
    if session_data.get("user_id"):
        return RedirectResponse(url="/applications")
    return RedirectResponse(url="/login")


@app.exception_handler(LoginRequired)
async def login_required_handler(request: Request, exc: LoginRequired):
    return RedirectResponse(url="/login", status_code=303)


def ensure_default_users() -> None:
    db = SessionLocal()
    try:
        has_users = db.query(models.User.id).first() is not None
        if has_users:
            return
        db.add_all(
            [
                models.User(username="admin", password="admin", role="admin"),
                models.User(username="hr", password="hr", role="hr"),
                models.User(username="manager", password="manager", role="manager"),
            ]
        )
        db.commit()
    finally:
        db.close()


ensure_default_users()


@app.get("/health")
def healthcheck():
    return RedirectResponse(url="/applications")
