# 超级 AI 员工 Superstaff

本项目的产品目标是复现参考视频中的“AI 超级员工系统”：从 Agent、工作流和内容生产，逐步扩展到视频矩阵、数字人、获客、线索与客服。用户下达业务目标，AI 员工负责计划、执行、交付，并在关键节点等待人工验收。

学习前端、后端、数据库和 AI 工程是我们开发过程中的伴随目标，不是产品本身的功能。产品界面始终以参考视频为准，学习材料独立放在 `docs/`。

当前仓库同时保留两条线：

- **正式版全栈 MVP**：`frontend/` + `backend/`，是现在的主开发方向。
- **v0.2 静态原型**：根目录的 `index.html`、`app.js`、`app2.js`，保留已有内容、工作流、素材和本地视频能力。

视频只是内容员工可以调用的一项技能，不是产品核心。

## 已打通的正式版闭环

```text
选择 AI 员工 → 下达业务目标 → 生成执行计划 → 开始执行
             → 形成成果 → 人工验收 → 任务完成
```

正式版目前包含：

- 视频同款系统壳、总控首页和完整业务模块导航。
- React + TypeScript 员工工作台。
- 可创建、删除、运行并查看历史结果的自动工作流。
- 统一汇总 Agent 任务与工作流运行的任务中心。
- 自动沉淀、搜索、编辑和归档交付成果的资产中心。
- 可追踪的创意视频、剪辑和发布跨模块流转队列。
- FastAPI REST API 与自动生成的接口文档。
- SQLite 持久化员工、任务、工作流、步骤、运行记录和成果。
- 清晰的路由、业务服务、仓储和执行器分层。
- 无需模型 Key 的演示执行器。
- 后端任务与工作流生命周期测试、前端测试和 GitHub CI。

## 仓库结构

```text
frontend/   React + TypeScript：页面、交互和 API 客户端
backend/    FastAPI + SQLite：业务规则、数据和 AI 执行接口
docs/       系统架构、学习路线与逐功能课程
tests/      v0.2 静态原型的冒烟测试
index.html  可立即打开的旧版静态原型
```

完整说明见 [视频复现范围](docs/VIDEO_REPLICA_SCOPE.md)、[系统架构](docs/ARCHITECTURE.md) 和 [学习指南](docs/LEARNING_GUIDE.md)。逐功能学习可以从 [第 1 课](docs/LESSON_01_REQUEST_FLOW.md)、[第 2 课](docs/LESSON_02_WORKFLOW.md) 和 [第 3 课](docs/LESSON_03_TASKS_AND_ASSETS.md) 开始。

## 启动正式版

需要打开两个 PowerShell 终端。

### 终端 1：后端

首次运行：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

以后运行：

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

后端地址是 `http://127.0.0.1:8000`，交互式 API 文档是 `http://127.0.0.1:8000/docs`。

### 终端 2：前端

首次运行：

```powershell
cd frontend
pnpm install
pnpm dev
```

以后只需运行 `pnpm dev`。访问 `http://127.0.0.1:5173`。

## 运行测试

后端：

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

前端：

```powershell
cd frontend
pnpm test
pnpm build
```

静态原型：

```powershell
node tests\smoke.mjs
```

## 静态原型现有能力

- AI 员工对话和自定义角色。
- 多步骤自动工作流。
- 素材库以及内容到视频的交接。
- Canvas + MediaRecorder 本地生成竖版 WebM 视频。
- 账号、客户、演示数据和 JSON 备份。

静态原型的业务数据保存在浏览器 `localStorage`。正式版数据保存在 `backend/data/superstaff.db`，该文件不会提交到 Git。

## 下一步

1. 完成 M3 内容生产台，让资产真正进入脚本、素材和视频任务。
2. 用服务端模型适配器替换演示执行器，密钥不进入前端。
3. 增加后台任务队列、实时进度、超时和重试。
4. 增加账号矩阵和发布前人工确认。
5. 增加员工配置、工具权限、记忆和成本审计。
