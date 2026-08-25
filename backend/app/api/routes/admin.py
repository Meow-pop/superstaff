import json
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.api.dependencies import get_container
from app.container import Container
from app.schemas.admin import (
    AuditEventRead,
    DiagnosticRead,
    ProviderConfigRead,
    WorkspaceSettingsRead,
    WorkspaceSettingsUpdate,
)


router = APIRouter(tags=["administration"])


@router.get("/workspace", response_model=WorkspaceSettingsRead)
def get_workspace(container: Annotated[Container, Depends(get_container)]):
    return container.admin_service.get_workspace()


@router.patch("/workspace", response_model=WorkspaceSettingsRead)
def update_workspace(
    payload: WorkspaceSettingsUpdate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.admin_service.update_workspace(**payload.model_dump())


@router.get("/admin/providers", response_model=list[ProviderConfigRead])
def list_providers(container: Annotated[Container, Depends(get_container)]):
    return container.admin_service.list_providers()


@router.get("/admin/audit-events", response_model=list[AuditEventRead])
def list_audit_events(
    container: Annotated[Container, Depends(get_container)],
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
):
    return container.admin_service.list_audit_events(limit)


@router.get("/admin/diagnostics", response_model=DiagnosticRead)
def get_diagnostics(container: Annotated[Container, Depends(get_container)]):
    return container.admin_service.diagnostics()


@router.get("/admin/backups/export")
def export_backup(container: Annotated[Container, Depends(get_container)]):
    backup = container.admin_service.export_backup()
    filename = f"superstaff-backup-{backup['exported_at'][:10]}.json"
    return Response(
        content=json.dumps(backup, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
