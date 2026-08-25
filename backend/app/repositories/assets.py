from __future__ import annotations

import json

from app.domain.entities import Asset, AssetHandoff, AssetStatus, HandoffStatus
from app.infrastructure.database import SQLiteDatabase


class SQLiteAssetRepository:
    def __init__(self, database: SQLiteDatabase):
        self.database = database

    def list(
        self,
        query: str | None = None,
        source_type: str | None = None,
        kind: str | None = None,
        status: str | None = None,
    ) -> list[Asset]:
        clauses: list[str] = []
        params: list[str] = []
        if query:
            clauses.append("(title LIKE ? OR content LIKE ? OR source_name LIKE ?)")
            pattern = f"%{query}%"
            params.extend([pattern, pattern, pattern])
        if source_type:
            clauses.append("source_type = ?")
            params.append(source_type)
        if kind:
            clauses.append("kind = ?")
            params.append(kind)
        if status:
            clauses.append("status = ?")
            params.append(status)

        sql = "SELECT * FROM assets"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY created_at DESC"
        with self.database.connect() as connection:
            rows = connection.execute(sql, tuple(params)).fetchall()
        return [self._asset_from_row(row) for row in rows]

    def get(self, asset_id: str) -> Asset | None:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM assets WHERE id = ?", (asset_id,)
            ).fetchone()
        return self._asset_from_row(row) if row else None

    def find_by_source(self, source_type: str, source_id: str) -> list[Asset]:
        with self.database.connect() as connection:
            rows = connection.execute(
                """
                SELECT * FROM assets
                WHERE source_type = ? AND source_id = ?
                ORDER BY created_at DESC
                """,
                (source_type, source_id),
            ).fetchall()
        return [self._asset_from_row(row) for row in rows]

    def create(self, asset: Asset) -> Asset:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT OR IGNORE INTO assets
                (id, source_type, source_id, source_name, kind, title, content,
                 tags_json, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                self._asset_values(asset),
            )
            row = connection.execute(
                """
                SELECT * FROM assets
                WHERE source_type = ? AND source_id = ? AND kind = ?
                """,
                (asset.source_type, asset.source_id, asset.kind),
            ).fetchone()
        return self._asset_from_row(row)

    def save(self, asset: Asset) -> Asset:
        with self.database.connect() as connection:
            connection.execute(
                """
                UPDATE assets
                SET source_name = ?, kind = ?, title = ?, content = ?,
                    tags_json = ?, status = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    asset.source_name,
                    asset.kind,
                    asset.title,
                    asset.content,
                    json.dumps(asset.tags, ensure_ascii=False),
                    asset.status.value,
                    asset.updated_at,
                    asset.id,
                ),
            )
        return asset

    def list_handoffs(self, asset_id: str | None = None) -> list[AssetHandoff]:
        sql = "SELECT * FROM asset_handoffs"
        params: tuple[str, ...] = ()
        if asset_id:
            sql += " WHERE asset_id = ?"
            params = (asset_id,)
        sql += " ORDER BY created_at DESC"
        with self.database.connect() as connection:
            rows = connection.execute(sql, params).fetchall()
        return [self._handoff_from_row(row) for row in rows]

    def create_handoff(self, handoff: AssetHandoff) -> AssetHandoff:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO asset_handoffs
                (id, asset_id, asset_title, target, status, note, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    handoff.id,
                    handoff.asset_id,
                    handoff.asset_title,
                    handoff.target,
                    handoff.status.value,
                    handoff.note,
                    handoff.created_at,
                ),
            )
        return handoff

    @staticmethod
    def _asset_values(asset: Asset) -> tuple:
        return (
            asset.id,
            asset.source_type,
            asset.source_id,
            asset.source_name,
            asset.kind,
            asset.title,
            asset.content,
            json.dumps(asset.tags, ensure_ascii=False),
            asset.status.value,
            asset.created_at,
            asset.updated_at,
        )

    @staticmethod
    def _asset_from_row(row) -> Asset:
        return Asset(
            id=row["id"],
            source_type=row["source_type"],
            source_id=row["source_id"],
            source_name=row["source_name"],
            kind=row["kind"],
            title=row["title"],
            content=row["content"],
            tags=json.loads(row["tags_json"]),
            status=AssetStatus(row["status"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _handoff_from_row(row) -> AssetHandoff:
        return AssetHandoff(
            id=row["id"],
            asset_id=row["asset_id"],
            asset_title=row["asset_title"],
            target=row["target"],
            status=HandoffStatus(row["status"]),
            note=row["note"],
            created_at=row["created_at"],
        )
