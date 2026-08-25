from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class JobStatus(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    REVIEW = "review"
    DONE = "done"
    FAILED = "failed"


class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class WorkflowRunStatus(str, Enum):
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class AssetStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class HandoffStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class ProductionStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    REVIEW = "review"
    READY = "ready"
    DONE = "done"
    FAILED = "failed"


@dataclass(frozen=True, slots=True)
class Employee:
    id: str
    name: str
    role: str
    mission: str
    avatar: str
    skills: list[str]
    status: str
    created_at: str


@dataclass(slots=True)
class JobStep:
    id: str
    order: int
    title: str
    instruction: str
    status: StepStatus = StepStatus.PENDING
    output: str = ""


@dataclass(frozen=True, slots=True)
class Artifact:
    id: str
    job_id: str
    kind: str
    title: str
    content: str
    created_at: str


@dataclass(slots=True)
class Job:
    id: str
    employee_id: str
    employee_name: str
    title: str
    goal: str
    status: JobStatus
    steps: list[JobStep]
    created_at: str
    updated_at: str
    result_summary: str = ""
    artifacts: list[Artifact] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class WorkflowStep:
    id: str
    order: int
    name: str
    instruction: str


@dataclass(frozen=True, slots=True)
class Workflow:
    id: str
    name: str
    description: str
    icon: str
    color: str
    status: str
    steps: list[WorkflowStep]
    run_count: int
    created_at: str
    updated_at: str


@dataclass(frozen=True, slots=True)
class WorkflowRunStep:
    id: str
    order: int
    name: str
    status: StepStatus
    output: str


@dataclass(frozen=True, slots=True)
class WorkflowRun:
    id: str
    workflow_id: str
    workflow_name: str
    input: str
    status: WorkflowRunStatus
    steps: list[WorkflowRunStep]
    output: str
    created_at: str
    completed_at: str | None


@dataclass(frozen=True, slots=True)
class Asset:
    id: str
    source_type: str
    source_id: str
    source_name: str
    kind: str
    title: str
    content: str
    tags: list[str]
    status: AssetStatus
    created_at: str
    updated_at: str


@dataclass(frozen=True, slots=True)
class AssetHandoff:
    id: str
    asset_id: str
    asset_title: str
    target: str
    status: HandoffStatus
    note: str
    created_at: str


@dataclass(frozen=True, slots=True)
class TaskCenterStep:
    order: int
    name: str
    status: StepStatus
    output: str


@dataclass(frozen=True, slots=True)
class TaskCenterItem:
    id: str
    source_type: str
    definition_id: str
    title: str
    description: str
    owner: str
    status: str
    steps: list[TaskCenterStep]
    output: str
    asset_ids: list[str]
    created_at: str
    updated_at: str


@dataclass(frozen=True, slots=True)
class ProductionBrief:
    audience: str
    objective: str
    aspect_ratio: str
    visual_style: str
    pace: str
    brand_name: str
    primary_color: str
    accent_color: str
    call_to_action: str
    ai_label: bool


@dataclass(frozen=True, slots=True)
class ProductionScene:
    order: int
    title: str
    visual: str
    narration: str
    duration_seconds: int
    shot_type: str
    camera_motion: str
    transition: str


@dataclass(frozen=True, slots=True)
class ProductionJob:
    id: str
    handoff_id: str
    asset_id: str
    title: str
    target: str
    status: ProductionStatus
    script: str
    scenes: list[ProductionScene]
    brief: ProductionBrief
    output: str
    account_id: str | None
    account_name: str
    scheduled_at: str | None
    created_at: str
    updated_at: str


@dataclass(frozen=True, slots=True)
class SocialAccount:
    id: str
    platform: str
    display_name: str
    handle: str
    status: str
    follower_count: int
    created_at: str
    updated_at: str


@dataclass(frozen=True, slots=True)
class WorkspaceSettings:
    id: str
    workspace_name: str
    owner_name: str
    demo_mode: bool
    human_approval_required: bool
    onboarding_completed: bool
    created_at: str
    updated_at: str


@dataclass(frozen=True, slots=True)
class ProviderConfig:
    id: str
    category: str
    display_name: str
    adapter: str
    mode: str
    credential_env: str
    description: str
    updated_at: str


@dataclass(frozen=True, slots=True)
class AuditEvent:
    id: str
    action: str
    resource: str
    resource_id: str
    summary: str
    detail: dict[str, str | int | bool]
    created_at: str
