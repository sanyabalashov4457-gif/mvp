from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.db import get_db

router = APIRouter(tags=["employees"])
templates = Jinja2Templates(
    directory=str(Path(__file__).resolve().parent.parent / "templates")
)


@router.get("/employees", response_class=HTMLResponse)
def employees_list(request: Request, db: Session = Depends(get_db)):
    employees = db.query(models.Employee).order_by(models.Employee.full_name).all()
    return templates.TemplateResponse(
        request=request,
        name="employees.html",
        context={
            "request": request,
            "employees": employees,
            "selected_employee": None,
            "active_page": "employees",
        },
    )


@router.get("/employees/{employee_id}", response_class=HTMLResponse)
def employee_detail(employee_id: int, request: Request, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employees = db.query(models.Employee).order_by(models.Employee.full_name).all()
    return templates.TemplateResponse(
        request=request,
        name="employees.html",
        context={
            "request": request,
            "employees": employees,
            "selected_employee": employee,
            "active_page": "employees",
        },
    )
