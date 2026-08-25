from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.domain.entities import Artifact, Employee, Job, JobStep


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class DemoEmployeeExecutor:
    """Deterministic executor used before a real model provider is configured."""

    def plan(self, employee: Employee, goal: str) -> list[JobStep]:
        return [
            JobStep(
                id=f"step_{uuid4().hex[:8]}",
                order=1,
                title="理解目标",
                instruction="提取目标、受众、渠道和成功标准。",
            ),
            JobStep(
                id=f"step_{uuid4().hex[:8]}",
                order=2,
                title="生成首版交付物",
                instruction=f"调用 {employee.role} 的核心技能形成可直接修改的草稿。",
            ),
            JobStep(
                id=f"step_{uuid4().hex[:8]}",
                order=3,
                title="质量自检",
                instruction="检查内容是否回应目标，并给出下一步建议。",
            ),
        ]

    def execute_step(self, employee: Employee, job: Job, step: JobStep) -> str:
        if step.order == 1:
            return (
                f"业务目标：{job.goal}\n"
                "默认受众：对该主题有兴趣、但尚未采取行动的人群。\n"
                "成功标准：信息清楚、可执行，并能进入人工验收。"
            )
        if step.order == 2:
            return (
                f"【{job.title}】\n\n"
                f"开场：真正重要的不是多做一个功能，而是解决——{job.goal}\n\n"
                "核心内容：\n"
                "1. 先说明用户当前遇到的具体问题；\n"
                "2. 给出一个可以立即执行的最小方案；\n"
                "3. 用结果或案例证明方案有效；\n"
                "4. 邀请用户反馈，再决定下一轮优化。\n\n"
                "行动引导：先完成最小闭环，再根据真实反馈增加模块。"
            )
        return (
            "自检通过：草稿已经回应原始目标，包含明确结构和行动引导。\n"
            "人工验收时建议重点检查：事实准确性、品牌语气、发布渠道限制。"
        )

    def compose_artifact(self, employee: Employee, job: Job) -> Artifact:
        draft = next((step.output for step in job.steps if step.order == 2), "")
        review = next((step.output for step in job.steps if step.order == 3), "")
        return Artifact(
            id=f"artifact_{uuid4().hex[:10]}",
            job_id=job.id,
            kind="content_pack",
            title=f"{job.title} · 首版成果",
            content=f"{draft}\n\n---\n质量检查\n{review}",
            created_at=utc_now(),
        )
