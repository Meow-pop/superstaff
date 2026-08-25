from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.domain.entities import Asset, AssetStatus, Job, JobStatus, StepStatus
from app.domain.errors import (
    EmployeeUnavailableError,
    ExecutionError,
    InvalidTransitionError,
    NotFoundError,
)
from app.executors.base import EmployeeExecutor
from app.repositories.protocols import AssetRepository, EmployeeRepository, JobRepository


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class JobService:
    def __init__(
        self,
        employee_repository: EmployeeRepository,
        job_repository: JobRepository,
        asset_repository: AssetRepository,
        executor: EmployeeExecutor,
    ):
        self.employees = employee_repository
        self.jobs = job_repository
        self.assets = asset_repository
        self.executor = executor

    def list_jobs(self) -> list[Job]:
        return self.jobs.list()

    def get_job(self, job_id: str) -> Job:
        job = self.jobs.get(job_id)
        if not job:
            raise NotFoundError(f"任务不存在：{job_id}")
        return job

    def create_job(self, employee_id: str, title: str, goal: str) -> Job:
        employee = self.employees.get(employee_id)
        if not employee:
            raise NotFoundError(f"AI 员工不存在：{employee_id}")
        if employee.status != "ready":
            raise EmployeeUnavailableError(f"{employee.name} 仍在准备中，暂时不能接任务")

        now = utc_now()
        job = Job(
            id=f"job_{uuid4().hex[:10]}",
            employee_id=employee.id,
            employee_name=employee.name,
            title=title,
            goal=goal,
            status=JobStatus.DRAFT,
            steps=self.executor.plan(employee, goal),
            created_at=now,
            updated_at=now,
        )
        return self.jobs.create(job)

    def run_job(self, job_id: str) -> Job:
        job = self.get_job(job_id)
        if job.status not in {JobStatus.DRAFT, JobStatus.FAILED}:
            raise InvalidTransitionError(
                f"任务处于 {job.status.value}，不能开始执行"
            )
        employee = self.employees.get(job.employee_id)
        if not employee:
            raise NotFoundError(f"AI 员工不存在：{job.employee_id}")

        job.status = JobStatus.RUNNING
        job.updated_at = utc_now()
        self.jobs.save(job)
        try:
            for step in job.steps:
                step.status = StepStatus.RUNNING
                job.updated_at = utc_now()
                self.jobs.save(job)
                step.output = self.executor.execute_step(employee, job, step)
                step.status = StepStatus.DONE
                job.updated_at = utc_now()
                self.jobs.save(job)

            artifact = self.executor.compose_artifact(employee, job)
            self.jobs.add_artifact(artifact)
            self.assets.create(
                Asset(
                    id=f"asset_{uuid4().hex[:10]}",
                    source_type="agent_job",
                    source_id=job.id,
                    source_name=f"{employee.name} · {employee.role}",
                    kind=artifact.kind,
                    title=artifact.title,
                    content=artifact.content,
                    tags=["AI员工", employee.name, "待复用"],
                    status=AssetStatus.ACTIVE,
                    created_at=artifact.created_at,
                    updated_at=artifact.created_at,
                )
            )
            job.status = JobStatus.REVIEW
            job.result_summary = "首版成果已生成，等待人工检查和验收。"
            job.updated_at = utc_now()
            self.jobs.save(job)
            return self.get_job(job.id)
        except Exception as exc:
            for step in job.steps:
                if step.status == StepStatus.RUNNING:
                    step.status = StepStatus.FAILED
            job.status = JobStatus.FAILED
            job.result_summary = "执行失败，可以重试。"
            job.updated_at = utc_now()
            self.jobs.save(job)
            raise ExecutionError("AI 员工执行失败") from exc

    def approve_job(self, job_id: str) -> Job:
        job = self.get_job(job_id)
        if job.status != JobStatus.REVIEW:
            raise InvalidTransitionError(
                f"任务处于 {job.status.value}，只有待验收任务可以通过"
            )
        job.status = JobStatus.DONE
        job.result_summary = "成果已通过人工验收。"
        job.updated_at = utc_now()
        self.jobs.save(job)
        return self.get_job(job.id)
