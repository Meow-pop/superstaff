from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ProductionSceneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order: int
    title: str
    visual: str
    narration: str
    duration_seconds: int


class ProductionJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    handoff_id: str
    asset_id: str
    title: str
    target: Literal["creative_video", "storyboard", "publisher"]
    status: Literal["queued", "running", "review", "ready", "done", "failed"]
    script: str
    scenes: list[ProductionSceneRead]
    output: str
    account_id: str | None
    account_name: str
    scheduled_at: str | None
    created_at: str
    updated_at: str


class PublishScheduleCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    account_id: str = Field(min_length=1, max_length=80)
    scheduled_at: datetime


class SocialAccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    platform: Literal["抖音", "小红书", "视频号", "快手", "B站"]
    display_name: str
    handle: str
    status: Literal["demo", "connected", "disabled"]
    follower_count: int
    created_at: str
    updated_at: str


class SocialAccountCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    platform: Literal["抖音", "小红书", "视频号", "快手", "B站"]
    display_name: str = Field(min_length=2, max_length=80)
    handle: str = Field(min_length=2, max_length=80)


class SocialAccountUpdate(BaseModel):
    status: Literal["demo", "connected", "disabled"]
