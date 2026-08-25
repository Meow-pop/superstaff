from fastapi import APIRouter

from app.api.routes import employees, health, jobs, workflows


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(employees.router)
api_router.include_router(jobs.router)
api_router.include_router(workflows.router)
