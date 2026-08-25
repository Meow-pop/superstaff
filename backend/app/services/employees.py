from app.domain.entities import Employee
from app.domain.errors import NotFoundError
from app.repositories.protocols import EmployeeRepository


class EmployeeService:
    def __init__(self, repository: EmployeeRepository):
        self.repository = repository

    def list_employees(self) -> list[Employee]:
        return self.repository.list()

    def get_employee(self, employee_id: str) -> Employee:
        employee = self.repository.get(employee_id)
        if not employee:
            raise NotFoundError(f"AI 员工不存在：{employee_id}")
        return employee
