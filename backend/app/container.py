from dataclasses import dataclass

from app.services.employees import EmployeeService
from app.services.jobs import JobService
from app.services.workflows import WorkflowService


@dataclass(frozen=True, slots=True)
class Container:
    employee_service: EmployeeService
    job_service: JobService
    workflow_service: WorkflowService
