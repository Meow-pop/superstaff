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
    shot_type: str
    camera_motion: str
    transition: str


class ProductionBriefRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    audience: str
    objective: str
    aspect_ratio: Literal["9:16", "16:9", "1:1"]
    visual_style: Literal["editorial", "minimal", "technology"]
    pace: Literal["calm", "balanced", "fast"]
    brand_name: str
    primary_color: str
    accent_color: str
    call_to_action: str
    ai_label: bool


class ProductionBriefUpdate(ProductionBriefRead):
    model_config = ConfigDict(str_strip_whitespace=True)

    audience: str = Field(min_length=2, max_length=160)
    objective: str = Field(min_length=2, max_length=200)
    brand_name: str = Field(min_length=1, max_length=80)
    primary_color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    accent_color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    call_to_action: str = Field(min_length=2, max_length=160)


class ProductionSceneUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=80)
    visual: str = Field(min_length=2, max_length=300)
    narration: str = Field(min_length=2, max_length=500)
    duration_seconds: int = Field(ge=2, le=20)
    shot_type: Literal["特写", "中景", "全景", "信息图", "产品镜头"]
    camera_motion: Literal["静止", "快速推进", "缓慢横移", "分层上浮", "轻推定格"]
    transition: Literal["硬切", "闪白切入", "遮罩滑动", "叠化", "淡出"]


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
    brief: ProductionBriefRead
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
