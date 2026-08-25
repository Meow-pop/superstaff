from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    employee_id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=2, max_length=100)
    goal: str = Field(min_length=8, max_length=4000)


class JobStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order: int
    title: str
    instruction: str
    status: Literal["pending", "running", "done", "failed"]
    output: str


class ArtifactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    kind: str
    title: str
    content: str
    created_at: str


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_id: str
    employee_name: str
    title: str
    goal: str
    status: Literal["draft", "running", "review", "done", "failed"]
    steps: list[JobStepRead]
    created_at: str
    updated_at: str
    result_summary: str
    artifacts: list[ArtifactRead]
