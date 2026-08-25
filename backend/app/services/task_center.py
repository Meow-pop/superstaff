from __future__ import annotations

from app.domain.entities import TaskCenterItem, TaskCenterStep
from app.repositories.protocols import AssetRepository, JobRepository, WorkflowRepository


class TaskCenterService:
    def __init__(
        self,
        jobs: JobRepository,
        workflows: WorkflowRepository,
        assets: AssetRepository,
    ):
        self.jobs = jobs
        self.workflows = workflows
        self.assets = assets

    def list_tasks(
        self, source_type: str | None = None, status: str | None = None
    ) -> list[TaskCenterItem]:
        items: list[TaskCenterItem] = []
        if source_type in {None, "agent_job"}:
            items.extend(self._job_item(job) for job in self.jobs.list())
        if source_type in {None, "workflow_run"}:
            items.extend(self._workflow_item(run) for run in self.workflows.list_runs())
        if status:
            items = [item for item in items if item.status == status]
        return sorted(items, key=lambda item: item.updated_at, reverse=True)

    def _job_item(self, job) -> TaskCenterItem:
        assets = self.assets.find_by_source("agent_job", job.id)
        output = job.artifacts[0].content if job.artifacts else ""
        return TaskCenterItem(
            id=job.id,
            source_type="agent_job",
            definition_id=job.employee_id,
            title=job.title,
            description=job.goal,
            owner=job.employee_name,
            status=job.status.value,
            steps=[
                TaskCenterStep(
                    order=step.order,
                    name=step.title,
                    status=step.status,
                    output=step.output,
                )
                for step in job.steps
            ],
            output=output,
            asset_ids=[asset.id for asset in assets],
            created_at=job.created_at,
            updated_at=job.updated_at,
        )

    def _workflow_item(self, run) -> TaskCenterItem:
        assets = self.assets.find_by_source("workflow_run", run.id)
        return TaskCenterItem(
            id=run.id,
            source_type="workflow_run",
            definition_id=run.workflow_id,
            title=run.workflow_name,
            description=run.input,
            owner="自动工作流",
            status=run.status.value,
            steps=[
                TaskCenterStep(
                    order=step.order,
                    name=step.name,
                    status=step.status,
                    output=step.output,
                )
                for step in run.steps
            ],
            output=run.output,
            asset_ids=[asset.id for asset in assets],
            created_at=run.created_at,
            updated_at=run.completed_at or run.created_at,
        )
