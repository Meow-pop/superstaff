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
