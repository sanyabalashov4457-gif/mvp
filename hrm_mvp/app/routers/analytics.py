from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.auth import get_current_user
from app.db import get_db
from app.services import get_status_label

router = APIRouter(tags=["analytics"])
templates = Jinja2Templates(directory=str(Path(__file__).resolve().parent.parent / "templates"))


@router.get("/analytics", response_class=HTMLResponse)
def analytics_page(
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    total = db.query(func.count(models.Application.id)).scalar() or 0
    avg_similarity = db.query(func.avg(models.Application.similarity_percent)).scalar() or 0

    status_rows = (
        db.query(models.Application.status, func.count(models.Application.id))
        .group_by(models.Application.status)
        .all()
    )
    status_counts = {status: count for status, count in status_rows}

    return templates.TemplateResponse(
        request=request,
        name="analytics.html",
        context={
            "request": request,
            "total_applications": total,
            "avg_similarity": round(float(avg_similarity), 1),
            "status_counts": status_counts,
            "get_status_label": get_status_label,
            "current_user": current_user,
            "active_page": "analytics",
        },
    )
