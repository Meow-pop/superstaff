import { useEffect, useState, type FormEvent } from 'react'

import type { CreateJobInput, Employee } from '../types/contracts'

interface JobComposerProps {
  employee: Employee | null
  busy: boolean
  onCreate: (input: CreateJobInput) => Promise<void>
}

export function JobComposer({ employee, busy, onCreate }: JobComposerProps) {
  const [title, setTitle] = useState('超级 AI 员工首周内容计划')
  const [goal, setGoal] = useState(
    '面向第一次了解产品的创业者，规划 3 条内容，讲清楚 AI 员工与普通聊天机器人的差异。',
  )

  useEffect(() => {
    if (employee?.status !== 'ready') return
    setTitle(`${employee.role.replace('AI ', '')}的新任务`)
  }, [employee])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!employee || employee.status !== 'ready') return
    await onCreate({
      employee_id: employee.id,
      title: title.trim(),
      goal: goal.trim(),
    })
  }

  const disabled = !employee || employee.status !== 'ready'

  return (
    <form className="composer" onSubmit={submit}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">任务编排</span>
          <h2>给员工下达目标</h2>
        </div>
        <span className="selected-employee">
          {employee ? `${employee.avatar} ${employee.name}` : '未选择员工'}
        </span>
      </div>

      <label>
        <span>任务标题</span>
        <input
          aria-label="任务标题"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={2}
          maxLength={100}
          disabled={disabled || busy}
          required
        />
      </label>

      <label>
        <span>业务目标</span>
        <textarea
          aria-label="业务目标"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          minLength={8}
          maxLength={4000}
          rows={5}
          disabled={disabled || busy}
          required
        />
      </label>

      <div className="composer-footer">
        <p>
          告诉员工结果和受众，不需要自己先写提示词。系统会先生成计划，再等待你启动执行。
        </p>
        <button className="button button-primary" type="submit" disabled={disabled || busy}>
          {busy ? '正在创建…' : disabled ? '该员工暂未开放' : '创建任务 →'}
        </button>
      </div>
    </form>
  )
}
