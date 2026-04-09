from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.db import Base, engine
from app.routers import analytics, applications, courses, employees

Base.metadata.create_all(bind=engine)

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
