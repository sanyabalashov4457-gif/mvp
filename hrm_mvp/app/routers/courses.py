from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.db import get_db

router = APIRouter(tags=["courses"])
templates = Jinja2Templates(
    directory=str(Path(__file__).resolve().parent.parent / "templates")
)


@router.get("/courses", response_class=HTMLResponse)
def courses_list(request: Request, db: Session = Depends(get_db)):
    courses = db.query(models.Course).order_by(models.Course.name).all()
    return templates.TemplateResponse(
        "courses.html",
        {
            "request": request,
            "courses": courses,
            "selected_course": None,
            "active_page": "courses",
        },
    )


@router.get("/courses/{course_id}", response_class=HTMLResponse)
def course_detail(course_id: int, request: Request, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    courses = db.query(models.Course).order_by(models.Course.name).all()
    return templates.TemplateResponse(
        "courses.html",
        {
            "request": request,
            "courses": courses,
            "selected_course": course,
            "active_page": "courses",
        },
    )
