from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db import Base


class Direction(Base):
    __tablename__ = "directions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    employees = relationship("Employee", back_populates="direction")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    direction_id = Column(Integer, ForeignKey("directions.id"), nullable=False)
    position = Column(String(120), nullable=False)

    direction = relationship("Direction", back_populates="employees")
    competencies = relationship(
        "EmployeeCompetency",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    applications = relationship("Application", back_populates="employee")


class Competency(Base):
    __tablename__ = "competencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)


class EmployeeCompetency(Base):
    __tablename__ = "employee_competencies"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    level = Column(Integer, nullable=False)

    employee = relationship("Employee", back_populates="competencies")
    competency = relationship("Competency")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    format = Column(String(80), nullable=False)
    duration_hours = Column(Integer, nullable=False)

    competencies = relationship(
        "CourseCompetency",
        back_populates="course",
        cascade="all, delete-orphan",
    )
    applications = relationship("Application", back_populates="course")


class CourseCompetency(Base):
    __tablename__ = "course_competencies"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    target_level = Column(Integer, nullable=False)

    course = relationship("Course", back_populates="competencies")
    competency = relationship("Competency")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    goal_text = Column(Text, nullable=False)
    expected_result_text = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="new")
    similarity_percent = Column(Integer, nullable=False)
    current_skill_matches = Column(Integer, nullable=False)
    new_skills_count = Column(Integer, nullable=False)
    growth_skills_count = Column(Integer, nullable=False)
    comparison_snapshot_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("Employee", back_populates="applications")
    course = relationship("Course", back_populates="applications")
