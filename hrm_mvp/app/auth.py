from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models
from app.db import get_db


class LoginRequired(Exception):
    pass


ROLE_LABELS_RU = {
    "admin": "Администратор",
    "hr": "HR",
    "manager": "Руководитель",
}


def get_role_label(role: str) -> str:
    return ROLE_LABELS_RU.get(role, role)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    user_id = request.session.get("user_id")
    if not user_id:
        raise LoginRequired()

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        request.session.clear()
        raise LoginRequired()
    return user


def require_role(roles: list[str]):
    def _require(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Недостаточно прав доступа")
        return current_user

    return _require
