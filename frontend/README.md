# Superstaff Web

React + TypeScript 前端。开发时通过 Vite 代理访问本地 FastAPI，浏览器只需要请求 `/api/v1`。

```powershell
pnpm install
pnpm dev
```

访问 `http://127.0.0.1:5173`。运行前端之前需要先启动 `backend`。

- `src/api`：HTTP 请求
- `src/components`：可复用组件
- `src/pages`：页面与用例状态
- `src/types`：前后端数据契约
- `src/utils`：无 UI 的展示逻辑与测试
