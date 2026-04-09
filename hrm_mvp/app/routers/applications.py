from pathlib import Path

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.services import compare_competencies

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
        },
    )


@router.get("/applications/create", response_class=HTMLResponse)
def application_create_form(
    request: Request,
    employee_id: int | None = None,
    course_id: int | None = None,
    db: Session = Depends(get_db),
):
    employees = db.query(models.Employee).order_by(models.Employee.full_name).all()
    courses = db.query(models.Course).order_by(models.Course.name).all()

    selected_employee = None
    selected_course = None
    comparison = None

    if employee_id:
        selected_employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if course_id:
        selected_course = db.query(models.Course).filter(models.Course.id == course_id).first()
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
    comparison = compare_competencies(db, employee_id=employee_id, course_id=course_id)

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
    )
    db.add(application)
    db.commit()
    return RedirectResponse(url="/applications", status_code=303)
