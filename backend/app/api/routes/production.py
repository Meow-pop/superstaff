from typing import Annotated, Literal

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_container
from app.container import Container
from app.schemas.production import (
    ProductionBriefUpdate,
    ProductionJobRead,
    ProductionSceneUpdate,
    PublishScheduleCreate,
    SocialAccountCreate,
    SocialAccountRead,
    SocialAccountUpdate,
)
from app.domain.entities import ProductionBrief, ProductionScene


router = APIRouter(tags=["production"])


@router.get("/production-jobs", response_model=list[ProductionJobRead])
def list_production_jobs(
    container: Annotated[Container, Depends(get_container)],
    target: Literal["creative_video", "storyboard", "publisher"] | None = None,
    job_status: Literal[
        "queued", "running", "review", "ready", "done", "failed"
    ]
    | None = None,
):
    return container.production_service.list_jobs(target, job_status)


@router.get("/production-jobs/{job_id}", response_model=ProductionJobRead)
def get_production_job(
    job_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    return container.production_service.get_job(job_id)


@router.post("/production-jobs/{job_id}/run", response_model=ProductionJobRead)
def run_production_job(
    job_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    return container.production_service.run_job(job_id)


@router.patch("/production-jobs/{job_id}/brief", response_model=ProductionJobRead)
def update_production_brief(
    job_id: str,
    payload: ProductionBriefUpdate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.production_service.update_brief(
        job_id, ProductionBrief(**payload.model_dump())
    )


@router.patch(
    "/production-jobs/{job_id}/scenes/{scene_order}",
    response_model=ProductionJobRead,
)
def update_production_scene(
    job_id: str,
    scene_order: int,
    payload: ProductionSceneUpdate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.production_service.update_scene(
        job_id,
        scene_order,
        ProductionScene(order=scene_order, **payload.model_dump()),
    )


@router.post("/production-jobs/{job_id}/approve", response_model=ProductionJobRead)
def approve_production_job(
    job_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    return container.production_service.approve_job(job_id)


@router.post("/production-jobs/{job_id}/schedule", response_model=ProductionJobRead)
def schedule_publish_job(
    job_id: str,
    payload: PublishScheduleCreate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.production_service.schedule_publish(
        job_id, payload.account_id, payload.scheduled_at.isoformat()
    )


@router.get("/accounts", response_model=list[SocialAccountRead])
def list_accounts(container: Annotated[Container, Depends(get_container)]):
    return container.production_service.list_accounts()


@router.post(
    "/accounts", response_model=SocialAccountRead, status_code=status.HTTP_201_CREATED
)
def create_account(
    payload: SocialAccountCreate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.production_service.create_account(
        payload.platform, payload.display_name, payload.handle
    )


@router.patch("/accounts/{account_id}", response_model=SocialAccountRead)
def update_account(
    account_id: str,
    payload: SocialAccountUpdate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.production_service.update_account_status(account_id, payload.status)
