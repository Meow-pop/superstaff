from __future__ import annotations

import re

from app.domain.entities import Asset, ProductionScene


class DemoProductionExecutor:
    """Builds a deterministic script and storyboard without an external model."""

    def build(self, asset: Asset, target: str) -> tuple[str, list[ProductionScene], str]:
        clean = re.sub(r"\s+", " ", asset.content).strip()
        sentences = [
            item.strip()
            for item in re.split(r"(?<=[。！？!?；;])", clean)
            if item.strip()
        ]
        if not sentences:
            sentences = [asset.title]
        while len(sentences) < 4:
            sentences.append(sentences[-1])

        labels = ["开场钩子", "问题与价值", "核心方案", "行动引导"]
        visuals = [
            "品牌色标题卡，快速出现核心观点",
            "人物或业务场景，中景配关键词字幕",
            "三点式信息卡与流程箭头",
            "成果画面、品牌标识和明确行动按钮",
        ]
        scenes = [
            ProductionScene(
                order=index,
                title=labels[index - 1],
                visual=visuals[index - 1],
                narration=sentences[index - 1][:180],
                duration_seconds=4 if index in {1, 4} else 6,
            )
            for index in range(1, 5)
        ]
        script = "\n".join(
            f"{scene.order}. {scene.title}\n{scene.narration}" for scene in scenes
        )
        mode = "创意视频" if target == "creative_video" else "多场景剪辑"
        output = (
            f"{mode}方案已生成：4 个场景，总时长约 "
            f"{sum(scene.duration_seconds for scene in scenes)} 秒。"
            "当前使用本地演示执行器，正式模型接入后可以替换画面和声音供应商。"
        )
        return script, scenes, output
