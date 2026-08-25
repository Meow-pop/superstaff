from typing import Annotated, Literal

from fastapi import APIRouter, Depends

from app.api.dependencies import get_container
from app.container import Container
from app.schemas.tasks import TaskCenterItemRead


router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskCenterItemRead])
def list_tasks(
    container: Annotated[Container, Depends(get_container)],
    source_type: Literal["agent_job", "workflow_run"] | None = None,
    task_status: Literal["draft", "running", "review", "done", "failed"] | None = None,
):
    return container.task_center_service.list_tasks(source_type, task_status)
