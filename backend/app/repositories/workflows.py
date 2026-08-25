from __future__ import annotations

import json
from dataclasses import asdict

from app.domain.entities import (
    StepStatus,
    Workflow,
    WorkflowRun,
    WorkflowRunStatus,
    WorkflowRunStep,
    WorkflowStep,
)
from app.infrastructure.database import SQLiteDatabase


class SQLiteWorkflowRepository:
    def __init__(self, database: SQLiteDatabase):
        self.database = database

    def seed(self, workflows: list[Workflow]) -> None:
        with self.database.connect() as connection:
            connection.executemany(
                """
                INSERT OR IGNORE INTO workflows
                (id, name, description, icon, color, status, steps_json,
                 run_count, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [self._workflow_values(workflow) for workflow in workflows],
            )

    def list(self) -> list[Workflow]:
        with self.database.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM workflows ORDER BY updated_at DESC"
            ).fetchall()
        return [self._workflow_from_row(row) for row in rows]

    def get(self, workflow_id: str) -> Workflow | None:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM workflows WHERE id = ?", (workflow_id,)
            ).fetchone()
        return self._workflow_from_row(row) if row else None

    def create(self, workflow: Workflow) -> Workflow:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO workflows
                (id, name, description, icon, color, status, steps_json,
                 run_count, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                self._workflow_values(workflow),
            )
        return workflow

    def save(self, workflow: Workflow) -> Workflow:
        with self.database.connect() as connection:
            connection.execute(
                """
                UPDATE workflows
                SET name = ?, description = ?, icon = ?, color = ?, status = ?,
                    steps_json = ?, run_count = ?, updated_at = ?
                WHERE id = ?
                """,
                (
                    workflow.name,
                    workflow.description,
                    workflow.icon,
                    workflow.color,
                    workflow.status,
                    self._workflow_steps_json(workflow.steps),
                    workflow.run_count,
                    workflow.updated_at,
                    workflow.id,
                ),
            )
        return workflow

    def delete(self, workflow_id: str) -> bool:
        with self.database.connect() as connection:
            cursor = connection.execute(
                "DELETE FROM workflows WHERE id = ?", (workflow_id,)
            )
        return cursor.rowcount > 0

    def list_runs(self, workflow_id: str | None = None) -> list[WorkflowRun]:
        query = "SELECT * FROM workflow_runs"
        params: tuple[str, ...] = ()
        if workflow_id:
            query += " WHERE workflow_id = ?"
            params = (workflow_id,)
        query += " ORDER BY created_at DESC"
        with self.database.connect() as connection:
            rows = connection.execute(query, params).fetchall()
        return [self._run_from_row(row) for row in rows]

    def get_run(self, run_id: str) -> WorkflowRun | None:
        with self.database.connect() as connection:
            row = connection.execute(
                "SELECT * FROM workflow_runs WHERE id = ?", (run_id,)
            ).fetchone()
        return self._run_from_row(row) if row else None

    def create_run(self, run: WorkflowRun) -> WorkflowRun:
        with self.database.connect() as connection:
            connection.execute(
                """
                INSERT INTO workflow_runs
                (id, workflow_id, workflow_name, input, status, steps_json,
                 output, created_at, completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                self._run_values(run),
            )
        return run

    def save_run(self, run: WorkflowRun) -> WorkflowRun:
        with self.database.connect() as connection:
            connection.execute(
                """
                UPDATE workflow_runs
                SET workflow_name = ?, input = ?, status = ?, steps_json = ?,
                    output = ?, completed_at = ?
                WHERE id = ?
                """,
                (
                    run.workflow_name,
                    run.input,
                    run.status.value,
                    self._run_steps_json(run.steps),
                    run.output,
                    run.completed_at,
                    run.id,
                ),
            )
        return run

    def _workflow_values(self, workflow: Workflow) -> tuple:
        return (
            workflow.id,
            workflow.name,
            workflow.description,
            workflow.icon,
            workflow.color,
            workflow.status,
            self._workflow_steps_json(workflow.steps),
            workflow.run_count,
            workflow.created_at,
            workflow.updated_at,
        )

    @staticmethod
    def _workflow_steps_json(steps: list[WorkflowStep]) -> str:
        return json.dumps([asdict(step) for step in steps], ensure_ascii=False)

    @staticmethod
    def _workflow_from_row(row) -> Workflow:
        return Workflow(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            icon=row["icon"],
            color=row["color"],
            status=row["status"],
            steps=[WorkflowStep(**item) for item in json.loads(row["steps_json"])],
            run_count=row["run_count"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def _run_values(self, run: WorkflowRun) -> tuple:
        return (
            run.id,
            run.workflow_id,
            run.workflow_name,
            run.input,
            run.status.value,
            self._run_steps_json(run.steps),
            run.output,
            run.created_at,
            run.completed_at,
        )

    @staticmethod
    def _run_steps_json(steps: list[WorkflowRunStep]) -> str:
        payload = []
        for step in steps:
            item = asdict(step)
            item["status"] = step.status.value
            payload.append(item)
        return json.dumps(payload, ensure_ascii=False)

    @staticmethod
    def _run_from_row(row) -> WorkflowRun:
        steps = [
            WorkflowRunStep(
                id=item["id"],
                order=item["order"],
                name=item["name"],
                status=StepStatus(item["status"]),
                output=item.get("output", ""),
            )
            for item in json.loads(row["steps_json"])
        ]
        return WorkflowRun(
            id=row["id"],
            workflow_id=row["workflow_id"],
            workflow_name=row["workflow_name"],
            input=row["input"],
            status=WorkflowRunStatus(row["status"]),
            steps=steps,
            output=row["output"],
            created_at=row["created_at"],
            completed_at=row["completed_at"],
        )
