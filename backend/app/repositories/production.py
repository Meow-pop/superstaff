from __future__ import annotations

import json
from dataclasses import asdict

from app.domain.entities import (
    ProductionJob,
    ProductionScene,
    ProductionStatus,
    SocialAccount,
)
from app.infrastructure.database import SQLiteDatabase


class SQLiteProductionRepository:
    def __init__(self, database: SQLiteDatabase):
        self.database = database

    def list_jobs(
        self, target: str | None = None, status: str | None = None
    ) -> list[ProductionJob]:
        clauses: list[str] = []
        params: list[str] = []
        if target:
            clauses.append("target = ?")
            params.append(target)
        if status:
            clauses.append("status = ?")
            params.append(status)
        sql = "SELECT * FROM production_jobs"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY created_at DESC"
        with self.database.connect() as connection:
            rows = connection.execute(sql, tuple(params)).fetchall()
        return [self._job_from_row(row) for row in rows]

    def get_job(self, job_id: str) -> ProductionJob | None:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM production_jobs WHERE id = ?", (job_id,)
            ).fetchone()
        return self._job_from_row(row) if row else None

    def create_job(self, job: ProductionJob) -> ProductionJob:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT OR IGNORE INTO production_jobs
                (id, handoff_id, asset_id, title, target, status, script,
                 scenes_json, output, account_id, account_name, scheduled_at,
                 created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                self._job_values(job),
            )
            row = connection.execute(
                "SELECT * FROM production_jobs WHERE handoff_id = ?",
                (job.handoff_id,),
            ).fetchone()
        return self._job_from_row(row)

    def save_job(self, job: ProductionJob) -> ProductionJob:
        with self.database.connect() as connection:
            connection.execute(
                """
                UPDATE production_jobs
                SET title = ?, target = ?, status = ?, script = ?,
                    scenes_json = ?, output = ?, account_id = ?, account_name = ?,
                    scheduled_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    job.title,
                    job.target,
                    job.status.value,
                    job.script,
                    self._scenes_json(job.scenes),
                    job.output,
                    job.account_id,
                    job.account_name,
                    job.scheduled_at,
                    job.updated_at,
                    job.id,
                ),
            )
        return job

    def seed_accounts(self, accounts: list[SocialAccount]) -> None:
        with self.database.connect() as connection:
            connection.executemany(
                """
                INSERT OR IGNORE INTO social_accounts
                (id, platform, display_name, handle, status, follower_count,
                 created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [self._account_values(account) for account in accounts],
            )

    def list_accounts(self) -> list[SocialAccount]:
        with self.database.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM social_accounts ORDER BY platform, created_at"
            ).fetchall()
        return [self._account_from_row(row) for row in rows]

    def get_account(self, account_id: str) -> SocialAccount | None:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM social_accounts WHERE id = ?", (account_id,)
            ).fetchone()
        return self._account_from_row(row) if row else None

    def create_account(self, account: SocialAccount) -> SocialAccount:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO social_accounts
                (id, platform, display_name, handle, status, follower_count,
                 created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                self._account_values(account),
            )
        return account

    def save_account(self, account: SocialAccount) -> SocialAccount:
        with self.database.connect() as connection:
            connection.execute(
                """
                UPDATE social_accounts
                SET platform = ?, display_name = ?, handle = ?, status = ?,
                    follower_count = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    account.platform,
                    account.display_name,
                    account.handle,
                    account.status,
                    account.follower_count,
                    account.updated_at,
                    account.id,
                ),
            )
        return account

    def _job_values(self, job: ProductionJob) -> tuple:
        return (
            job.id,
            job.handoff_id,
            job.asset_id,
            job.title,
            job.target,
            job.status.value,
            job.script,
            self._scenes_json(job.scenes),
            job.output,
            job.account_id,
            job.account_name,
            job.scheduled_at,
            job.created_at,
            job.updated_at,
        )

    @staticmethod
    def _scenes_json(scenes: list[ProductionScene]) -> str:
        return json.dumps([asdict(scene) for scene in scenes], ensure_ascii=False)

    @staticmethod
    def _job_from_row(row) -> ProductionJob:
        return ProductionJob(
            id=row["id"],
            handoff_id=row["handoff_id"],
            asset_id=row["asset_id"],
            title=row["title"],
            target=row["target"],
            status=ProductionStatus(row["status"]),
            script=row["script"],
            scenes=[ProductionScene(**item) for item in json.loads(row["scenes_json"])],
            output=row["output"],
            account_id=row["account_id"],
            account_name=row["account_name"],
            scheduled_at=row["scheduled_at"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @staticmethod
    def _account_values(account: SocialAccount) -> tuple:
        return (
            account.id,
            account.platform,
            account.display_name,
            account.handle,
            account.status,
            account.follower_count,
            account.created_at,
            account.updated_at,
        )

    @staticmethod
    def _account_from_row(row) -> SocialAccount:
        return SocialAccount(
            id=row["id"],
            platform=row["platform"],
            display_name=row["display_name"],
            handle=row["handle"],
            status=row["status"],
            follower_count=row["follower_count"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
