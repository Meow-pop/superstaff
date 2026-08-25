from __future__ import annotations

import re

from app.domain.entities import Asset, ProductionBrief, ProductionScene


class DemoProductionExecutor:
    """Builds a deterministic script and storyboard without an external model."""

    def build(
        self, asset: Asset, target: str, brief: ProductionBrief
    ) -> tuple[str, list[ProductionScene], str]:
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
            f"{brief.brand_name} 品牌色标题卡，快速出现核心观点",
            "用户问题或业务场景，配关键词字幕",
            "三点式信息卡、流程箭头与证据提示",
            f"成果画面、品牌标识和行动按钮：{brief.call_to_action}",
        ]
        shots = ["特写", "中景", "信息图", "产品镜头"]
        motions = ["快速推进", "缓慢横移", "分层上浮", "轻推定格"]
        transitions = ["闪白切入", "遮罩滑动", "叠化", "淡出"]
        scenes = [
            ProductionScene(
                order=index,
                title=labels[index - 1],
                visual=visuals[index - 1],
                narration=sentences[index - 1][:180],
                duration_seconds=(3 if brief.pace == "fast" else 4)
                if index in {1, 4}
                else (5 if brief.pace == "fast" else 6),
                shot_type=shots[index - 1],
                camera_motion=motions[index - 1],
                transition=transitions[index - 1],
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
            f"画幅 {brief.aspect_ratio}，风格 {brief.visual_style}。"
            "当前使用可商用的本地规则执行器，可选接入本地 Ollama 提升脚本质量。"
        )
        return script, scenes, output
