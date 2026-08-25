from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


class SQLiteDatabase:
    def __init__(self, path: str | Path):
        self.path = Path(path)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS employees (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    mission TEXT NOT NULL,
                    avatar TEXT NOT NULL,
                    skills_json TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    employee_id TEXT NOT NULL REFERENCES employees(id),
                    employee_name TEXT NOT NULL,
                    title TEXT NOT NULL,
                    goal TEXT NOT NULL,
                    status TEXT NOT NULL,
                    steps_json TEXT NOT NULL,
                    result_summary TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS artifacts (
                    id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                    kind TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_jobs_created_at
                ON jobs(created_at DESC);

                CREATE INDEX IF NOT EXISTS idx_artifacts_job_id
                ON artifacts(job_id);

                CREATE TABLE IF NOT EXISTS workflows (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    icon TEXT NOT NULL,
                    color TEXT NOT NULL,
                    status TEXT NOT NULL,
                    steps_json TEXT NOT NULL,
                    run_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS workflow_runs (
                    id TEXT PRIMARY KEY,
                    workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
                    workflow_name TEXT NOT NULL,
                    input TEXT NOT NULL,
                    status TEXT NOT NULL,
                    steps_json TEXT NOT NULL,
                    output TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    completed_at TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_workflows_updated_at
                ON workflows(updated_at DESC);

                CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at
                ON workflow_runs(created_at DESC);

                CREATE TABLE IF NOT EXISTS assets (
                    id TEXT PRIMARY KEY,
                    source_type TEXT NOT NULL,
                    source_id TEXT NOT NULL,
                    source_name TEXT NOT NULL,
                    kind TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    tags_json TEXT NOT NULL DEFAULT '[]',
                    status TEXT NOT NULL DEFAULT 'active',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(source_type, source_id, kind)
                );

                CREATE TABLE IF NOT EXISTS asset_handoffs (
                    id TEXT PRIMARY KEY,
                    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
                    asset_title TEXT NOT NULL,
                    target TEXT NOT NULL,
                    status TEXT NOT NULL,
                    note TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_assets_status_created_at
                ON assets(status, created_at DESC);

                CREATE INDEX IF NOT EXISTS idx_assets_source
                ON assets(source_type, source_id);

                CREATE INDEX IF NOT EXISTS idx_asset_handoffs_asset_id
                ON asset_handoffs(asset_id, created_at DESC);
                """
            )
            connection.execute(
                """
                INSERT OR IGNORE INTO assets
                (id, source_type, source_id, source_name, kind, title, content,
                 tags_json, status, created_at, updated_at)
                SELECT
                    'asset_legacy_' || artifacts.id,
                    'agent_job',
                    artifacts.job_id,
                    jobs.employee_name,
                    artifacts.kind,
                    artifacts.title,
                    artifacts.content,
                    '["AI员工"]',
                    'active',
                    artifacts.created_at,
                    artifacts.created_at
                FROM artifacts
                JOIN jobs ON jobs.id = artifacts.job_id
                """
            )
            connection.execute(
                """
                INSERT OR IGNORE INTO assets
                (id, source_type, source_id, source_name, kind, title, content,
                 tags_json, status, created_at, updated_at)
                SELECT
                    'asset_legacy_' || id,
                    'workflow_run',
                    id,
                    workflow_name,
                    'workflow_output',
                    workflow_name || ' · 运行成果',
                    output,
                    '["自动工作流"]',
                    'active',
                    created_at,
                    COALESCE(completed_at, created_at)
                FROM workflow_runs
                WHERE status = 'done' AND output != ''
                """
            )
            connection.execute("PRAGMA optimize")
