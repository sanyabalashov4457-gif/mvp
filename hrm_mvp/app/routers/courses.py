from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.services import create_notification

router = APIRouter(tags=["courses"])
templates = Jinja2Templates(
    directory=str(Path(__file__).resolve().parent.parent / "templates")
)


def _courses_page_context(request: Request, db: Session):
    courses = db.query(models.Course).order_by(models.Course.name).all()
    competencies = db.query(models.Competency).order_by(models.Competency.name).all()
    return {
        "request": request,
        "courses": courses,
        "competencies": competencies,
        "active_page": "courses",
    }


def _parse_course_competencies_form(request: Request) -> list[tuple[int, int]]:
    pairs: list[tuple[int, int]] = []
    for index in range(1, 4):
        competency_raw = request.form().get(f"competency_id_{index}")
        target_level_raw = request.form().get(f"target_level_{index}")
        if not competency_raw or not target_level_raw:
            continue
        competency_text = str(competency_raw).strip()
        target_level_text = str(target_level_raw).strip()
        if not competency_text.isdigit() or not target_level_text.isdigit():
            continue
        competency_id = int(competency_text)
        target_level = int(target_level_text)
        if 1 <= target_level <= 5:
            pairs.append((competency_id, target_level))
    return pairs


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
        name="course_detail.html",
        context={
            "request": request,
            "course": course,
            "active_page": "courses",
        },
    )


@router.post("/courses/create")
def course_create(
    request: Request,
    name: str = Form(...),
    description: str = Form(...),
    format: str = Form(...),
    duration_hours: int = Form(...),
    competency_ids: list[str] = Form(default=[]),
    target_levels: list[str] = Form(default=[]),
    db: Session = Depends(get_db),
):
    name = name.strip()
    description = description.strip()
    format = format.strip()

    if not name or not description or not format or duration_hours <= 0:
        return templates.TemplateResponse(
            request=request,
            name="courses.html",
            context={
                **_courses_page_context(request=request, db=db),
                "form_error": "Заполните корректно все поля курса.",
            },
            status_code=400,
        )

    new_course = models.Course(
        name=name,
        description=description,
        format=format,
        duration_hours=duration_hours,
    )
    db.add(new_course)
    db.flush()

    seen_competencies: set[int] = set()
    for competency_id_raw, target_level_raw in zip(competency_ids, target_levels):
        if not competency_id_raw or not target_level_raw:
            continue
        if not competency_id_raw.isdigit() or not target_level_raw.isdigit():
            continue
        competency_id = int(competency_id_raw)
        target_level = int(target_level_raw)
        if target_level < 1 or target_level > 5:
            continue
        if competency_id in seen_competencies:
            continue
        seen_competencies.add(competency_id)
        db.add(
            models.CourseCompetency(
                course_id=new_course.id,
                competency_id=competency_id,
                target_level=target_level,
            )
        )

    db.commit()
    create_notification(
        db,
        message=f"Создан новый курс: {new_course.name}",
        notification_type="course_created",
        target_url=f"/courses/{new_course.id}",
    )

    return RedirectResponse(url=f"/courses/{new_course.id}", status_code=303)
