from __future__ import annotations

import json
from dataclasses import asdict

from app.domain.entities import (
    Asset,
    Employee,
    Job,
    JobStep,
    ProductionBrief,
    ProductionScene,
    Workflow,
    WorkflowStep,
)
from app.executors.demo import DemoEmployeeExecutor
from app.integrations.ollama import OllamaClient


class OllamaEmployeeExecutor(DemoEmployeeExecutor):
    def __init__(self, client: OllamaClient):
        self.client = client

    def execute_step(self, employee: Employee, job: Job, step: JobStep) -> str:
        previous = "\n\n".join(
            item.output for item in job.steps if item.order < step.order and item.output
        )
        return self.client.chat(
            "你是企业内部的 AI 员工。输出必须具体、可执行、避免编造事实，"
            "涉及外部发送、发布或高风险操作时必须要求人工确认。",
            f"员工角色：{employee.role}\n任务目标：{job.goal}\n"
            f"当前步骤：{step.title}\n步骤要求：{step.instruction}\n"
            f"前序结果：{previous or '无'}\n请直接给出本步骤交付内容。",
        )


class OllamaWorkflowExecutor:
    def __init__(self, client: OllamaClient):
        self.client = client

    def execute_step(
        self,
        workflow: Workflow,
        step: WorkflowStep,
        workflow_input: str,
        previous_output: str,
    ) -> str:
        return self.client.chat(
            "你负责执行企业内容工作流。保持事实边界，输出可以直接进入下一步骤，"
            "外部发布必须保留人工审核。",
            f"工作流：{workflow.name}\n输入：{workflow_input}\n"
            f"当前步骤：{step.name}\n要求：{step.instruction}\n"
            f"前序结果：{previous_output or '无'}\n请完成当前步骤。",
        )


class OllamaProductionExecutor:
    _schema = {
        "type": "object",
        "properties": {
            "scenes": {
                "type": "array",
                "minItems": 4,
                "maxItems": 6,
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "visual": {"type": "string"},
                        "narration": {"type": "string"},
                        "duration_seconds": {"type": "integer", "minimum": 2, "maximum": 20},
                        "shot_type": {
                            "type": "string",
                            "enum": ["特写", "中景", "全景", "信息图", "产品镜头"],
                        },
                        "camera_motion": {
                            "type": "string",
                            "enum": ["静止", "快速推进", "缓慢横移", "分层上浮", "轻推定格"],
                        },
                        "transition": {
                            "type": "string",
                            "enum": ["硬切", "闪白切入", "遮罩滑动", "叠化", "淡出"],
                        },
                    },
                    "required": [
                        "title",
                        "visual",
                        "narration",
                        "duration_seconds",
                        "shot_type",
                        "camera_motion",
                        "transition",
                    ],
                },
            }
        },
        "required": ["scenes"],
    }

    def __init__(self, client: OllamaClient):
        self.client = client

    def build(
        self, asset: Asset, target: str, brief: ProductionBrief
    ) -> tuple[str, list[ProductionScene], str]:
        response = self.client.chat(
            "你是商业短视频导演。根据素材生成4到6个连续镜头。旁白要口语化，"
            "每个镜头只表达一个重点；不得虚构数据；必须遵守品牌简报。只输出 JSON。",
            f"制作类型：{target}\n标题：{asset.title}\n"
            f"创作简报：{json.dumps(asdict(brief), ensure_ascii=False)}\n"
            f"原始素材：\n{asset.content[:8000]}",
            self._schema,
        )
        payload = json.loads(response)
        scenes = [
            ProductionScene(
                order=index,
                title=str(item["title"])[:80],
                visual=str(item["visual"])[:300],
                narration=str(item["narration"])[:500],
                duration_seconds=max(2, min(20, int(item["duration_seconds"]))),
                shot_type=item["shot_type"],
                camera_motion=item["camera_motion"],
                transition=item["transition"],
            )
            for index, item in enumerate(payload["scenes"], start=1)
        ]
        script = "\n".join(
            f"{scene.order}. {scene.title}\n{scene.narration}" for scene in scenes
        )
        duration = sum(scene.duration_seconds for scene in scenes)
        return (
            script,
            scenes,
            f"本地模型已生成 {len(scenes)} 个镜头，总时长约 {duration} 秒。"
            f"画幅 {brief.aspect_ratio}，风格 {brief.visual_style}。",
        )
