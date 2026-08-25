from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_type: Literal["agent_job", "workflow_run", "manual"]
    source_id: str
    source_name: str
    kind: str
    title: str
    content: str
    tags: list[str]
    status: Literal["active", "archived"]
    created_at: str
    updated_at: str


class AssetUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=2, max_length=120)
    tags: list[str] | None = Field(default=None, max_length=12)
    status: Literal["active", "archived"] | None = None


class HandoffCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    target: Literal["creative_video", "storyboard", "publisher"]
    note: str = Field(default="", max_length=500)


class HandoffRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_id: str
    asset_title: str
    target: Literal["creative_video", "storyboard", "publisher"]
    status: Literal["queued", "processing", "done", "failed"]
    note: str
    created_at: str
