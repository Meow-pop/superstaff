from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.dependencies import get_container
from app.container import Container
from app.schemas.workflows import (
    WorkflowCreate,
    WorkflowRead,
    WorkflowRunCreate,
    WorkflowRunRead,
)


router = APIRouter(tags=["workflows"])


@router.get("/workflows", response_model=list[WorkflowRead])
def list_workflows(container: Annotated[Container, Depends(get_container)]):
    return container.workflow_service.list_workflows()


@router.post(
    "/workflows", response_model=WorkflowRead, status_code=status.HTTP_201_CREATED
)
def create_workflow(
    payload: WorkflowCreate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.workflow_service.create_workflow(
        name=payload.name,
        description=payload.description,
        icon=payload.icon,
        color=payload.color,
        steps=[(step.name, step.instruction) for step in payload.steps],
    )


@router.get("/workflows/{workflow_id}", response_model=WorkflowRead)
def get_workflow(
    workflow_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    return container.workflow_service.get_workflow(workflow_id)


@router.delete("/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    container.workflow_service.delete_workflow(workflow_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/workflows/{workflow_id}/runs", response_model=WorkflowRunRead)
def run_workflow(
    workflow_id: str,
    payload: WorkflowRunCreate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.workflow_service.run_workflow(workflow_id, payload.input)


@router.get("/workflow-runs", response_model=list[WorkflowRunRead])
def list_workflow_runs(
    container: Annotated[Container, Depends(get_container)],
    workflow_id: Annotated[str | None, Query()] = None,
):
    return container.workflow_service.list_runs(workflow_id)


@router.get("/workflow-runs/{run_id}", response_model=WorkflowRunRead)
def get_workflow_run(
    run_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    return container.workflow_service.get_run(run_id)
