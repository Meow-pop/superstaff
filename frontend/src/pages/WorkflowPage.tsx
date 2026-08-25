import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { superstaffApi } from '../api/superstaff'
import type {
  CreateWorkflowInput,
  Workflow,
  WorkflowRun,
} from '../types/contracts'
import { formatDateTime } from '../utils/jobPresentation'

type ViewMode = 'workflows' | 'runs'

interface EditableStep {
  id: string
  name: string
  instruction: string
}

function newEditableStep(name = '', instruction = ''): EditableStep {
  return { id: `${Date.now()}-${Math.random()}`, name, instruction }
}

const initialSteps = () => [
  newEditableStep('理解输入', '提取输入中的目标、对象、渠道和成功标准。'),
  newEditableStep('生成结果', '结合上一步输出形成可以直接修改的首版成果。'),
  newEditableStep('质量检查', '检查结果是否回应目标，并给出风险与下一步建议。'),
]

export function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('workflows')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [runInput, setRunInput] = useState('')
  const [runResult, setRunResult] = useState<WorkflowRun | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('流')
  const [color, setColor] = useState('#6c5ce7')
  const [steps, setSteps] = useState<EditableStep[]>(initialSteps)

  const totalRuns = useMemo(
    () => workflows.reduce((sum, workflow) => sum + workflow.run_count, 0),
    [workflows],
  )

  async function loadData() {
    setError('')
    try {
      const [workflowList, runList] = await Promise.all([
        superstaffApi.listWorkflows(),
        superstaffApi.listWorkflowRuns(),
      ])
      setWorkflows(workflowList)
      setRuns(runList)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载工作流失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function resetCreateForm() {
    setName('')
    setDescription('')
    setIcon('流')
    setColor('#6c5ce7')
    setSteps(initialSteps())
  }

  async function createWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanSteps = steps
      .map((step) => ({ name: step.name.trim(), instruction: step.instruction.trim() }))
      .filter((step) => step.name && step.instruction)
    if (cleanSteps.length === 0) {
      setError('至少需要一个完整步骤')
      return
    }

    const payload: CreateWorkflowInput = {
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim(),
      color,
      steps: cleanSteps,
    }
    setBusy(true)
    setError('')
    try {
      const created = await superstaffApi.createWorkflow(payload)
      setWorkflows((current) => [created, ...current])
      setShowCreate(false)
      resetCreateForm()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创建工作流失败')
    } finally {
      setBusy(false)
    }
  }

  async function runWorkflow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedWorkflow) return
    setBusy(true)
    setRunResult(null)
    setError('')
    try {
      const result = await superstaffApi.runWorkflow(selectedWorkflow.id, runInput.trim())
      setRunResult(result)
      setRuns((current) => [result, ...current])
      setWorkflows((current) =>
        current.map((workflow) =>
          workflow.id === selectedWorkflow.id
            ? { ...workflow, run_count: workflow.run_count + 1, updated_at: result.completed_at ?? workflow.updated_at }
            : workflow,
        ),
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '工作流运行失败')
    } finally {
      setBusy(false)
    }
  }

  async function deleteWorkflow(workflow: Workflow) {
    if (!window.confirm(`确定删除工作流“${workflow.name}”吗？相关运行记录也会删除。`)) return
    setBusy(true)
    setError('')
    try {
      await superstaffApi.deleteWorkflow(workflow.id)
      setWorkflows((current) => current.filter((item) => item.id !== workflow.id))
      setRuns((current) => current.filter((run) => run.workflow_id !== workflow.id))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '删除工作流失败')
    } finally {
      setBusy(false)
    }
  }

  function openRun(workflow: Workflow) {
    setSelectedWorkflow(workflow)
    setRunInput('')
    setRunResult(null)
    setError('')
  }

  function closeRun() {
    if (busy) return
    setSelectedWorkflow(null)
    setRunResult(null)
    setRunInput('')
  }

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-mark">流</div>
        <p>正在加载自动工作流…</p>
      </main>
    )
  }

  return (
    <main className="workflow-page">
      {error && (
        <div className="error-banner" role="alert">
          <span>!</span><p>{error}</p>
          <button type="button" onClick={() => setError('')} aria-label="关闭错误提示">×</button>
        </div>
      )}

      <section className="workflow-page-header">
        <div>
          <span className="page-breadcrumb">首页 / 自动化中心 / 自动工作流</span>
          <h1>自动工作流</h1>
          <p>把重复业务编排成可复用步骤，上一步输出自动成为下一步输入。</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)}>＋ 新建工作流</button>
      </section>

      <section className="workflow-metrics">
        <article><i className="flow-metric-blue">流</i><div><b>{workflows.length}</b><small>工作流总数</small></div></article>
        <article><i className="flow-metric-purple">步</i><div><b>{workflows.reduce((sum, item) => sum + item.steps.length, 0)}</b><small>编排步骤</small></div></article>
        <article><i className="flow-metric-green">运</i><div><b>{totalRuns}</b><small>累计运行</small></div></article>
        <article><i className="flow-metric-orange">成</i><div><b>{runs.filter((run) => run.status === 'done').length}</b><small>成功记录</small></div></article>
      </section>

      <section className="workflow-workbench">
        <div className="workflow-tabs">
          <button type="button" className={viewMode === 'workflows' ? 'active' : ''} onClick={() => setViewMode('workflows')}>我的工作流</button>
          <button type="button" className={viewMode === 'runs' ? 'active' : ''} onClick={() => setViewMode('runs')}>运行记录</button>
          <span>演示执行器 · 无需模型 Key</span>
        </div>

        {viewMode === 'workflows' ? (
          <div className="workflow-card-grid">
            {workflows.map((workflow) => (
              <article className="workflow-card" key={workflow.id}>
                <div className="workflow-card-head">
                  <i style={{ '--workflow-color': workflow.color } as React.CSSProperties}>{workflow.icon}</i>
                  <div><h2>{workflow.name}</h2><p>{workflow.description}</p></div>
                  <span>可运行</span>
                </div>
                <div className="workflow-step-line">
                  {workflow.steps.map((step, index) => (
                    <div className="workflow-step-item" key={step.id}>
                      <span><i>{step.order}</i>{step.name}</span>
                      {index < workflow.steps.length - 1 && <b>→</b>}
                    </div>
                  ))}
                </div>
                <div className="workflow-card-footer">
                  <small>已运行 {workflow.run_count} 次 · {workflow.steps.length} 个步骤</small>
                  <div>
                    <button type="button" className="workflow-delete" disabled={busy} onClick={() => void deleteWorkflow(workflow)}>删除</button>
                    <button type="button" className="workflow-run" onClick={() => openRun(workflow)}>▶ 运行</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="workflow-run-table">
            <div className="workflow-run-table-head"><span>工作流</span><span>输入</span><span>步骤</span><span>状态</span><span>运行时间</span><span>操作</span></div>
            {runs.map((run) => (
              <button type="button" className="workflow-run-row" key={run.id} onClick={() => { setSelectedWorkflow(workflows.find((workflow) => workflow.id === run.workflow_id) ?? null); setRunResult(run); setRunInput(run.input) }}>
                <strong>{run.workflow_name}</strong>
                <span>{run.input}</span>
                <span>{run.steps.length} 步</span>
                <em className={`workflow-run-status workflow-run-status-${run.status}`}>{run.status === 'done' ? '成功' : run.status === 'failed' ? '失败' : '运行中'}</em>
                <time>{formatDateTime(run.created_at)}</time>
                <i>查看结果 →</i>
              </button>
            ))}
            {runs.length === 0 && <div className="workflow-empty"><i>◇</i><strong>暂无运行记录</strong><p>选择一个工作流并输入任务即可开始。</p></div>}
          </div>
        )}
      </section>

      {showCreate && (
        <div className="flow-modal-backdrop" role="presentation">
          <form className="flow-modal flow-create-modal" onSubmit={createWorkflow}>
            <div className="flow-modal-head"><div><span>WORKFLOW BUILDER</span><h2>新建工作流</h2></div><button type="button" onClick={() => setShowCreate(false)}>×</button></div>
            <div className="flow-form-grid">
              <label><span>工作流名称</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} placeholder="如：小红书内容流水线" required /></label>
              <label><span>图标文字</span><input value={icon} onChange={(event) => setIcon(event.target.value)} minLength={1} maxLength={8} required /></label>
            </div>
            <label><span>工作流说明</span><input value={description} onChange={(event) => setDescription(event.target.value)} minLength={2} maxLength={240} placeholder="一句话说明这条流水线负责什么" required /></label>
            <div className="flow-color-row"><span>主题颜色</span>{['#5b7cf0', '#8a57df', '#32a78e', '#e56d87', '#e18a45'].map((item) => <button type="button" key={item} className={color === item ? 'active' : ''} style={{ background: item }} onClick={() => setColor(item)} aria-label={`选择颜色 ${item}`} />)}</div>
            <div className="flow-step-editor-title"><span>执行步骤</span><button type="button" onClick={() => setSteps((current) => [...current, newEditableStep()])}>＋ 添加步骤</button></div>
            <div className="flow-step-editors">
              {steps.map((step, index) => (
                <article key={step.id}>
                  <i>{index + 1}</i>
                  <div>
                    <input aria-label={`步骤 ${index + 1} 名称`} value={step.name} onChange={(event) => setSteps((current) => current.map((item) => item.id === step.id ? { ...item, name: event.target.value } : item))} placeholder="步骤名称" />
                    <textarea aria-label={`步骤 ${index + 1} 指令`} value={step.instruction} onChange={(event) => setSteps((current) => current.map((item) => item.id === step.id ? { ...item, instruction: event.target.value } : item))} rows={2} placeholder="该步骤需要完成什么" />
                  </div>
                  <button type="button" disabled={steps.length === 1} onClick={() => setSteps((current) => current.filter((item) => item.id !== step.id))}>×</button>
                </article>
              ))}
            </div>
            <div className="flow-modal-footer"><button type="button" onClick={() => setShowCreate(false)}>取消</button><button type="submit" className="primary" disabled={busy}>{busy ? '保存中…' : '保存工作流'}</button></div>
          </form>
        </div>
      )}

      {selectedWorkflow && (
        <div className="flow-modal-backdrop" role="presentation">
          <form className="flow-modal flow-run-modal" onSubmit={runWorkflow}>
            <div className="flow-modal-head"><div><span>RUN WORKFLOW</span><h2>{selectedWorkflow.name}</h2></div><button type="button" onClick={closeRun}>×</button></div>
            {!runResult ? (
              <>
                <p className="flow-run-description">{selectedWorkflow.description}</p>
                <div className="flow-run-map">{selectedWorkflow.steps.map((step, index) => <div key={step.id}><span><i>{step.order}</i>{step.name}</span>{index < selectedWorkflow.steps.length - 1 && <b>→</b>}</div>)}</div>
                <label><span>输入主题 / 业务素材</span><textarea aria-label="工作流输入" value={runInput} onChange={(event) => setRunInput(event.target.value)} rows={4} minLength={2} maxLength={4000} placeholder="例如：解释 AI 超级员工与普通聊天机器人的差异" required /></label>
                <div className="flow-modal-footer"><button type="button" onClick={closeRun}>取消</button><button type="submit" className="primary" disabled={busy}>{busy ? `正在执行 ${selectedWorkflow.steps.length} 个步骤…` : `▶ 开始运行（${selectedWorkflow.steps.length} 步）`}</button></div>
              </>
            ) : (
              <div className="flow-result-view">
                <div className="flow-result-summary"><i>✓</i><div><strong>工作流运行完成</strong><p>{runResult.steps.length} 个步骤全部完成，结果已保存到运行记录。</p></div><span>{formatDateTime(runResult.completed_at ?? runResult.created_at)}</span></div>
                <div className="flow-result-steps">{runResult.steps.map((step) => <article key={step.id}><div><i>✓</i><strong>{step.order}. {step.name}</strong><span>完成</span></div><pre>{step.output}</pre></article>)}</div>
                <div className="flow-modal-footer"><button type="button" onClick={closeRun}>关闭</button><button type="button" className="primary" onClick={() => { setRunResult(null); setRunInput('') }}>再次运行</button></div>
              </div>
            )}
          </form>
        </div>
      )}
    </main>
  )
}
