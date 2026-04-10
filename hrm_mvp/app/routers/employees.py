from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.db import get_db

router = APIRouter(tags=["employees"])
templates = Jinja2Templates(
    directory=str(Path(__file__).resolve().parent.parent / "templates")
)


def _employees_page_context(request: Request, db: Session):
    employees = db.query(models.Employee).order_by(models.Employee.full_name).all()
    directions = db.query(models.Direction).order_by(models.Direction.name).all()
    competencies = db.query(models.Competency).order_by(models.Competency.name).all()
    return {
        "request": request,
        "employees": employees,
        "directions": directions,
        "competencies": competencies,
        "active_page": "employees",
    }


@router.get("/employees", response_class=HTMLResponse)
def employees_list(request: Request, db: Session = Depends(get_db)):
    return templates.TemplateResponse(
        request=request,
        name="employees.html",
        context=_employees_page_context(request=request, db=db),
    )


@router.get("/employees/{employee_id}", response_class=HTMLResponse)
def employee_detail(employee_id: int, request: Request, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    return templates.TemplateResponse(
        request=request,
        name="employee_detail.html",
        context={
            "request": request,
            "employee": employee,
            "active_page": "employees",
        },
    )


@router.post("/employees/create")
def employee_create(
    full_name: str = Form(...),
    direction_id: int = Form(...),
    position: str = Form(...),
    competency_id: list[str] = Form(default=[]),
    competency_level: list[str] = Form(default=[]),
    db: Session = Depends(get_db),
):
    full_name = full_name.strip()
    position = position.strip()
    if not full_name or not position:
        return RedirectResponse(url="/employees", status_code=303)

    employee = models.Employee(
        full_name=full_name,
        direction_id=direction_id,
        position=position,
    )
    db.add(employee)
    db.flush()

    seen_competencies: set[int] = set()
    for competency_id_raw, level_raw in zip(competency_id, competency_level):
        if not competency_id_raw or not level_raw:
            continue
        if not competency_id_raw.isdigit() or not level_raw.isdigit():
            continue
        competency_id_int = int(competency_id_raw)
        level_int = int(level_raw)
        if level_int < 1 or level_int > 5 or competency_id_int in seen_competencies:
            continue
        seen_competencies.add(competency_id_int)
        db.add(
            models.EmployeeCompetency(
                employee_id=employee.id,
                competency_id=competency_id_int,
                level=level_int,
            )
        )

    db.commit()
    return RedirectResponse(url=f"/employees/{employee.id}", status_code=303)
