from pydantic import BaseModel, Field


class ApplicationCreate(BaseModel):
    employee_id: int
    course_id: int
    goal_text: str = Field(min_length=3)
    expected_result_text: str = Field(min_length=3)
