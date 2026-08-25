from __future__ import annotations

import os
import platform
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.domain.entities import AuditEvent, WorkspaceSettings
from app.repositories.protocols import AdminRepository


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class AdminService:
    def __init__(self, repository: AdminRepository, database_path: Path):
        self.repository = repository
        self.database_path = database_path

    def get_workspace(self) -> WorkspaceSettings:
        return self.repository.get_workspace()

    def update_workspace(
        self,
        workspace_name: str | None = None,
        owner_name: str | None = None,
        demo_mode: bool | None = None,
        human_approval_required: bool | None = None,
        onboarding_completed: bool | None = None,
    ) -> WorkspaceSettings:
        current = self.get_workspace()
        return self.repository.save_workspace(
            replace(
                current,
                workspace_name=workspace_name or current.workspace_name,
                owner_name=owner_name or current.owner_name,
                demo_mode=current.demo_mode if demo_mode is None else demo_mode,
                human_approval_required=(
                    current.human_approval_required
                    if human_approval_required is None
                    else human_approval_required
                ),
                onboarding_completed=(
                    current.onboarding_completed
                    if onboarding_completed is None
                    else onboarding_completed
                ),
                updated_at=utc_now(),
            )
        )

    def list_providers(self) -> list[dict]:
        providers: list[dict] = []
        for provider in self.repository.list_providers():
            credential_detected = bool(
                provider.credential_env and os.getenv(provider.credential_env)
            )
            providers.append(
                {
                    "id": provider.id,
                    "category": provider.category,
                    "display_name": provider.display_name,
                    "adapter": provider.adapter,
                    "mode": provider.mode,
                    "credential_env": provider.credential_env,
                    "credential_detected": credential_detected,
                    "description": provider.description,
                    "updated_at": provider.updated_at,
                }
            )
        return providers

    def diagnostics(self) -> dict:
        counts = self.repository.count_records()
        database_exists = self.database_path.exists()
        return {
            "status": "ok" if database_exists else "degraded",
            "version": "0.4.0",
            "runtime": f"Python {platform.python_version()}",
            "storage": "SQLite",
            "database_ready": database_exists,
            "database_size_bytes": (
                self.database_path.stat().st_size if database_exists else 0
            ),
            "counts": counts,
            "checked_at": utc_now(),
        }

    def record_http_mutation(
        self, method: str, path: str, status_code: int, query: str
    ) -> AuditEvent:
        segments = [segment for segment in path.split("/") if segment]
        resource = segments[2] if len(segments) > 2 else "system"
        resource_id = segments[3] if len(segments) > 3 else ""
        event = AuditEvent(
            id=f"audit_{uuid4().hex[:12]}",
            action=method.lower(),
            resource=resource,
            resource_id=resource_id,
            summary=f"{method.upper()} {path}",
            detail={"status_code": status_code, "query": query[:300]},
            created_at=utc_now(),
        )
        return self.repository.create_audit_event(event)

    def list_audit_events(self, limit: int = 100) -> list[AuditEvent]:
        return self.repository.list_audit_events(limit)

    def export_backup(self) -> dict:
        exported_at = utc_now()
        return {
            "schema_version": 1,
            "product": "superstaff",
            "exported_at": exported_at,
            "workspace": self.get_workspace().workspace_name,
            "data": self.repository.export_records(),
        }
