from sqlalchemy.orm import Session

from app import models


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
            status = "NEW"
            new += 1
        elif employee_level >= item.target_level:
            status = "MATCH"
            matches += 1
        else:
            status = "GROWTH"
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
