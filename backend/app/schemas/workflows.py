from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class WorkflowStepCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=60)
    instruction: str = Field(min_length=5, max_length=1000)


class WorkflowCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=2, max_length=240)
    icon: str = Field(default="流", min_length=1, max_length=8)
    color: str = Field(default="#6c5ce7", pattern=r"^#[0-9a-fA-F]{6}$")
    steps: list[WorkflowStepCreate] = Field(min_length=1, max_length=8)


class WorkflowStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order: int
    name: str
    instruction: str


class WorkflowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    icon: str
    color: str
    status: str
    steps: list[WorkflowStepRead]
    run_count: int
    created_at: str
    updated_at: str


class WorkflowRunCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    input: str = Field(min_length=2, max_length=4000)


class WorkflowRunStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order: int
    name: str
    status: Literal["pending", "running", "done", "failed"]
    output: str


class WorkflowRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    workflow_name: str
    input: str
    status: Literal["running", "done", "failed"]
    steps: list[WorkflowRunStepRead]
    output: str
    created_at: str
    completed_at: str | None
