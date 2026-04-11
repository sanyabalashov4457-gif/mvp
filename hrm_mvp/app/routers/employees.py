from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.auth import get_current_user
from app.db import get_db
from app.services import create_notification

router = APIRouter(tags=["employees"])
templates = Jinja2Templates(
    directory=str(Path(__file__).resolve().parent.parent / "templates")
)

EMPLOYEE_MESSAGES = {
    "linked_applications": "Нельзя удалить сотрудника: есть связанные заявки.",
    "deleted": "Сотрудник удален.",
}


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


def _get_employee_message(request: Request, key: str) -> str | None:
    code = request.query_params.get(key, "").strip()
    return EMPLOYEE_MESSAGES.get(code)


def _employee_competency_rows(employee: models.Employee) -> list[dict]:
    rows = [
        {"competency_id": item.competency_id, "level": item.level}
        for item in employee.competencies
    ]
    rows.append({"competency_id": "", "level": ""})
    while len(rows) < 5:
        rows.append({"competency_id": "", "level": ""})
    return rows


def _employee_edit_context(
    request: Request,
    db: Session,
    employee: models.Employee,
    form_error: str | None = None,
) -> dict:
    return {
        "request": request,
        "employee": employee,
        "directions": db.query(models.Direction).order_by(models.Direction.name).all(),
        "competencies": db.query(models.Competency).order_by(models.Competency.name).all(),
        "competency_rows": _employee_competency_rows(employee),
        "form_error": form_error,
        "active_page": "employees",
    }


@router.get("/employees", response_class=HTMLResponse)
def employees_list(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    context = _employees_page_context(request=request, db=db)
    context["page_error"] = _get_employee_message(request, "error")
    context["page_success"] = _get_employee_message(request, "success")
    context["current_user"] = current_user
    return templates.TemplateResponse(
        request=request,
        name="employees.html",
        context=context,
    )


@router.get("/employees/{employee_id}", response_class=HTMLResponse)
def employee_detail(
    employee_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    return templates.TemplateResponse(
        request=request,
        name="employee_detail.html",
        context={
            "request": request,
            "employee": employee,
            "page_error": _get_employee_message(request, "error"),
            "current_user": current_user,
            "active_page": "employees",
        },
    )


@router.get("/employees/{employee_id}/edit", response_class=HTMLResponse)
def employee_edit_form(
    employee_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return templates.TemplateResponse(
        request=request,
        name="employee_edit.html",
        context={
            **_employee_edit_context(request=request, db=db, employee=employee),
            "current_user": current_user,
        },
    )


@router.post("/employees/{employee_id}/edit")
def employee_edit(
    employee_id: int,
    request: Request,
    full_name: str = Form(...),
    direction_id: int = Form(...),
    position: str = Form(...),
    competency_id: list[str] = Form(default=[]),
    competency_level: list[str] = Form(default=[]),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    full_name = full_name.strip()
    position = position.strip()
    if not full_name or not position:
        return templates.TemplateResponse(
            request=request,
            name="employee_edit.html",
            context=_employee_edit_context(
                request=request,
                db=db,
                employee=employee,
                form_error="Заполните ФИО и должность.",
            ),
            status_code=400,
        )

    employee.full_name = full_name
    employee.direction_id = direction_id
    employee.position = position

    db.query(models.EmployeeCompetency).filter(
        models.EmployeeCompetency.employee_id == employee.id
    ).delete(synchronize_session=False)

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
    create_notification(
        db,
        f"Обновлен сотрудник: {employee.full_name}",
        notification_type="employee_updated",
        target_url=f"/employees/{employee.id}",
    )
    return RedirectResponse(url=f"/employees/{employee.id}", status_code=303)


@router.post("/employees/{employee_id}/delete")
def employee_delete(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    linked_applications_count = (
        db.query(models.Application)
        .filter(models.Application.employee_id == employee.id)
        .count()
    )
    if linked_applications_count > 0:
        return RedirectResponse(
            url=f"/employees/{employee.id}?error=linked_applications",
            status_code=303,
        )

    employee_name = employee.full_name
    db.delete(employee)
    db.commit()
    create_notification(
        db,
        f"Удален сотрудник: {employee_name}",
        notification_type="employee_deleted",
        target_url="/employees",
    )
    return RedirectResponse(
        url="/employees?success=deleted",
        status_code=303,
    )


@router.post("/employees/create")
def employee_create(
    full_name: str = Form(...),
    direction_id: int = Form(...),
    position: str = Form(...),
    competency_id: list[str] = Form(default=[]),
    competency_level: list[str] = Form(default=[]),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
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
    create_notification(
        db,
        f"Создан новый сотрудник: {employee.full_name}",
        notification_type="employee_created",
        target_url=f"/employees/{employee.id}",
    )
    return RedirectResponse(url=f"/employees/{employee.id}", status_code=303)
