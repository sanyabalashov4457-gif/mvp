from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app import models
from app.db import get_db
from app.services import get_notification_target_url

router = APIRouter(tags=["notifications"])
templates = Jinja2Templates(
    directory=str(Path(__file__).resolve().parent.parent / "templates")
)


@router.get("/notifications", response_class=HTMLResponse)
def notifications_list(request: Request, db: Session = Depends(get_db)):
    notifications = (
        db.query(models.Notification)
        .order_by(models.Notification.created_at.desc())
        .all()
    )
    return templates.TemplateResponse(
        request=request,
        name="notifications.html",
        context={
            "request": request,
            "notifications": notifications,
            "active_page": "notifications",
        },
    )


@router.post("/notifications/{notification_id}/read")
def notifications_mark_read(notification_id: int, db: Session = Depends(get_db)):
    notification = (
        db.query(models.Notification)
        .filter(models.Notification.id == notification_id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return RedirectResponse(url="/notifications", status_code=303)


@router.get("/notifications/{notification_id}/open")
def notifications_open(notification_id: int, db: Session = Depends(get_db)):
    notification = (
        db.query(models.Notification)
        .filter(models.Notification.id == notification_id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()

    target_url = get_notification_target_url(notification.target_url)
    return RedirectResponse(url=target_url, status_code=303)
