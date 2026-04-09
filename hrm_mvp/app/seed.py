import random
from datetime import datetime, timedelta

from app.db import Base, SessionLocal, engine
from app.models import (
    Application,
    Competency,
    Course,
    CourseCompetency,
    Direction,
    Employee,
    EmployeeCompetency,
)
from app.services import compare_competencies


DIRECTIONS = ["Engineering", "Marketing", "Operations"]

COMPETENCIES = [
    "Python",
    "SQL",
    "Data Analysis",
    "Project Management",
    "Communication",
    "Negotiation",
    "Leadership",
    "Product Thinking",
    "Customer Research",
    "Presentation Skills",
    "Time Management",
    "Excel",
    "Budget Planning",
    "Risk Management",
    "Process Design",
]

EMPLOYEES = [
    ("Anna Petrova", "Backend Developer"),
    ("Ivan Smirnov", "Data Analyst"),
    ("Olga Kuznetsova", "HR Specialist"),
    ("Maksim Sokolov", "Project Manager"),
    ("Elena Volkova", "Marketing Manager"),
    ("Dmitry Morozov", "DevOps Engineer"),
    ("Sofia Lebedeva", "Business Analyst"),
    ("Nikita Orlov", "Frontend Developer"),
    ("Maria Romanova", "Operations Manager"),
    ("Pavel Egorov", "QA Engineer"),
]

COURSES = [
    {
        "name": "Advanced SQL for Analytics",
        "description": "Practical SQL for reports, joins and performance tuning.",
        "format": "online",
        "duration_hours": 20,
    },
    {
        "name": "Python for Automation",
        "description": "Automating routine office workflows with Python scripts.",
        "format": "online",
        "duration_hours": 24,
    },
    {
        "name": "Project Management Basics",
        "description": "Foundations of planning, communication and risk handling.",
        "format": "offline",
        "duration_hours": 16,
    },
    {
        "name": "Leadership Essentials",
        "description": "How to lead small teams and run effective 1:1 meetings.",
        "format": "hybrid",
        "duration_hours": 18,
    },
    {
        "name": "Presentation Skills Workshop",
        "description": "Build clear, structured and convincing presentations.",
        "format": "offline",
        "duration_hours": 12,
    },
    {
        "name": "Product Thinking 101",
        "description": "Customer-centric mindset for feature and process decisions.",
        "format": "online",
        "duration_hours": 14,
    },
    {
        "name": "Risk Management for Teams",
        "description": "Identify, assess and mitigate delivery and business risks.",
        "format": "hybrid",
        "duration_hours": 10,
    },
    {
        "name": "Business Communication Intensive",
        "description": "Communication techniques for cross-functional collaboration.",
        "format": "online",
        "duration_hours": 15,
    },
]

GOALS = [
    "Improve delivery quality in current projects.",
    "Prepare for broader team responsibilities.",
    "Strengthen analytical skills for upcoming tasks.",
    "Close skill gaps identified by manager feedback.",
    "Support current team transformation goals.",
]

EXPECTED_RESULTS = [
    "Apply new practices in daily workflow.",
    "Increase speed and quality of task completion.",
    "Share learned practices with the team.",
    "Reduce rework and improve planning confidence.",
    "Take ownership of more complex assignments.",
]

STATUSES = ["new", "approved", "rejected", "in_progress"]


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        directions = [Direction(name=name) for name in DIRECTIONS]
        db.add_all(directions)
        db.flush()

        competency_objects = [Competency(name=name) for name in COMPETENCIES]
        db.add_all(competency_objects)
        db.flush()

        employees = []
        for full_name, position in EMPLOYEES:
            employee = Employee(
                full_name=full_name,
                position=position,
                direction_id=random.choice(directions).id,
            )
            db.add(employee)
            employees.append(employee)
        db.flush()

        for employee in employees:
            for competency in random.sample(competency_objects, random.randint(4, 6)):
                db.add(
                    EmployeeCompetency(
                        employee_id=employee.id,
                        competency_id=competency.id,
                        level=random.randint(1, 5),
                    )
                )

        courses = []
        for course_data in COURSES:
            course = Course(**course_data)
            db.add(course)
            courses.append(course)
        db.flush()

        for course in courses:
            for competency in random.sample(competency_objects, random.randint(3, 5)):
                db.add(
                    CourseCompetency(
                        course_id=course.id,
                        competency_id=competency.id,
                        target_level=random.randint(2, 5),
                    )
                )
        db.flush()

        for _ in range(random.randint(10, 15)):
            employee = random.choice(employees)
            course = random.choice(courses)
            comparison = compare_competencies(db, employee.id, course.id)

            db.add(
                Application(
                    employee_id=employee.id,
                    course_id=course.id,
                    goal_text=random.choice(GOALS),
                    expected_result_text=random.choice(EXPECTED_RESULTS),
                    status=random.choice(STATUSES),
                    similarity_percent=comparison["similarity_percent"],
                    current_skill_matches=comparison["current_skill_matches"],
                    new_skills_count=comparison["new_skills_count"],
                    growth_skills_count=comparison["growth_skills_count"],
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 45)),
                )
            )

        db.commit()
        print("Seed completed successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
