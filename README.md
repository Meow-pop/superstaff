# Superstaff · 超级 AI 员工

Superstaff 是一个本地优先、可私有部署的企业 AI 员工工作台。用户提交业务目标，系统负责拆解任务、执行工作流、沉淀成果、组织视频生产，并在发布等外部动作前保留人工审核。

产品核心不是单次生成一段文字或视频，而是把工作变成可以追踪、复用和交付的闭环：

```text
业务目标 → AI 员工规划与执行 → 人工验收 → 成果资产
        → 创作简报 → 脚本与分镜 → 本地品牌渲染 → 制作包导出
```

## 当前能力

- React + TypeScript 企业工作台，FastAPI + SQLite 后端。
- AI 员工任务、自动工作流、统一任务中心和成果资产中心。
- 可追踪的跨模块流转、人工验收、操作审计和 JSON 数据备份。
- 本地优先视频工作室：创作简报、品牌套件、画幅/风格/节奏、可编辑镜头、镜头运动、转场、质量检查和结构化制作包。
- 浏览器本地生成 9:16、16:9 或 1:1 WebM 成片，不需要云端视频账号。
- 默认规则执行器无需模型也能运行；可选连接客户自己的 Ollama + Qwen3 本地模型。
- Docker Compose 一键运行，SQLite 与本地模型分别使用持久化数据卷。
- 后端接口测试、前端测试、生产构建和 GitHub CI。

## 独立商用架构

默认安装不调用云模型、不保存第三方平台密码，也不绕过平台授权：

- 语言与分镜：内置规则执行器，或客户自有 Ollama。
- 视觉与视频：Canvas + MediaRecorder 本地品牌动效引擎。
- 音频：Web Audio 本地背景音轨；离线语音包作为后续可选模块。
- 发布：导出视频和结构化制作包，由用户审核后手动上传。

项目代码采用专有许可证。React、FastAPI、Ollama、Qwen3 等第三方组件仍按各自宽松许可证使用并保留声明，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 仓库结构

```text
frontend/                    React + TypeScript 前端
backend/                     FastAPI + SQLite 后端与执行器
backend/app/integrations/    本地模型等可插拔能力
docs/                        架构、交付、商业化与学习材料
docker-compose.yml           无模型也可运行的基础版
docker-compose.local-ai.yml  Ollama + Qwen3 本地模型扩展
```

## 最快启动

### 标准本地版

Windows 双击 `start-demo.bat`，或者运行：

```powershell
docker compose up -d --build
```

打开 <http://127.0.0.1:8080>。

### 本地模型版

Windows 双击 `start-local-ai.bat`，或者运行：

```powershell
docker compose -f docker-compose.yml -f docker-compose.local-ai.yml up -d --build
```

首次启动会在客户电脑下载 `qwen3:4b`，之后模型数据保存在 `superstaff_models` 数据卷中。系统控制台会显示 Ollama 连接和模型状态。

也可以让后端连接已经安装的 Ollama：

```powershell
$env:SUPERSTAFF_LLM_MODE = "ollama"
$env:SUPERSTAFF_OLLAMA_BASE_URL = "http://127.0.0.1:11434"
$env:SUPERSTAFF_OLLAMA_MODEL = "qwen3:4b"
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## 开发与测试

后端：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

前端：

```powershell
cd frontend
pnpm install
pnpm test
pnpm build
pnpm dev
```

开发页面为 <http://127.0.0.1:5173>，API 文档为 <http://127.0.0.1:8000/docs>。

## 文档

- [产品验收说明](docs/PRODUCT_DEMO.md)
- [安装与交付](docs/PACKAGING.md)
- [独立商业化架构](docs/COMMERCIALIZATION.md)
- [AI 视频产品调研](docs/AI_VIDEO_MARKET_RESEARCH.md)
- [系统架构](docs/ARCHITECTURE.md)
- [边开发边学习](docs/LEARNING_GUIDE.md)

当前定位是可交付的本地单工作区产品。公网 SaaS、多租户计费、企业 SSO、自动平台发布和写实生成式视频模型属于独立的后续模块。
