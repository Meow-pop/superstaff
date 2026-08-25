from fastapi import APIRouter

from app.api.routes import admin, assets, employees, health, jobs, production, tasks, workflows


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(admin.router)
api_router.include_router(employees.router)
api_router.include_router(jobs.router)
api_router.include_router(workflows.router)
api_router.include_router(tasks.router)
api_router.include_router(assets.router)
api_router.include_router(production.router)
