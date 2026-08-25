from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone
from uuid import uuid4

from app.domain.entities import Asset, AssetHandoff, AssetStatus, HandoffStatus
from app.domain.errors import InvalidTransitionError, NotFoundError
from app.repositories.protocols import AssetRepository
from app.services.production import ProductionService


ALLOWED_HANDOFF_TARGETS = {"creative_video", "storyboard", "publisher"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class AssetService:
    def __init__(
        self, repository: AssetRepository, production: ProductionService
    ):
        self.repository = repository
        self.production = production

    def list_assets(
        self,
        query: str | None = None,
        source_type: str | None = None,
        kind: str | None = None,
        status: str | None = None,
    ) -> list[Asset]:
        return self.repository.list(query, source_type, kind, status)

    def get_asset(self, asset_id: str) -> Asset:
        asset = self.repository.get(asset_id)
        if not asset:
            raise NotFoundError(f"成果资产不存在：{asset_id}")
        return asset

    def update_asset(
        self,
        asset_id: str,
        title: str | None = None,
        tags: list[str] | None = None,
        status: AssetStatus | None = None,
    ) -> Asset:
        asset = self.get_asset(asset_id)
        normalized_tags = list(dict.fromkeys(tag.strip() for tag in (tags or []) if tag.strip()))
        updated = replace(
            asset,
            title=title if title is not None else asset.title,
            tags=normalized_tags if tags is not None else asset.tags,
            status=status if status is not None else asset.status,
            updated_at=utc_now(),
        )
        return self.repository.save(updated)

    def list_handoffs(self, asset_id: str | None = None) -> list[AssetHandoff]:
        if asset_id:
            self.get_asset(asset_id)
        return self.repository.list_handoffs(asset_id)

    def create_handoff(self, asset_id: str, target: str, note: str) -> AssetHandoff:
        asset = self.get_asset(asset_id)
        if asset.status == AssetStatus.ARCHIVED:
            raise InvalidTransitionError("已归档成果需要先恢复，才能创建流转任务")
        if target not in ALLOWED_HANDOFF_TARGETS:
            raise ValueError(f"不支持的流转目标：{target}")
        handoff = AssetHandoff(
            id=f"handoff_{uuid4().hex[:10]}",
            asset_id=asset.id,
            asset_title=asset.title,
            target=target,
            status=HandoffStatus.QUEUED,
            note=note,
            created_at=utc_now(),
        )
        created = self.repository.create_handoff(handoff)
        self.production.create_from_handoff(created, asset)
        return created
