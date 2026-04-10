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

COURSE_MESSAGES = {
    "linked_applications": "Нельзя удалить курс: есть связанные заявки.",
    "deleted": "Курс удален.",
    "updated": "Изменения курса сохранены.",
}


def _courses_page_context(request: Request, db: Session):
    courses = db.query(models.Course).order_by(models.Course.name).all()
    competencies = db.query(models.Competency).order_by(models.Competency.name).all()
    return {
        "request": request,
        "courses": courses,
        "competencies": competencies,
        "active_page": "courses",
    }


def _get_course_message(request: Request, key: str) -> str | None:
    code = request.query_params.get(key, "").strip()
    return COURSE_MESSAGES.get(code)


def _course_competency_rows(course: models.Course) -> list[dict]:
    rows = [
        {"competency_id": item.competency_id, "target_level": item.target_level}
        for item in course.competencies
    ]
    rows.append({"competency_id": "", "target_level": ""})
    while len(rows) < 5:
        rows.append({"competency_id": "", "target_level": ""})
    return rows


def _course_edit_context(
    request: Request,
    db: Session,
    course: models.Course,
    form_error: str | None = None,
) -> dict:
    return {
        "request": request,
        "course": course,
        "competencies": db.query(models.Competency).order_by(models.Competency.name).all(),
        "competency_rows": _course_competency_rows(course),
        "form_error": form_error,
        "active_page": "courses",
    }


@router.get("/courses", response_class=HTMLResponse)
def courses_list(request: Request, db: Session = Depends(get_db)):
    context = _courses_page_context(request=request, db=db)
    context["page_error"] = _get_course_message(request, "error")
    context["page_success"] = _get_course_message(request, "success")
    return templates.TemplateResponse(
        request=request,
        name="courses.html",
        context=context,
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
            "page_error": _get_course_message(request, "error"),
            "page_success": _get_course_message(request, "success"),
            "active_page": "courses",
        },
    )


@router.get("/courses/{course_id}/edit", response_class=HTMLResponse)
def course_edit_form(course_id: int, request: Request, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return templates.TemplateResponse(
        request=request,
        name="course_edit.html",
        context=_course_edit_context(request=request, db=db, course=course),
    )


@router.post("/courses/{course_id}/edit")
def course_edit(
    course_id: int,
    request: Request,
    name: str = Form(...),
    description: str = Form(...),
    format: str = Form(...),
    duration_hours: int = Form(...),
    competency_ids: list[str] = Form(default=[]),
    target_levels: list[str] = Form(default=[]),
    competency_id: list[str] = Form(default=[]),
    target_level: list[str] = Form(default=[]),
    db: Session = Depends(get_db),
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    name = name.strip()
    description = description.strip()
    format = format.strip()

    if not name or not description or not format or duration_hours <= 0:
        return templates.TemplateResponse(
            request=request,
            name="course_edit.html",
            context=_course_edit_context(
                request=request,
                db=db,
                course=course,
                form_error="Заполните корректно все поля курса.",
            ),
            status_code=400,
        )

    course.name = name
    course.description = description
    course.format = format
    course.duration_hours = duration_hours

    db.query(models.CourseCompetency).filter(
        models.CourseCompetency.course_id == course.id
    ).delete(synchronize_session=False)

    parsed_competency_ids = competency_ids if competency_ids else competency_id
    parsed_target_levels = target_levels if target_levels else target_level

    seen_competencies: set[int] = set()
    for competency_id_raw, target_level_raw in zip(
        parsed_competency_ids,
        parsed_target_levels,
    ):
        if not competency_id_raw or not target_level_raw:
            continue
        if not competency_id_raw.isdigit() or not target_level_raw.isdigit():
            continue
        competency_id = int(competency_id_raw)
        target_level = int(target_level_raw)
        if target_level < 1 or target_level > 5 or competency_id in seen_competencies:
            continue
        seen_competencies.add(competency_id)
        db.add(
            models.CourseCompetency(
                course_id=course.id,
                competency_id=competency_id,
                target_level=target_level,
            )
        )

    db.commit()
    create_notification(
        db,
        message=f"Обновлен курс: {course.name}",
        notification_type="course_updated",
        target_url=f"/courses/{course.id}",
    )
    return RedirectResponse(
        url=f"/courses/{course.id}?success=updated",
        status_code=303,
    )


@router.post("/courses/{course_id}/delete")
def course_delete(course_id: int, request: Request, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    linked_applications_count = (
        db.query(models.Application)
        .filter(models.Application.course_id == course.id)
        .count()
    )
    if linked_applications_count > 0:
        return RedirectResponse(
            url=f"/courses/{course.id}?error=linked_applications",
            status_code=303,
        )

    course_name = course.name
    db.delete(course)
    db.commit()
    create_notification(
        db,
        message=f"Удален курс: {course_name}",
        notification_type="course_deleted",
        target_url="/courses",
    )
    return RedirectResponse(
        url="/courses?success=deleted",
        status_code=303,
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
    competency_id: list[str] = Form(default=[]),
    target_level: list[str] = Form(default=[]),
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

    parsed_competency_ids = competency_ids if competency_ids else competency_id
    parsed_target_levels = target_levels if target_levels else target_level

    seen_competencies: set[int] = set()
    for competency_id_raw, target_level_raw in zip(
        parsed_competency_ids,
        parsed_target_levels,
    ):
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
