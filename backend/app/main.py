from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.container import Container
from app.domain.entities import Employee, Workflow, WorkflowStep
from app.domain.errors import (
    EmployeeUnavailableError,
    ExecutionError,
    InvalidTransitionError,
    NotFoundError,
)
from app.executors.demo import DemoEmployeeExecutor
from app.executors.workflow_demo import DemoWorkflowExecutor
from app.infrastructure.database import SQLiteDatabase
from app.repositories.sqlite import SQLiteEmployeeRepository, SQLiteJobRepository
from app.repositories.workflows import SQLiteWorkflowRepository
from app.services.employees import EmployeeService
from app.services.jobs import JobService
from app.services.workflows import WorkflowService


BASE_DIR = Path(__file__).resolve().parents[1]


def seed_employees() -> list[Employee]:
    created_at = datetime(2026, 8, 25, tzinfo=timezone.utc).isoformat()
    return [
        Employee(
            id="content-operator",
            name="小策",
            role="AI 内容运营员工",
            mission="把业务目标变成可发布、可复用、可复盘的内容成果。",
            avatar="策",
            skills=["目标拆解", "多平台文案", "视频脚本", "质量自检"],
            status="ready",
            created_at=created_at,
        ),
        Employee(
            id="sales-assistant",
            name="小拓",
            role="AI 销售助理",
            mission="整理线索、准备触达内容并跟进销售机会。",
            avatar="拓",
            skills=["线索整理", "客户研究", "触达话术"],
            status="coming_soon",
            created_at=created_at,
        ),
        Employee(
            id="research-analyst",
            name="小研",
            role="AI 研究分析师",
            mission="从资料和数据中形成有证据的分析结论。",
            avatar="研",
            skills=["资料检索", "数据分析", "研究报告"],
            status="coming_soon",
            created_at=created_at,
        ),
    ]


def seed_workflows() -> list[Workflow]:
    created_at = datetime(2026, 8, 25, tzinfo=timezone.utc).isoformat()
    definitions = [
        (
            "workflow-content-engine",
            "爆款内容流水线",
            "从一个主题出发，完成目标分析、标题钩子、口播脚本和质量检查。",
            "爆",
            "#5b7cf0",
            [
                ("目标与受众分析", "识别目标用户、发布渠道和内容需要解决的问题。"),
                ("生成标题钩子", "生成三个有差异的标题与开场钩子。"),
                ("生成口播脚本", "结合前序结果形成结构完整、可直接修改的口播脚本。"),
                ("质量检查", "检查事实、结构、品牌语气和行动引导。"),
            ],
        ),
        (
            "workflow-multi-platform",
            "多平台内容分发",
            "把一份核心内容改写成适合抖音、小红书和视频号的版本。",
            "矩",
            "#8a57df",
            [
                ("提取核心观点", "从输入中提取最重要的观点和证据。"),
                ("生成平台文案", "分别生成适配三个平台语气和长度的内容。"),
                ("发布前检查", "检查标题、标签、比例和平台限制。"),
            ],
        ),
        (
            "workflow-lead-research",
            "企业线索研究",
            "把企业或行业线索整理成结构化研究摘要和下一步跟进建议。",
            "客",
            "#32a78e",
            [
                ("线索信息整理", "提取企业、联系人、需求和来源信息。"),
                ("意向分析", "判断线索价值、可能需求和关键风险。"),
                ("跟进建议", "生成下一步沟通目标、问题清单和跟进节奏。"),
            ],
        ),
    ]
    return [
        Workflow(
            id=workflow_id,
            name=name,
            description=description,
            icon=icon,
            color=color,
            status="ready",
            steps=[
                WorkflowStep(
                    id=f"{workflow_id}-step-{index}",
                    order=index,
                    name=step_name,
                    instruction=instruction,
                )
                for index, (step_name, instruction) in enumerate(steps, start=1)
            ],
            run_count=0,
            created_at=created_at,
            updated_at=created_at,
        )
        for workflow_id, name, description, icon, color, steps in definitions
    ]


def create_app(database_path: str | Path | None = None) -> FastAPI:
    db_path = database_path or os.getenv(
        "SUPERSTAFF_DB_PATH", str(BASE_DIR / "data" / "superstaff.db")
    )
    database = SQLiteDatabase(db_path)
    database.initialize()

    employee_repository = SQLiteEmployeeRepository(database)
    employee_repository.seed(seed_employees())
    job_repository = SQLiteJobRepository(database)
    workflow_repository = SQLiteWorkflowRepository(database)
    workflow_repository.seed(seed_workflows())
    executor = DemoEmployeeExecutor()
    workflow_executor = DemoWorkflowExecutor()

    app = FastAPI(
        title="超级 AI 员工 API",
        version="0.1.0",
        description="AI 员工、任务执行与人工验收的后端服务。",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.container = Container(
        employee_service=EmployeeService(employee_repository),
        job_service=JobService(employee_repository, job_repository, executor),
        workflow_service=WorkflowService(workflow_repository, workflow_executor),
    )
    app.include_router(api_router)

    @app.exception_handler(NotFoundError)
    async def handle_not_found(_: Request, exc: NotFoundError):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)}
        )

    @app.exception_handler(InvalidTransitionError)
    async def handle_invalid_transition(_: Request, exc: InvalidTransitionError):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)}
        )

    @app.exception_handler(EmployeeUnavailableError)
    async def handle_employee_unavailable(_: Request, exc: EmployeeUnavailableError):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)}
        )

    @app.exception_handler(ExecutionError)
    async def handle_execution_error(_: Request, exc: ExecutionError):
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY, content={"detail": str(exc)}
        )

    return app


app = create_app()
