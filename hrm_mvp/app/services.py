from sqlalchemy.orm import Session

from app import models

STATUS_LABELS_RU = {
    "new": "Новая",
    "approved": "Одобрена",
    "rejected": "Отклонена",
    "in_progress": "В процессе",
    "training_completed": "Обучение завершено",
    "training_not_completed": "Обучение не закончено",
}

APPLICATION_STATUS_CHOICES = [
    "new",
    "approved",
    "rejected",
    "in_progress",
    "training_completed",
    "training_not_completed",
]

SNAPSHOT_RESULT_LABELS_RU = {
    "match": "Совпадает",
    "growth": "Требует развития",
    "new": "Новый навык",
}

SNAPSHOT_RESULT_BADGE_CLASSES = {
    "match": "text-bg-success",
    "growth": "text-bg-warning",
    "new": "text-bg-info",
}


def get_status_label(status_code: str) -> str:
    return STATUS_LABELS_RU.get(status_code, status_code)


def normalize_snapshot_result(status_code: str) -> str:
    normalized = (status_code or "").strip().lower()
    if normalized in {"match", "growth", "new"}:
        return normalized
    return "new"


def get_snapshot_result_label(status_code: str) -> str:
    normalized = normalize_snapshot_result(status_code)
    return SNAPSHOT_RESULT_LABELS_RU.get(normalized, normalized)


def get_snapshot_result_badge_class(status_code: str) -> str:
    normalized = normalize_snapshot_result(status_code)
    return SNAPSHOT_RESULT_BADGE_CLASSES.get(normalized, "text-bg-secondary")


def to_snapshot_items(detailed_rows: list[dict]) -> list[dict]:
    return [
        {
            "competency_name": row.get("competency_name"),
            "employee_level": row.get("employee_level"),
            "course_target_level": row.get("target_level"),
            "status": normalize_snapshot_result(row.get("status", "")),
        }
        for row in detailed_rows
    ]


def create_notification(
    db: Session,
    message: str,
    notification_type: str | None = None,
    target_url: str | None = None,
) -> None:
    notification = models.Notification(
        user_id=None,
        message=message,
        type=notification_type,
        target_url=target_url,
    )
    db.add(notification)
    db.commit()


def get_notification_target_url(target_url: str | None) -> str:
    if not target_url:
        return "/notifications"
    clean_target = target_url.strip()
    if not clean_target.startswith("/"):
        return "/notifications"
    return clean_target


def get_unread_notifications_count(db: Session) -> int:
    return (
        db.query(models.Notification)
        .filter(models.Notification.is_read.is_(False))
        .count()
    )


def compare_competencies(db: Session, employee_id: int, course_id: int) -> dict:
    employee_competencies = (
        db.query(models.EmployeeCompetency)
        .filter(models.EmployeeCompetency.employee_id == employee_id)
        .all()
    )
    employee_map = {item.competency_id: item.level for item in employee_competencies}

    course_competencies = (
        db.query(models.CourseCompetency)
        .filter(models.CourseCompetency.course_id == course_id)
        .all()
    )

    detailed = []
    matches = 0
    growth = 0
    new = 0

    for item in course_competencies:
        employee_level = employee_map.get(item.competency_id)
        if employee_level is None:
            status = "new"
            new += 1
        elif employee_level >= item.target_level:
            status = "match"
            matches += 1
        else:
            status = "growth"
            growth += 1

        detailed.append(
            {
                "competency_id": item.competency_id,
                "competency_name": item.competency.name,
                "target_level": item.target_level,
                "employee_level": employee_level,
                "status": status,
            }
        )

    total = len(course_competencies)
    similarity_percent = int((matches / total) * 100) if total else 0

    return {
        "similarity_percent": similarity_percent,
        "current_skill_matches": matches,
        "growth_skills_count": growth,
        "new_skills_count": new,
        "detailed": detailed,
    }
