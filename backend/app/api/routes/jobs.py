from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_container
from app.container import Container
from app.schemas.jobs import JobCreate, JobRead


router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[JobRead])
def list_jobs(container: Annotated[Container, Depends(get_container)]):
    return container.job_service.list_jobs()


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    container: Annotated[Container, Depends(get_container)],
):
    return container.job_service.create_job(
        employee_id=payload.employee_id,
        title=payload.title,
        goal=payload.goal,
    )


@router.get("/{job_id}", response_model=JobRead)
def get_job(
    job_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    return container.job_service.get_job(job_id)


@router.post("/{job_id}/run", response_model=JobRead)
def run_job(
    job_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    return container.job_service.run_job(job_id)


@router.post("/{job_id}/approve", response_model=JobRead)
def approve_job(
    job_id: str,
    container: Annotated[Container, Depends(get_container)],
):
    return container.job_service.approve_job(job_id)
