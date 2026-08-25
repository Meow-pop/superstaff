from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.container import Container
from app.domain.entities import (
    Employee,
    ProviderConfig,
    SocialAccount,
    Workflow,
    WorkflowStep,
)
from app.domain.errors import (
    EmployeeUnavailableError,
    ExecutionError,
    InvalidTransitionError,
    NotFoundError,
)
from app.executors.demo import DemoEmployeeExecutor
from app.executors.local_model import (
    OllamaEmployeeExecutor,
    OllamaProductionExecutor,
    OllamaWorkflowExecutor,
)
from app.executors.production_demo import DemoProductionExecutor
from app.executors.workflow_demo import DemoWorkflowExecutor
from app.integrations.ollama import OllamaClient, OllamaSettings
from app.infrastructure.database import SQLiteDatabase
from app.repositories.sqlite import SQLiteEmployeeRepository, SQLiteJobRepository
from app.repositories.assets import SQLiteAssetRepository
from app.repositories.admin import SQLiteAdminRepository
from app.repositories.production import SQLiteProductionRepository
from app.repositories.workflows import SQLiteWorkflowRepository
from app.services.assets import AssetService
from app.services.admin import AdminService
from app.services.employees import EmployeeService
from app.services.jobs import JobService
from app.services.production import ProductionService
from app.services.task_center import TaskCenterService
from app.services.workflows import WorkflowService


BASE_DIR = Path(__file__).resolve().parents[1]
logger = logging.getLogger(__name__)


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


def seed_accounts() -> list[SocialAccount]:
    created_at = datetime(2026, 8, 25, tzinfo=timezone.utc).isoformat()
    return [
        SocialAccount(
            id="account-douyin-demo",
            platform="抖音",
            display_name="超级员工实验室",
            handle="superstaff_demo",
            status="demo",
            follower_count=1280,
            created_at=created_at,
            updated_at=created_at,
        ),
        SocialAccount(
            id="account-xiaohongshu-demo",
            platform="小红书",
            display_name="AI 工作流研究所",
            handle="ai_workflow_lab",
            status="demo",
            follower_count=860,
            created_at=created_at,
            updated_at=created_at,
        ),
        SocialAccount(
            id="account-wechat-demo",
            platform="视频号",
            display_name="Superstaff 企业内容号",
            handle="superstaff_video",
            status="disabled",
            follower_count=320,
            created_at=created_at,
            updated_at=created_at,
        ),
    ]


def seed_providers(llm_mode: str, ollama_model: str) -> list[ProviderConfig]:
    updated_at = datetime(2026, 8, 25, tzinfo=timezone.utc).isoformat()
    definitions = [
        (
            "language-demo",
            "language",
            "本地 Qwen 语言模型" if llm_mode == "ollama" else "内置规则执行器",
            "Ollama" if llm_mode == "ollama" else "DemoEmployeeExecutor",
            "active" if llm_mode == "ollama" else "demo",
            "",
            (
                f"通过客户自己的 Ollama 运行 {ollama_model}，不发送业务数据到云端。"
                if llm_mode == "ollama"
                else "无需模型即可运行完整闭环；启用 Ollama 后提升规划和脚本质量。"
            ),
        ),
        (
            "image-external",
            "image",
            "本地视觉模板引擎",
            "CanvasSceneEngine",
            "active",
            "",
            "使用品牌色、版式和动效生成画面，不调用第三方图片服务。",
        ),
        (
            "voice-external",
            "voice",
            "本地音频引擎",
            "WebAudioSoundtrack",
            "active",
            "",
            "默认生成本地背景音轨；可继续安装许可证明确的离线语音包。",
        ),
        (
            "video-local",
            "video",
            "浏览器本地渲染",
            "CanvasMediaRecorder",
            "active",
            "",
            "当前可用，可根据品牌简报生成带动效与音轨的高清视频。",
        ),
        (
            "video-external",
            "video",
            "本地分镜导演",
            "OllamaStoryboardAdapter" if llm_mode == "ollama" else "RuleStoryboardAdapter",
            "active" if llm_mode == "ollama" else "demo",
            "",
            "本地生成脚本、镜头语言、运动和转场，不依赖云端视频平台。",
        ),
        (
            "publishing-oauth",
            "publishing",
            "人工审核发布包",
            "ManualExportPackage",
            "active",
            "",
            "导出视频、脚本和发布清单，由用户审核后手动上传到目标平台。",
        ),
    ]
    return [
        ProviderConfig(
            id=item[0],
            category=item[1],
            display_name=item[2],
            adapter=item[3],
            mode=item[4],
            credential_env=item[5],
            description=item[6],
            updated_at=updated_at,
        )
        for item in definitions
    ]


def create_app(database_path: str | Path | None = None) -> FastAPI:
    db_path = database_path or os.getenv(
        "SUPERSTAFF_DB_PATH", str(BASE_DIR / "data" / "superstaff.db")
    )
    database = SQLiteDatabase(db_path)
    database.initialize()

    llm_mode = os.getenv("SUPERSTAFF_LLM_MODE", "demo").strip().lower()
    if llm_mode not in {"demo", "ollama"}:
        logger.warning("Unknown SUPERSTAFF_LLM_MODE=%s; falling back to demo", llm_mode)
        llm_mode = "demo"
    ollama_settings = OllamaSettings(
        base_url=os.getenv("SUPERSTAFF_OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
        model=os.getenv("SUPERSTAFF_OLLAMA_MODEL", "qwen3:4b"),
        timeout_seconds=float(os.getenv("SUPERSTAFF_OLLAMA_TIMEOUT", "180")),
    )
    ollama_client = OllamaClient(ollama_settings)

    employee_repository = SQLiteEmployeeRepository(database)
    employee_repository.seed(seed_employees())
    job_repository = SQLiteJobRepository(database)
    workflow_repository = SQLiteWorkflowRepository(database)
    asset_repository = SQLiteAssetRepository(database)
    production_repository = SQLiteProductionRepository(database)
    admin_repository = SQLiteAdminRepository(database)
    production_repository.seed_accounts(seed_accounts())
    admin_repository.seed_providers(seed_providers(llm_mode, ollama_settings.model))
    workflow_repository.seed(seed_workflows())
    if llm_mode == "ollama":
        executor = OllamaEmployeeExecutor(ollama_client)
        workflow_executor = OllamaWorkflowExecutor(ollama_client)
        production_executor = OllamaProductionExecutor(ollama_client)
    else:
        executor = DemoEmployeeExecutor()
        workflow_executor = DemoWorkflowExecutor()
        production_executor = DemoProductionExecutor()
    production_service = ProductionService(
        production_repository, asset_repository, production_executor
    )
    admin_service = AdminService(
        admin_repository,
        Path(db_path),
        llm_mode=llm_mode,
        ollama_client=ollama_client,
    )

    app = FastAPI(
        title="超级 AI 员工 API",
        version="0.5.0",
        description="AI 员工、工作流、成果制作、发布计划与人工验收的后端服务。",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.container = Container(
        admin_service=admin_service,
        employee_service=EmployeeService(employee_repository),
        job_service=JobService(
            employee_repository, job_repository, asset_repository, executor
        ),
        workflow_service=WorkflowService(
            workflow_repository, asset_repository, workflow_executor
        ),
        task_center_service=TaskCenterService(
            job_repository, workflow_repository, asset_repository
        ),
        asset_service=AssetService(asset_repository, production_service),
        production_service=production_service,
    )
    app.include_router(api_router)

    @app.middleware("http")
    async def audit_successful_write(request: Request, call_next):
        response = await call_next(request)
        should_audit = request.method in {
            "POST",
            "PATCH",
            "DELETE",
        } or request.url.path.endswith("/admin/backups/export")
        if should_audit and response.status_code < 400:
            try:
                admin_service.record_http_mutation(
                    request.method,
                    request.url.path,
                    response.status_code,
                    request.url.query,
                )
            except Exception:
                logger.exception("Failed to record audit event")
        return response

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
