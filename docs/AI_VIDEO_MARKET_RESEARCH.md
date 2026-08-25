# AI 视频产品调研与 Superstaff 方向

调研时间：2026-08-25。只参考各产品官方说明，目的是理解产品能力，不复制界面、代码、模型或品牌资产。

## 头部产品拆解

| 产品 | 最值得学习的能力 | Superstaff 的对应方向 |
| --- | --- | --- |
| Runway Gen-4.5 / Aleph | 文本或图片到镜头、复杂镜头调度、迭代使用生成结果、专业序列导出 | 把镜头控制做成结构化字段；保留模型适配层，不自称拥有同级基础模型 |
| Google Flow / Veo | Ingredients 参考素材、角色与风格一致性、首尾帧、延展、Scenebuilder、资产库 | 建立品牌/人物/商品参考资产与分镜时间线，支持逐镜头替换和版本管理 |
| HeyGen Video Agent | 从任务到成片、品牌系统、风格预设、协作审核、本地化和批量生产 | 视频作为 AI 员工工作流的交付物；重点做品牌套件、审核和批量变体 |
| Synthesia Assistant | 对话式修改脚本和画面、模板、企业品牌套件 | 让本地模型直接修改创作简报与场景，而不只返回聊天文字 |
| Adobe Firefly Video | 商业安全定位、镜头角度/运动、首尾帧和 1080p 工作流 | 每个能力附许可证与来源记录；优先发展可控生产而非不可解释的随机生成 |
| OpenAI Sora | Storyboard、Remix、Re-cut、Blend、Loop 与来源元数据 | 逐镜头编辑、重新生成、制作清单与 AI 来源标识 |

## 共同产品规律

头部工具已经从“一句话生成一段视频”转向完整制作系统：

```text
任务/素材 → 创作简报 → 品牌与参考资产 → 脚本 → 分镜
         → 逐镜头生成或模板渲染 → 配音/字幕 → 审核 → 导出/分发
```

质量差异不仅来自模型，也来自参考素材一致性、镜头控制、可编辑性、品牌约束、人工审核和专业导出。因此 Superstaff 不以训练视频基础模型为近期目标，而以“AI 员工自动完成企业视频生产流程”为差异化。

## 已落地的第一阶段

- 创作简报：受众、传播目标、画幅、视觉风格和节奏。
- 品牌套件：品牌名、主色、强调色和行动引导。
- 分镜导演：逐镜头旁白、画面、时长、景别、运动和转场。
- 可重新生成和人工编辑，不把一次模型输出当成最终成片。
- 9:16、16:9、1:1 本地品牌动效渲染和背景音轨。
- 商业交付检查、AI 显式标识和 JSON 制作包。
- 可选 Ollama 本地模型，默认规则执行器保持完全离线可用。

## 下一阶段优先级

1. 参考资产库：Logo、产品图、人物授权素材和风格参考。
2. 场景版本：单镜头重新生成、前后对比、选择最佳版本。
3. 离线语音：只集成许可证清晰的 TTS 运行时和音色包。
4. 字幕时间轴、背景音乐导入、响度控制和 MP4 导出。
5. 批量变体：同一内容生成不同平台、画幅、标题和 CTA。
6. 许可与来源清单：每个模型、素材和导出文件记录来源和审核人。

## 官方来源

- [Runway Gen-4.5 使用说明](https://help.runwayml.com/hc/en-us/articles/46974685288467-Creating-with-Gen-4-5)
- [Google Flow 产品介绍](https://blog.google/innovation-and-ai/products/google-flow-veo-ai-filmmaking-tool/)
- [Google Flow 2026 编辑与资产更新](https://blog.google/innovation-and-ai/models-and-research/google-labs/flow-updates-february-2026/)
- [HeyGen 2026 品牌系统与 Video Agent 更新](https://www.heygen.com/blog/heygen-march-2026-release)
- [Synthesia Assistant 使用说明](https://help.synthesia.io/en/articles/13759605-how-do-i-create-a-video-using-assistant)
- [Adobe Firefly Video 商业安全说明](https://news.adobe.com/news/2025/02/firefly-web-app-commercially-safe)
- [OpenAI Sora Storyboard 与来源标识](https://openai.com/index/sora-is-here/)
