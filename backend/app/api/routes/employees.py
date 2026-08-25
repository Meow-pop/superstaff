from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_container
from app.container import Container
from app.schemas.employees import EmployeeRead


router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("", response_model=list[EmployeeRead])
def list_employees(
    container: Annotated[Container, Depends(get_container)],
):
    return container.employee_service.list_employees()
