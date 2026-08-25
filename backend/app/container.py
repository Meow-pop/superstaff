from dataclasses import dataclass

from app.services.employees import EmployeeService
from app.services.assets import AssetService
from app.services.jobs import JobService
from app.services.production import ProductionService
from app.services.task_center import TaskCenterService
from app.services.workflows import WorkflowService


@dataclass(frozen=True, slots=True)
class Container:
    employee_service: EmployeeService
    job_service: JobService
    workflow_service: WorkflowService
    task_center_service: TaskCenterService
    asset_service: AssetService
    production_service: ProductionService
