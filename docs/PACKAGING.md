# 安装、打包与商业交付

## 1. 当前电脑查看

- Docker 产品版：<http://127.0.0.1:8080>
- 开发前端：<http://127.0.0.1:5173>
- API 文档：<http://127.0.0.1:8000/docs>

`127.0.0.1` 只代表当前电脑，不能作为公开网址发给客户。

## 2. 两种交付包

| 版本 | 启动方式 | 模型 | 适用场景 |
| --- | --- | --- | --- |
| 标准本地版 | `start-demo.bat` | 内置规则执行器 | 演示、低配置电脑、流程试用 |
| 本地模型版 | `start-local-ai.bat` | Ollama + Qwen3 | 私有部署、真实内容生产 |

标准版运行：

```powershell
docker compose up -d --build
```

本地模型版运行：

```powershell
docker compose -f docker-compose.yml -f docker-compose.local-ai.yml up -d --build
```

停止服务不会删除数据。业务数据保存在 `superstaff_data`，模型权重保存在 `superstaff_models`。不要在未备份时删除这两个数据卷。

## 3. 商业交付目录

向客户交付时建议提供：

```text
superstaff-v0.5/
├── docker-compose.yml
├── docker-compose.local-ai.yml
├── start-demo.bat
├── start-local-ai.bat
├── stop-demo.bat
├── stop-local-ai.bat
├── LICENSE
├── THIRD_PARTY_NOTICES.md
├── README.md
└── source-or-images/        按合同选择交付源码或预构建镜像
```

源代码、预构建镜像、升级服务、数据迁移和现场实施应在合同中分别写清楚。默认销售“部署使用权 + 实施 + 维护”，不必默认交付源代码。

## 4. 不依赖 Docker Desktop 的后续安装包

当前 Docker 方式便于验证跨电脑运行，但客户安装的容器桌面产品可能有独立订阅条款。正式离线 Windows 安装包应进一步完成：

- 将前端静态文件交给 FastAPI 同域提供；
- 封装 Python 运行时和后台服务；
- 将 Ollama/llama.cpp 作为经过许可证审计的可选本地引擎；
- 增加安装、升级、卸载、日志收集和数据备份界面。

这样客户无需 Node、Python 或 Docker，也不会因为容器桌面产品产生额外授权不确定性。

## 5. 发布前检查

- 固定容器镜像和模型的精确版本或摘要。
- 生成传递依赖 SBOM 并归档全部许可证文本。
- 替换客户 Logo、品牌色和示例账号，清理演示数据。
- 验证登录、权限、备份恢复、日志脱敏和密钥管理。
- 根据销售地区准备 EULA、隐私政策、服务范围和维护条款。
