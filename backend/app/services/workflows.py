from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone
from uuid import uuid4

from app.domain.entities import (
    StepStatus,
    Workflow,
    WorkflowRun,
    WorkflowRunStatus,
    WorkflowRunStep,
    WorkflowStep,
)
from app.domain.errors import ExecutionError, NotFoundError
from app.executors.base import WorkflowExecutor
from app.repositories.protocols import WorkflowRepository


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class WorkflowService:
    def __init__(self, repository: WorkflowRepository, executor: WorkflowExecutor):
        self.repository = repository
        self.executor = executor

    def list_workflows(self) -> list[Workflow]:
        return self.repository.list()

    def get_workflow(self, workflow_id: str) -> Workflow:
        workflow = self.repository.get(workflow_id)
        if not workflow:
            raise NotFoundError(f"工作流不存在：{workflow_id}")
        return workflow

    def create_workflow(
        self,
        name: str,
        description: str,
        icon: str,
        color: str,
        steps: list[tuple[str, str]],
    ) -> Workflow:
        now = utc_now()
        workflow = Workflow(
            id=f"workflow_{uuid4().hex[:10]}",
            name=name,
            description=description,
            icon=icon,
            color=color,
            status="ready",
            steps=[
                WorkflowStep(
                    id=f"workflow_step_{uuid4().hex[:8]}",
                    order=index,
                    name=step_name,
                    instruction=instruction,
                )
                for index, (step_name, instruction) in enumerate(steps, start=1)
            ],
            run_count=0,
            created_at=now,
            updated_at=now,
        )
        return self.repository.create(workflow)

    def delete_workflow(self, workflow_id: str) -> None:
        self.get_workflow(workflow_id)
        self.repository.delete(workflow_id)

    def list_runs(self, workflow_id: str | None = None) -> list[WorkflowRun]:
        if workflow_id:
            self.get_workflow(workflow_id)
        return self.repository.list_runs(workflow_id)

    def get_run(self, run_id: str) -> WorkflowRun:
        run = self.repository.get_run(run_id)
        if not run:
            raise NotFoundError(f"工作流运行记录不存在：{run_id}")
        return run

    def run_workflow(self, workflow_id: str, workflow_input: str) -> WorkflowRun:
        workflow = self.get_workflow(workflow_id)
        now = utc_now()
        run = WorkflowRun(
            id=f"workflow_run_{uuid4().hex[:10]}",
            workflow_id=workflow.id,
            workflow_name=workflow.name,
            input=workflow_input,
            status=WorkflowRunStatus.RUNNING,
            steps=[
                WorkflowRunStep(
                    id=f"run_step_{uuid4().hex[:8]}",
                    order=step.order,
                    name=step.name,
                    status=StepStatus.PENDING,
                    output="",
                )
                for step in workflow.steps
            ],
            output="",
            created_at=now,
            completed_at=None,
        )
        self.repository.create_run(run)

        try:
            previous_output = ""
            completed_steps: list[WorkflowRunStep] = []
            outputs: list[str] = []
            for definition, run_step in zip(workflow.steps, run.steps, strict=True):
                running_step = replace(run_step, status=StepStatus.RUNNING)
                run = replace(
                    run, steps=[*completed_steps, running_step, *run.steps[len(completed_steps) + 1 :]]
                )
                self.repository.save_run(run)

                output = self.executor.execute_step(
                    workflow, definition, workflow_input, previous_output
                )
                done_step = replace(
                    run_step, status=StepStatus.DONE, output=output
                )
                completed_steps.append(done_step)
                outputs.append(f"【{definition.name}】\n{output}")
                previous_output = output
                run = replace(run, steps=[*completed_steps, *run.steps[len(completed_steps) :]])
                self.repository.save_run(run)

            completed_at = utc_now()
            completed_run = replace(
                run,
                status=WorkflowRunStatus.DONE,
                steps=completed_steps,
                output="\n\n".join(outputs),
                completed_at=completed_at,
            )
            self.repository.save_run(completed_run)
            self.repository.save(
                replace(
                    workflow,
                    run_count=workflow.run_count + 1,
                    updated_at=completed_at,
                )
            )
            return completed_run
        except Exception as exc:
            failed_steps = [
                replace(step, status=StepStatus.FAILED)
                if step.status == StepStatus.RUNNING
                else step
                for step in run.steps
            ]
            failed_run = replace(
                run,
                status=WorkflowRunStatus.FAILED,
                steps=failed_steps,
                completed_at=utc_now(),
            )
            self.repository.save_run(failed_run)
            raise ExecutionError("工作流执行失败") from exc
