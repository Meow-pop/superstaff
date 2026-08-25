# 如何查看、下载和交付超级 AI 员工

## 1. 当前电脑直接查看

开发服务运行时，打开：

- 正式页面：`http://127.0.0.1:5173`
- 后端接口文档：`http://127.0.0.1:8000/docs`

`127.0.0.1` 只代表当前电脑，不能直接发给别人访问。

## 2. 从 GitHub 下载源代码

打开仓库后选择 `Code → Download ZIP`，解压即可得到完整源代码。直接下载代码不等于已经安装软件；本地开发方式仍需要 Python、Node.js 和 pnpm。

## 3. 推荐的演示交付：Docker 一键运行

使用者先安装 Docker Desktop，然后在解压后的项目目录运行：

```powershell
docker compose up --build
```

完成后打开 `http://127.0.0.1:8080`。

Windows 用户解压后可以直接双击根目录的 `start-demo.bat`。它会完成构建、启动并自动打开网页。

也可以在 PowerShell 中运行：

```powershell
.\scripts\start-demo.ps1
```

停止系统：

```powershell
.\scripts\stop-demo.ps1
```

或者双击根目录的 `stop-demo.bat`。停止服务不会删除已有数据。

Docker 数据保存在名为 `superstaff_data` 的数据卷中。普通的 `docker compose down` 不会删除数据；只有明确删除数据卷才会清空 SQLite 数据。

## 4. 给非技术用户的三种交付方式

| 方式 | 使用者需要什么 | 适用场景 |
| --- | --- | --- |
| GitHub ZIP | Python、Node.js | 开发者继续修改代码 |
| Docker 一键包 | Docker Desktop | 演示、面试、团队试用 |
| 云端网址 | 浏览器 | 普通用户直接使用 |

Windows `.exe` 安装包适合完全离线交付，但需要进一步把 React、FastAPI、Python 运行时和升级机制封装成桌面应用。当前阶段优先保留 Web 全栈结构，Docker 可以验证同一套代码在其他电脑上能否稳定运行。

## 5. 当前交付边界

- SQLite 数据跟随本机或 Docker 数据卷，不会自动同步到其他电脑。
- 本地生成的 WebM 视频由浏览器下载到使用者自己的下载目录。
- 演示账号不包含密码、Cookie 或平台令牌。
- 发布计划只保存在系统内，未获得正式平台授权前不会对外发布。
