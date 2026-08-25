from typing import Literal

from pydantic import BaseModel, ConfigDict


class TaskCenterStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order: int
    name: str
    status: Literal["pending", "running", "done", "failed"]
    output: str


class TaskCenterItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_type: Literal["agent_job", "workflow_run"]
    definition_id: str
    title: str
    description: str
    owner: str
    status: Literal["draft", "running", "review", "done", "failed"]
    steps: list[TaskCenterStepRead]
    output: str
    asset_ids: list[str]
    created_at: str
    updated_at: str
