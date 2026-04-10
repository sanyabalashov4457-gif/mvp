from starlette.requests import Request

from app.db import SessionLocal
from app.services import get_unread_notifications_count


async def inject_global_template_context(request: Request, call_next):
    db = SessionLocal()
    try:
        request.state.unread_notifications_count = get_unread_notifications_count(db)
    finally:
        db.close()
    return await call_next(request)
