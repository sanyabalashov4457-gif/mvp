from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.db import get_db

router = APIRouter(tags=["courses"])
templates = Jinja2Templates(
    directory=str(Path(__file__).resolve().parent.parent / "templates")
)


def _courses_page_context(
    request: Request,
    db: Session,
    selected_course: models.Course | None = None,
    form_error: str | None = None,
):
    courses = db.query(models.Course).order_by(models.Course.name).all()
    return {
        "request": request,
        "courses": courses,
        "selected_course": selected_course,
        "active_page": "courses",
    }


@router.get("/courses", response_class=HTMLResponse)
def courses_list(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse(
        request=request,
        name="courses.html",
        context=_courses_page_context(request=request, db=db),
    )


@router.get("/courses/{course_id}", response_class=HTMLResponse)
def course_detail(course_id: int, request: Request, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return templates.TemplateResponse(
        request=request,
        name="courses.html",
        context=_courses_page_context(request=request, db=db, selected_course=course),
    )


@router.post("/courses/create", response_class=HTMLResponse)
def course_create(
    name: str = Form(...),
    description: str = Form(...),
    format: str = Form(...),
    duration_hours: int = Form(...),
    db: Session = Depends(get_db),
):
    name = name.strip()
    description = description.strip()
    format = format.strip()

    if not name or not description or not format or duration_hours <= 0:
        return RedirectResponse(url="/courses", status_code=303)

    new_course = models.Course(
        name=name,
        description=description,
        format=format,
        duration_hours=duration_hours,
    )
    db.add(new_course)
    db.commit()

    return RedirectResponse(url="/courses", status_code=303)
