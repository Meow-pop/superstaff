from __future__ import annotations

import json

from app.domain.entities import AuditEvent, ProviderConfig, WorkspaceSettings
from app.infrastructure.database import SQLiteDatabase


BACKUP_TABLES = (
    "employees",
    "jobs",
    "artifacts",
    "workflows",
    "workflow_runs",
    "assets",
    "asset_handoffs",
    "production_jobs",
    "social_accounts",
    "workspace_settings",
    "provider_configs",
    "audit_events",
)


class SQLiteAdminRepository:
    def __init__(self, database: SQLiteDatabase):
        self.database = database

    def get_workspace(self) -> WorkspaceSettings:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM workspace_settings WHERE id = 'default'"
            ).fetchone()
        if row is None:
            raise RuntimeError("默认工作区未初始化")
        return self._workspace_from_row(row)

    def save_workspace(self, settings: WorkspaceSettings) -> WorkspaceSettings:
        with self.database.connect() as connection:
            connection.execute(
                """
                UPDATE workspace_settings
                SET workspace_name = ?, owner_name = ?, demo_mode = ?,
                    human_approval_required = ?, onboarding_completed = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    settings.workspace_name,
                    settings.owner_name,
                    int(settings.demo_mode),
                    int(settings.human_approval_required),
                    int(settings.onboarding_completed),
                    settings.updated_at,
                    settings.id,
                ),
            )
        return settings

    def seed_providers(self, providers: list[ProviderConfig]) -> None:
        with self.database.connect() as connection:
            connection.executemany(
                """
                INSERT OR IGNORE INTO provider_configs
                (id, category, display_name, adapter, mode, credential_env,
                 description, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        item.id,
                        item.category,
                        item.display_name,
                        item.adapter,
                        item.mode,
                        item.credential_env,
                        item.description,
                        item.updated_at,
                    )
                    for item in providers
                ],
            )

    def list_providers(self) -> list[ProviderConfig]:
        with self.database.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM provider_configs ORDER BY category, id"
            ).fetchall()
        return [
            ProviderConfig(
                id=row["id"],
                category=row["category"],
                display_name=row["display_name"],
                adapter=row["adapter"],
                mode=row["mode"],
                credential_env=row["credential_env"],
                description=row["description"],
                updated_at=row["updated_at"],
            )
            for row in rows
        ]

    def create_audit_event(self, event: AuditEvent) -> AuditEvent:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO audit_events
                (id, action, resource, resource_id, summary, detail_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event.id,
                    event.action,
                    event.resource,
                    event.resource_id,
                    event.summary,
                    json.dumps(event.detail, ensure_ascii=False),
                    event.created_at,
                ),
            )
        return event

    def list_audit_events(self, limit: int = 100) -> list[AuditEvent]:
        with self.database.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [
            AuditEvent(
                id=row["id"],
                action=row["action"],
                resource=row["resource"],
                resource_id=row["resource_id"],
                summary=row["summary"],
                detail=json.loads(row["detail_json"]),
                created_at=row["created_at"],
            )
            for row in rows
        ]

    def count_records(self) -> dict[str, int]:
        with self.database.connect() as connection:
            return {
                table: int(
                    connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
                )
                for table in BACKUP_TABLES
            }

    def export_records(self) -> dict[str, list[dict]]:
        with self.database.connect() as connection:
            return {
                table: [dict(row) for row in connection.execute(f'SELECT * FROM "{table}"')]
                for table in BACKUP_TABLES
            }

    @staticmethod
    def _workspace_from_row(row) -> WorkspaceSettings:
        return WorkspaceSettings(
            id=row["id"],
            workspace_name=row["workspace_name"],
            owner_name=row["owner_name"],
            demo_mode=bool(row["demo_mode"]),
            human_approval_required=bool(row["human_approval_required"]),
            onboarding_completed=bool(row["onboarding_completed"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
