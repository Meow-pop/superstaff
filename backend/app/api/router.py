from fastapi import APIRouter

from app.api.routes import assets, employees, health, jobs, tasks, workflows


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(employees.router)
api_router.include_router(jobs.router)
api_router.include_router(workflows.router)
api_router.include_router(tasks.router)
api_router.include_router(assets.router)
