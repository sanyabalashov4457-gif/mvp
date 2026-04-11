from starlette.requests import Request

from app import models
from app.auth import get_role_label
from app.db import SessionLocal
from app.services import get_unread_notifications_count


async def inject_global_template_context(request: Request, call_next):
    db = SessionLocal()
    try:
        current_user = None
        session_data = request.scope.get("session") or {}
        user_id = session_data.get("user_id")
        if user_id:
            current_user = db.query(models.User).filter(models.User.id == user_id).first()
            if not current_user:
                session_data.clear()

        request.state.current_user = current_user
        request.state.current_role = current_user.role if current_user else None
        request.state.current_role_label = (
            get_role_label(current_user.role) if current_user else ""
        )
        request.state.unread_notifications_count = (
            get_unread_notifications_count(db) if current_user else 0
        )
    finally:
        db.close()
    return await call_next(request)
