from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class WorkspaceSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_name: str
    owner_name: str
    demo_mode: bool
    human_approval_required: bool
    onboarding_completed: bool
    created_at: str
    updated_at: str


class WorkspaceSettingsUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    workspace_name: str | None = Field(default=None, min_length=2, max_length=80)
    owner_name: str | None = Field(default=None, min_length=2, max_length=40)
    demo_mode: bool | None = None
    human_approval_required: bool | None = None
    onboarding_completed: bool | None = None


class ProviderConfigRead(BaseModel):
    id: str
    category: Literal["language", "image", "voice", "video", "publishing"]
    display_name: str
    adapter: str
    mode: Literal["active", "demo", "waiting"]
    credential_env: str
    credential_detected: bool
    description: str
    updated_at: str


class AuditEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    action: str
    resource: str
    resource_id: str
    summary: str
    detail: dict[str, str | int | bool]
    created_at: str


class DiagnosticRead(BaseModel):
    status: Literal["ok", "degraded"]
    version: str
    runtime: str
    storage: str
    database_ready: bool
    database_size_bytes: int
    counts: dict[str, int]
    checked_at: str


class LocalModelStatusRead(BaseModel):
    mode: Literal["demo", "ollama"]
    reachable: bool
    model_ready: bool
    configured_model: str
    installed_models: list[str]
    base_url: str
    detail: str
