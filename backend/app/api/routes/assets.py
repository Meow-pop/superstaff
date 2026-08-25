from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import get_container
from app.container import Container
from app.domain.entities import AssetStatus
from app.schemas.assets import AssetRead, AssetUpdate, HandoffCreate, HandoffRead


router = APIRouter(tags=["assets"])


@router.get("/assets", response_model=list[AssetRead])
def list_assets(
    container: Annotated[Container, Depends(get_container)],
    query: Annotated[str | None, Query(max_length=120)] = None,
    source_type: Literal["agent_job", "workflow_run", "manual"] | None = None,
    kind: Annotated[str | None, Query(max_length=60)] = None,
    asset_status: Literal["active", "archived"] | None = None,
):
    return container.asset_service.list_assets(
        query=query,
        source_type=source_type,
        kind=kind,
        status=asset_status,
    )


@router.get("/assets/{asset_id}", response_model=AssetRead)
def get_asset(
    asset_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    return container.asset_service.get_asset(asset_id)


@router.patch("/assets/{asset_id}", response_model=AssetRead)
def update_asset(
    asset_id: str,
    payload: AssetUpdate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.asset_service.update_asset(
        asset_id=asset_id,
        title=payload.title,
        tags=payload.tags,
        status=AssetStatus(payload.status) if payload.status else None,
    )


@router.get("/asset-handoffs", response_model=list[HandoffRead])
def list_handoffs(
    container: Annotated[Container, Depends(get_container)],
    asset_id: str | None = None,
):
    return container.asset_service.list_handoffs(asset_id)


@router.post(
    "/assets/{asset_id}/handoffs",
    response_model=HandoffRead,
    status_code=status.HTTP_201_CREATED,
)
def create_handoff(
    asset_id: str,
    payload: HandoffCreate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.asset_service.create_handoff(asset_id, payload.target, payload.note)
