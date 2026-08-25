import { useEffect, useMemo, useState } from 'react'

import { superstaffApi } from '../api/superstaff'
import type { JobStatus, TaskCenterItem, TaskSourceType } from '../types/contracts'
import { formatDateTime, jobStatusLabel } from '../utils/jobPresentation'

interface TaskCenterPageProps {
  onNavigate: (page: 'assets') => void
}

type SourceFilter = 'all' | TaskSourceType
type StatusFilter = 'all' | JobStatus

function progressOf(task: TaskCenterItem): number {
  if (task.steps.length === 0) return task.status === 'done' ? 100 : 0
  return Math.round((task.steps.filter((step) => step.status === 'done').length / task.steps.length) * 100)
}

export function TaskCenterPage({ onNavigate }: TaskCenterPageProps) {
  const [tasks, setTasks] = useState<TaskCenterItem[]>([])
  const [activeTask, setActiveTask] = useState<TaskCenterItem | null>(null)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function loadTasks(preferredId?: string) {
    setError('')
    try {
      const list = await superstaffApi.listTasks()
      setTasks(list)
      setActiveTask((current) =>
        list.find((item) => item.id === (preferredId ?? current?.id)) ?? list[0] ?? null,
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '任务中心加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTasks()
  }, [])

  const filteredTasks = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesSource = sourceFilter === 'all' || task.source_type === sourceFilter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesQuery = !keyword || `${task.title} ${task.description} ${task.owner}`.toLowerCase().includes(keyword)
      return matchesSource && matchesStatus && matchesQuery
    })
  }, [query, sourceFilter, statusFilter, tasks])

  async function runAgentTask(task: TaskCenterItem) {
    setBusy(true)
    setError('')
    try {
      await superstaffApi.runJob(task.id)
      await loadTasks(task.id)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '任务执行失败')
    } finally {
      setBusy(false)
    }
  }

  async function approveAgentTask(task: TaskCenterItem) {
    setBusy(true)
    setError('')
    try {
      await superstaffApi.approveJob(task.id)
      await loadTasks(task.id)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '任务验收失败')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <main className="loading-screen"><div className="loading-mark">任</div><p>正在汇总全部任务…</p></main>
  }

  return (
    <main className="task-center-page">
      {error && <div className="error-banner" role="alert"><span>!</span><p>{error}</p><button type="button" aria-label="关闭错误提示" onClick={() => setError('')}>×</button></div>}

      <section className="task-page-header">
        <div><span className="page-breadcrumb">首页 / 自动化中心 / 任务中心</span><h1>任务中心</h1><p>统一跟踪 AI 员工和自动工作流，从启动、执行到成果验收。</p></div>
        <button type="button" onClick={() => void loadTasks(activeTask?.id)}>↻ 刷新状态</button>
      </section>

      <section className="task-metrics">
        <article><i className="task-metric-blue">总</i><div><b>{tasks.length}</b><small>全部任务</small></div></article>
        <article><i className="task-metric-orange">运</i><div><b>{tasks.filter((item) => ['draft', 'running'].includes(item.status)).length}</b><small>待执行与执行中</small></div></article>
        <article><i className="task-metric-purple">验</i><div><b>{tasks.filter((item) => item.status === 'review').length}</b><small>等待人工验收</small></div></article>
        <article><i className="task-metric-green">果</i><div><b>{tasks.reduce((sum, item) => sum + item.asset_ids.length, 0)}</b><small>已沉淀成果</small></div></article>
      </section>

      <section className="task-center-shell">
        <div className="task-toolbar">
          <div className="task-source-tabs">
            {([['all', '全部来源'], ['agent_job', 'Agent 任务'], ['workflow_run', '工作流运行']] as const).map(([value, label]) => <button type="button" key={value} className={sourceFilter === value ? 'active' : ''} onClick={() => setSourceFilter(value)}>{label}</button>)}
          </div>
          <div className="task-filter-tools">
            <select aria-label="按状态筛选" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">全部状态</option><option value="draft">待启动</option><option value="running">执行中</option><option value="review">待验收</option><option value="done">已完成</option><option value="failed">失败</option>
            </select>
            <input aria-label="搜索任务" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务、目标或负责人" />
          </div>
        </div>

        <div className="task-center-layout">
          <section className="unified-task-list">
            <div className="unified-task-head"><span>任务与来源</span><span>进度</span><span>状态</span><span>更新时间</span></div>
            {filteredTasks.map((task) => {
              const progress = progressOf(task)
              return <button type="button" key={task.id} className={`unified-task-row ${activeTask?.id === task.id ? 'active' : ''}`} onClick={() => setActiveTask(task)}>
                <div className="unified-task-main"><i className={task.source_type === 'agent_job' ? 'agent' : 'workflow'}>{task.source_type === 'agent_job' ? 'AI' : '流'}</i><span><strong>{task.title}</strong><small>{task.owner} · {task.source_type === 'agent_job' ? 'Agent 任务' : '自动工作流'}</small></span></div>
                <div className="unified-progress"><span><i style={{ width: `${progress}%` }} /></span><small>{progress}%</small></div>
                <em className={`task-status task-status-${task.status}`}>{jobStatusLabel(task.status)}</em>
                <time>{formatDateTime(task.updated_at)}</time>
              </button>
            })}
            {filteredTasks.length === 0 && <div className="task-list-empty"><i>◎</i><strong>没有符合条件的任务</strong><p>调整来源、状态或搜索条件。</p></div>}
          </section>

          <section className="unified-task-detail">
            {!activeTask ? <div className="task-detail-empty"><i>◇</i><strong>选择一项任务查看执行细节</strong></div> : <>
              <div className="task-detail-title"><div><span>{activeTask.source_type === 'agent_job' ? 'AGENT JOB' : 'WORKFLOW RUN'} · {activeTask.id.slice(-8).toUpperCase()}</span><h2>{activeTask.title}</h2><p>{activeTask.description}</p></div><em className={`task-status task-status-${activeTask.status}`}>{jobStatusLabel(activeTask.status)}</em></div>
              <div className="task-detail-owner"><i>{activeTask.source_type === 'agent_job' ? 'AI' : '流'}</i><div><small>执行来源</small><strong>{activeTask.owner}</strong></div><span>{activeTask.steps.length} 个步骤 · {progressOf(activeTask)}% 完成</span></div>
              <div className="task-detail-steps">{activeTask.steps.map((step) => <article key={`${activeTask.id}-${step.order}`} className={`task-detail-step task-detail-step-${step.status}`}><i>{step.status === 'done' ? '✓' : step.order}</i><div><header><strong>{step.order}. {step.name}</strong><span>{step.status === 'done' ? '完成' : step.status === 'running' ? '执行中' : step.status === 'failed' ? '失败' : '等待'}</span></header>{step.output && <pre>{step.output}</pre>}</div></article>)}</div>
              {activeTask.output && <div className="task-output-preview"><header><span>最终成果预览</span><button type="button" onClick={() => onNavigate('assets')}>打开成果资产 →</button></header><pre>{activeTask.output}</pre></div>}
              <div className="task-detail-actions"><p>{activeTask.asset_ids.length > 0 ? `已自动沉淀 ${activeTask.asset_ids.length} 份成果资产` : activeTask.status === 'draft' ? '计划已经生成，可以开始执行。' : '任务执行后会自动沉淀成果。'}</p>{activeTask.source_type === 'agent_job' && ['draft', 'failed'].includes(activeTask.status) && <button type="button" className="primary" disabled={busy} onClick={() => void runAgentTask(activeTask)}>{busy ? '执行中…' : activeTask.status === 'failed' ? '重新执行' : '开始执行'}</button>}{activeTask.source_type === 'agent_job' && activeTask.status === 'review' && <button type="button" className="approve" disabled={busy} onClick={() => void approveAgentTask(activeTask)}>{busy ? '提交中…' : '验收通过 ✓'}</button>}</div>
            </>}
          </section>
        </div>
      </section>
    </main>
  )
}
