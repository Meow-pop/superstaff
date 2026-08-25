# 第一课：追踪一次“创建任务”请求

这一课不要求你先学完整套前端或后端。目标只有一个：能沿着代码解释，用户点击“创建任务”以后发生了什么。

## 0. 先亲手观察

1. 启动后端和前端。
2. 打开 `http://127.0.0.1:5173`。
3. 输入标题和业务目标，点击“创建任务”。
4. 注意此时任务状态是“待启动”，系统已经有了 3 个步骤，但还没有成果。
5. 点击“开始执行”，状态变成“待验收”，并出现成果。
6. 点击“验收通过”，状态才变成“已完成”。

这三个按钮不是只在前端改文字。每次操作都会请求后端，后端判断状态是否合法并保存到 SQLite。

## 1. 前端收集输入

文件：[`frontend/src/components/JobComposer.tsx`](../frontend/src/components/JobComposer.tsx)

`JobComposer` 是一个 React 组件。它用 `useState` 保存表单里的标题和目标：

```tsx
const [title, setTitle] = useState('...')
const [goal, setGoal] = useState('...')
```

用户提交表单时，组件把数据整理成一个对象：

```ts
{
  employee_id: employee.id,
  title: title.trim(),
  goal: goal.trim()
}
```

这里的 `.trim()` 会去掉文字首尾多余空格。

你要能回答：React 的 `state` 是当前页面内会变化的数据；输入框变化时更新 state，state 变化时 React 重新渲染需要更新的界面。

## 2. 前端调用 HTTP API

文件：[`frontend/src/api/superstaff.ts`](../frontend/src/api/superstaff.ts)

API 客户端执行：

```ts
fetch('/api/v1/jobs', {
  method: 'POST',
  body: JSON.stringify(input)
})
```

- `POST` 表示向服务器提交数据、创建资源。
- `/api/v1/jobs` 是接口地址。
- `JSON.stringify` 把 JavaScript 对象转换成可以通过网络发送的 JSON 文本。
- 后端返回非 2xx 状态码时，客户端抛出错误，页面显示错误提示。

开发时 Vite 会把 `/api` 请求代理到 `http://127.0.0.1:8000`。这就是前端端口 `5173` 能访问后端端口 `8000` 的原因。

## 3. 后端验证 JSON

文件：[`backend/app/schemas/jobs.py`](../backend/app/schemas/jobs.py)

`JobCreate` 是请求契约：

```python
class JobCreate(BaseModel):
    employee_id: str
    title: str = Field(min_length=2, max_length=100)
    goal: str = Field(min_length=8, max_length=4000)
```

如果目标少于 8 个字符，FastAPI 在进入业务代码前就返回 `422`。这比让错误数据进入数据库后再排查更安全。

你要能回答：TypeScript 类型主要在前端开发和编译阶段帮助我们；Pydantic 验证发生在后端运行时，即使调用者不是我们的前端也有效。

## 4. 路由把请求交给业务服务

文件：[`backend/app/api/routes/jobs.py`](../backend/app/api/routes/jobs.py)

路由定义了 HTTP 地址，但不在这里写完整业务：

```python
@router.post('', response_model=JobRead, status_code=201)
def create_job(payload: JobCreate, container=...):
    return container.job_service.create_job(...)
```

路由层主要负责：

- 地址和 HTTP 方法。
- 请求/响应类型。
- 调用正确的应用服务。

如果把数据库、AI 提示词和所有状态判断都写进路由，文件会很快变得难测、难改。

## 5. Service 实现业务用例

文件：[`backend/app/services/jobs.py`](../backend/app/services/jobs.py)

`JobService.create_job()` 依次做这些事：

1. 查询员工是否存在。
2. 检查员工状态是否为 `ready`。
3. 调用执行器生成任务计划。
4. 把任务初始状态设置成 `draft`。
5. 交给 Repository 保存。

执行和验收也在这个文件中。最重要的规则是：只有 `draft` 或 `failed` 能执行，只有 `review` 能验收。

这叫“状态机”。它避免任务从未执行就被直接标记为完成。

## 6. 执行器表达 AI 能力

文件：[`backend/app/executors/demo.py`](../backend/app/executors/demo.py)

当前 `DemoEmployeeExecutor` 用固定逻辑生成计划和内容，因此没有模型 Key 也能稳定演示。它实现三个方法：

- `plan()`：把目标拆成步骤。
- `execute_step()`：执行一个步骤。
- `compose_artifact()`：把步骤输出整理成成果。

以后接真实大模型时，新建另一个执行器实现同样接口。路由、任务状态和数据库不用跟着模型供应商一起重写。

这叫“依赖倒置”或“面向接口编程”。初学时先记住朴素版本：**把容易替换的外部能力包在一个统一接口后面。**

## 7. Repository 写入 SQLite

文件：[`backend/app/repositories/sqlite.py`](../backend/app/repositories/sqlite.py)

Repository 把 Python 对象转换成 SQL 数据：

```sql
INSERT INTO jobs (...)
VALUES (?, ?, ...)
```

问号是参数占位符，数据作为参数传入，而不是自己拼 SQL 字符串。这样可以避免引号错误和大部分 SQL 注入问题。

任务步骤暂时以 JSON 存在 `steps_json` 字段；成果单独存在 `artifacts` 表，因为一个任务以后可以产生多个成果。

## 8. JSON 返回前端并更新页面

FastAPI 把 `Job` 转为符合 `JobRead` 的 JSON。前端收到结果后调用：

```ts
setJobs(...)
setActiveJob(updated)
```

React 发现 state 变化，重新渲染任务列表和任务详情。页面从“没有任务”变为“待启动”，不需要手动刷新浏览器。

## 9. 测试证明什么

文件：[`backend/tests/test_api.py`](../backend/tests/test_api.py)

`test_job_lifecycle_from_draft_to_done` 自动执行完整流程，并断言：

- 创建后是 `draft`，有 3 个待执行步骤。
- 执行后是 `review`，步骤完成且有 1 个成果。
- 验收后才是 `done`。

测试不是证明程序永远没问题，而是把重要业务规则变成每次修改后都可以重复检查的证据。

## 10. 你的三个小练习

按难度依次做：

1. **前端练习**：在 `JobComposer.tsx` 修改默认任务标题，刷新页面观察变化，再运行 `pnpm build`。
2. **后端练习**：在 `DemoEmployeeExecutor.plan()` 把“质量自检”改成“事实与风险检查”，重启后端并创建新任务。
3. **测试练习**：在生命周期测试中增加断言，确认成果的 `kind` 等于 `content_pack`，再运行 `pytest`。

每次只改一处，先预测结果，再运行验证，然后用 `git diff` 看自己到底改了什么。

## 面试常问

**为什么不用前端直接调用大模型？**

正式密钥会暴露，而且任务状态、权限、审计和成本无法统一管理。模型调用应经过后端适配器。

**为什么要有 Service，路由不能直接写业务吗？**

小例子可以，但业务变多后会耦合 HTTP、数据库和 AI。Service 让同一用例能被 API、后台任务和测试复用。

**为什么第一版用 SQLite？**

它零配置、可持久化，足以验证数据模型和完整流程。多用户并发部署时再迁移 PostgreSQL。

**这个项目里 AI 最核心的部分是什么？**

不是某一个提示词，而是把模型放入“角色、计划、技能、权限、状态、人工验收和成果沉淀”的工程闭环。
