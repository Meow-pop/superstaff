from __future__ import annotations

import json
from dataclasses import asdict

from app.domain.entities import Artifact, Employee, Job, JobStatus, JobStep, StepStatus
from app.infrastructure.database import SQLiteDatabase


class SQLiteEmployeeRepository:
    def __init__(self, database: SQLiteDatabase):
        self.database = database

    def seed(self, employees: list[Employee]) -> None:
        with self.database.connect() as connection:
            connection.executemany(
                """
                INSERT OR IGNORE INTO employees
                (id, name, role, mission, avatar, skills_json, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        employee.id,
                        employee.name,
                        employee.role,
                        employee.mission,
                        employee.avatar,
                        json.dumps(employee.skills, ensure_ascii=False),
                        employee.status,
                        employee.created_at,
                    )
                    for employee in employees
                ],
            )

    def list(self) -> list[Employee]:
        with self.database.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM employees ORDER BY status DESC, created_at ASC"
            ).fetchall()
        return [self._from_row(row) for row in rows]

    def get(self, employee_id: str) -> Employee | None:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM employees WHERE id = ?", (employee_id,)
            ).fetchone()
        return self._from_row(row) if row else None

    @staticmethod
    def _from_row(row) -> Employee:
        return Employee(
            id=row["id"],
            name=row["name"],
            role=row["role"],
            mission=row["mission"],
            avatar=row["avatar"],
            skills=json.loads(row["skills_json"]),
            status=row["status"],
            created_at=row["created_at"],
        )


class SQLiteJobRepository:
    def __init__(self, database: SQLiteDatabase):
        self.database = database

    def list(self) -> list[Job]:
        with self.database.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM jobs ORDER BY created_at DESC"
            ).fetchall()
        return [self._from_row(row, self._artifacts_for(row["id"])) for row in rows]

    def get(self, job_id: str) -> Job | None:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM jobs WHERE id = ?", (job_id,)
            ).fetchone()
        if not row:
            return None
        return self._from_row(row, self._artifacts_for(job_id))

    def create(self, job: Job) -> Job:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO jobs
                (id, employee_id, employee_name, title, goal, status, steps_json,
                 result_summary, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                self._job_values(job),
            )
        return job

    def save(self, job: Job) -> Job:
        with self.database.connect() as connection:
            connection.execute(
                """
                UPDATE jobs
                SET employee_id = ?, employee_name = ?, title = ?, goal = ?,
                    status = ?, steps_json = ?, result_summary = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    job.employee_id,
                    job.employee_name,
                    job.title,
                    job.goal,
                    job.status.value,
                    self._steps_json(job.steps),
                    job.result_summary,
                    job.updated_at,
                    job.id,
                ),
            )
        return job

    def add_artifact(self, artifact: Artifact) -> Artifact:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO artifacts (id, job_id, kind, title, content, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    artifact.id,
                    artifact.job_id,
                    artifact.kind,
                    artifact.title,
                    artifact.content,
                    artifact.created_at,
                ),
            )
        return artifact

    def _artifacts_for(self, job_id: str) -> list[Artifact]:
        with self.database.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM artifacts WHERE job_id = ? ORDER BY created_at ASC",
                (job_id,),
            ).fetchall()
        return [
            Artifact(
                id=row["id"],
                job_id=row["job_id"],
                kind=row["kind"],
                title=row["title"],
                content=row["content"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

    @staticmethod
    def _steps_json(steps: list[JobStep]) -> str:
        payload = []
        for step in steps:
            item = asdict(step)
            item["status"] = step.status.value
            payload.append(item)
        return json.dumps(payload, ensure_ascii=False)

    def _job_values(self, job: Job) -> tuple:
        return (
            job.id,
            job.employee_id,
            job.employee_name,
            job.title,
            job.goal,
            job.status.value,
            self._steps_json(job.steps),
            job.result_summary,
            job.created_at,
            job.updated_at,
        )

    @staticmethod
    def _from_row(row, artifacts: list[Artifact]) -> Job:
        steps = [
            JobStep(
                id=item["id"],
                order=item["order"],
                title=item["title"],
                instruction=item["instruction"],
                status=StepStatus(item["status"]),
                output=item.get("output", ""),
            )
            for item in json.loads(row["steps_json"])
        ]
        return Job(
            id=row["id"],
            employee_id=row["employee_id"],
            employee_name=row["employee_name"],
            title=row["title"],
            goal=row["goal"],
            status=JobStatus(row["status"]),
            steps=steps,
            result_summary=row["result_summary"],
            artifacts=artifacts,
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
