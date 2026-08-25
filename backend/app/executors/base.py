from typing import Protocol

from app.domain.entities import Artifact, Employee, Job, JobStep, Workflow, WorkflowStep


class EmployeeExecutor(Protocol):
    def plan(self, employee: Employee, goal: str) -> list[JobStep]: ...

    def execute_step(self, employee: Employee, job: Job, step: JobStep) -> str: ...

    def compose_artifact(self, employee: Employee, job: Job) -> Artifact: ...


class WorkflowExecutor(Protocol):
    def execute_step(
        self,
        workflow: Workflow,
        step: WorkflowStep,
        workflow_input: str,
        previous_output: str,
    ) -> str: ...
