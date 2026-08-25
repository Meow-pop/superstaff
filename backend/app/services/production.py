from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone
from uuid import uuid4

from app.domain.entities import (
    Asset,
    AssetHandoff,
    ProductionJob,
    ProductionStatus,
    SocialAccount,
)
from app.domain.errors import ExecutionError, InvalidTransitionError, NotFoundError
from app.executors.production_demo import DemoProductionExecutor
from app.repositories.protocols import AssetRepository, ProductionRepository


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ProductionService:
    def __init__(
        self,
        repository: ProductionRepository,
        assets: AssetRepository,
        executor: DemoProductionExecutor,
    ):
        self.repository = repository
        self.assets = assets
        self.executor = executor

    def list_jobs(
        self, target: str | None = None, status: str | None = None
    ) -> list[ProductionJob]:
        return self.repository.list_jobs(target, status)

    def get_job(self, job_id: str) -> ProductionJob:
        job = self.repository.get_job(job_id)
        if not job:
            raise NotFoundError(f"制作任务不存在：{job_id}")
        return job

    def create_from_handoff(
        self, handoff: AssetHandoff, asset: Asset
    ) -> ProductionJob:
        now = handoff.created_at
        return self.repository.create_job(
            ProductionJob(
                id=f"production_{uuid4().hex[:10]}",
                handoff_id=handoff.id,
                asset_id=asset.id,
                title=asset.title,
                target=handoff.target,
                status=ProductionStatus.QUEUED,
                script="",
                scenes=[],
                output="",
                account_id=None,
                account_name="",
                scheduled_at=None,
                created_at=now,
                updated_at=now,
            )
        )

    def run_job(self, job_id: str) -> ProductionJob:
        job = self.get_job(job_id)
        if job.target == "publisher":
            raise InvalidTransitionError("发布任务需要先选择账号和计划时间")
        if job.status not in {ProductionStatus.QUEUED, ProductionStatus.FAILED}:
            raise InvalidTransitionError(
                f"制作任务处于 {job.status.value}，不能再次开始"
            )
        asset = self.assets.get(job.asset_id)
        if not asset:
            raise NotFoundError(f"成果资产不存在：{job.asset_id}")
        running = replace(job, status=ProductionStatus.RUNNING, updated_at=utc_now())
        self.repository.save_job(running)
        try:
            script, scenes, output = self.executor.build(asset, job.target)
            completed = replace(
                running,
                status=ProductionStatus.REVIEW,
                script=script,
                scenes=scenes,
                output=output,
                updated_at=utc_now(),
            )
            return self.repository.save_job(completed)
        except Exception as exc:
            self.repository.save_job(
                replace(running, status=ProductionStatus.FAILED, updated_at=utc_now())
            )
            raise ExecutionError("内容制作任务执行失败") from exc

    def approve_job(self, job_id: str) -> ProductionJob:
        job = self.get_job(job_id)
        if job.status != ProductionStatus.REVIEW:
            raise InvalidTransitionError("只有待审核的制作方案可以确认完成")
        return self.repository.save_job(
            replace(job, status=ProductionStatus.DONE, updated_at=utc_now())
        )

    def schedule_publish(
        self, job_id: str, account_id: str, scheduled_at: str
    ) -> ProductionJob:
        job = self.get_job(job_id)
        if job.target != "publisher":
            raise InvalidTransitionError("只有发布任务可以创建发布计划")
        account = self.get_account(account_id)
        if account.status == "disabled":
            raise InvalidTransitionError("该账号已停用，不能创建发布计划")
        return self.repository.save_job(
            replace(
                job,
                status=ProductionStatus.READY,
                account_id=account.id,
                account_name=f"{account.platform} · {account.display_name}",
                scheduled_at=scheduled_at,
                output="发布计划已保存，等待平台正式授权后执行。",
                updated_at=utc_now(),
            )
        )

    def list_accounts(self) -> list[SocialAccount]:
        return self.repository.list_accounts()

    def get_account(self, account_id: str) -> SocialAccount:
        account = self.repository.get_account(account_id)
        if not account:
            raise NotFoundError(f"内容账号不存在：{account_id}")
        return account

    def create_account(
        self, platform: str, display_name: str, handle: str
    ) -> SocialAccount:
        now = utc_now()
        return self.repository.create_account(
            SocialAccount(
                id=f"account_{uuid4().hex[:10]}",
                platform=platform,
                display_name=display_name,
                handle=handle,
                status="demo",
                follower_count=0,
                created_at=now,
                updated_at=now,
            )
        )

    def update_account_status(self, account_id: str, status: str) -> SocialAccount:
        account = self.get_account(account_id)
        return self.repository.save_account(
            replace(account, status=status, updated_at=utc_now())
        )
