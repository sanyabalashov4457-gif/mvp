from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.db import Base, engine
from app.routers import analytics, applications, courses, employees

Base.metadata.create_all(bind=engine)


def ensure_schema_updates() -> None:
    # MVP-safe schema patch for existing databases without migrations.
    with engine.begin() as connection:
        inspector = inspect(connection)
        if "applications" not in inspector.get_table_names():
            return

        columns = {column["name"] for column in inspector.get_columns("applications")}
        if "comparison_snapshot_json" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE applications "
                    "ADD COLUMN comparison_snapshot_json TEXT NOT NULL DEFAULT '[]'"
                )
            )


ensure_schema_updates()

app = FastAPI(title="HRM MVP")
app.mount(
    "/static",
    StaticFiles(directory=str(Path(__file__).resolve().parent / "static")),
    name="static",
)

app.include_router(employees.router)
app.include_router(courses.router)
app.include_router(applications.router)
app.include_router(analytics.router)


@app.get("/")
def root_redirect():
    return RedirectResponse(url="/applications")
