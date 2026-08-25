# Superstaff API

FastAPI 后端负责员工、工作流、统一任务、成果资产和跨模块流转的业务规则。当前使用 SQLite 与演示执行器，因此无需模型 Key 也能跑通完整任务闭环。

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

- API：`http://127.0.0.1:8000/api/v1`
- 交互式文档：`http://127.0.0.1:8000/docs`
- 测试：`python -m pytest`

`SUPERSTAFF_DB_PATH` 可以覆盖默认数据库文件位置。
