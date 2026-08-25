from app.domain.entities import Workflow, WorkflowStep


class DemoWorkflowExecutor:
    """Deterministic workflow executor used until a model adapter is configured."""

    def execute_step(
        self,
        workflow: Workflow,
        step: WorkflowStep,
        workflow_input: str,
        previous_output: str,
    ) -> str:
        context = previous_output.strip()
        if step.order == 1:
            return (
                f"已接收任务：{workflow_input}\n"
                f"执行要求：{step.instruction}\n"
                "关键对象：目标用户、业务价值、交付渠道。\n"
                "执行原则：先形成最小可用结果，再进入后续优化。"
            )

        if "标题" in step.name or "钩子" in step.name:
            return (
                f"1. 为什么多数人做「{workflow_input[:24]}」时，第一步就错了？\n"
                f"2. 把「{workflow_input[:24]}」做成闭环，只需要这 3 步\n"
                f"3. 我用一套工作流重新做了「{workflow_input[:24]}」"
            )

        if "脚本" in step.name or "文案" in step.name or "内容" in step.name:
            return (
                f"【开场】如果你的目标是{workflow_input}，先不要急着堆功能。\n"
                "【主体】第一，明确用户真正需要的结果；第二，把流程拆成可验证步骤；"
                "第三，让系统保存每次运行结果并根据反馈迭代。\n"
                "【结尾】先跑通最小闭环，再增加自动化和更多渠道。"
            )

        if "检查" in step.name or "优化" in step.name or "审核" in step.name:
            return (
                "质量检查完成：\n"
                "- 已回应原始目标；\n"
                "- 结构包含问题、方案和行动建议；\n"
                "- 发布前仍需人工核对事实、品牌口径和平台规范。"
            )

        context_note = f"\n上一步摘要：{context[:180]}" if context else ""
        return (
            f"步骤「{step.name}」已完成。\n"
            f"本步指令：{step.instruction}\n"
            f"处理对象：{workflow_input}{context_note}"
        )
