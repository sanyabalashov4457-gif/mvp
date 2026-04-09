import json
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.services import (
    APPLICATION_STATUS_CHOICES,
    compare_competencies,
    get_snapshot_result_badge_class,
    get_snapshot_result_label,
    get_status_label,
    to_snapshot_items,
    compare_competencies,
)

router = APIRouter(tags=["applications"])
templates = Jinja2Templates(directory=str(Path(__file__).resolve().parent.parent / "templates"))


@router.get("/applications", response_class=HTMLResponse)
def applications_list(request: Request, db: Session = Depends(get_db)):
    applications = db.query(models.Application).order_by(models.Application.created_at.desc()).all()
    return templates.TemplateResponse(
        request=request,
        name="applications.html",
        context={
            "request": request,
            "applications": applications,
            "active_page": "applications",
            "get_status_label": get_status_label,
        },
    )


@router.get("/applications/create", response_class=HTMLResponse)
def application_create_form(
    request: Request,
    employee_id: str | None = None,
    course_id: str | None = None,
    db: Session = Depends(get_db),
):
    employees = db.query(models.Employee).order_by(models.Employee.full_name).all()
    courses = db.query(models.Course).order_by(models.Course.name).all()

    selected_employee = None
    selected_course = None
    comparison = None

    employee_id_int = int(employee_id) if employee_id and employee_id.isdigit() else None
    course_id_int = int(course_id) if course_id and course_id.isdigit() else None

    if employee_id_int:
        selected_employee = (
            db.query(models.Employee).filter(models.Employee.id == employee_id_int).first()
        )
    if course_id_int:
        selected_course = (
            db.query(models.Course).filter(models.Course.id == course_id_int).first()
        )
    if selected_employee and selected_course:
        comparison = compare_competencies(db, employee_id=selected_employee.id, course_id=selected_course.id)

    return templates.TemplateResponse(
        request=request,
        name="application_create.html",
        context={
            "request": request,
            "employees": employees,
            "courses": courses,
            "selected_employee": selected_employee,
            "selected_course": selected_course,
            "comparison": comparison,
            "active_page": "applications",
            "get_status_label": get_status_label,
            "status_choices": APPLICATION_STATUS_CHOICES,
            "get_snapshot_result_label": get_snapshot_result_label,
            "get_snapshot_result_badge_class": get_snapshot_result_badge_class,
        },
    )


@router.post("/applications/create")
def application_create_submit(
    employee_id: int = Form(...),
    course_id: int = Form(...),
    goal_text: str = Form(...),
    expected_result_text: str = Form(...),
    status: str = Form("new"),
    db: Session = Depends(get_db),
):
    if status not in APPLICATION_STATUS_CHOICES:
        status = "new"
    comparison = compare_competencies(db, employee_id=employee_id, course_id=course_id)
    snapshot_items = to_snapshot_items(comparison["detailed"])

    application = models.Application(
        employee_id=employee_id,
        course_id=course_id,
        goal_text=goal_text,
        expected_result_text=expected_result_text,
        status=status,
        similarity_percent=comparison["similarity_percent"],
        current_skill_matches=comparison["current_skill_matches"],
        new_skills_count=comparison["new_skills_count"],
        growth_skills_count=comparison["growth_skills_count"],
        comparison_snapshot_json=json.dumps(snapshot_items, ensure_ascii=False),
    )
    db.add(application)
    db.commit()
    return RedirectResponse(url="/applications", status_code=303)


@router.get("/applications/{application_id}", response_class=HTMLResponse)
def application_detail(application_id: int, request: Request, db: Session = Depends(get_db)):
    application = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    snapshot_rows = []
    if application.comparison_snapshot_json:
        try:
            parsed = json.loads(application.comparison_snapshot_json)
            if isinstance(parsed, list):
                snapshot_rows = parsed
        except json.JSONDecodeError:
            snapshot_rows = []

    return templates.TemplateResponse(
        request=request,
        name="application_detail.html",
        context={
            "request": request,
            "application": application,
            "snapshot_rows": snapshot_rows,
            "active_page": "applications",
            "get_status_label": get_status_label,
            "get_snapshot_result_label": get_snapshot_result_label,
            "get_snapshot_result_badge_class": get_snapshot_result_badge_class,
        },
    )
