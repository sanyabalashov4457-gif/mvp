from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.services import get_unread_notifications_count


def common_template_context(db: Session = Depends(get_db)) -> dict:
    return {"unread_notifications_count": get_unread_notifications_count(db)}
