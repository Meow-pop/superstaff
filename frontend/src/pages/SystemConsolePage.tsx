import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { superstaffApi } from '../api/superstaff'
import type {
  AuditEvent,
  ProviderConfig,
  SystemDiagnostics,
  WorkspaceSettings,
} from '../types/contracts'
import { formatDateTime } from '../utils/jobPresentation'


interface SystemConsolePageProps {
  onWorkspaceUpdated: (workspace: WorkspaceSettings) => void
}


const providerLabels = {
  language: '语言与推理',
  image: '图片生成',
  voice: '语音合成',
  video: '视频制作',
  publishing: '平台发布',
} as const


function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(2)} MB`
}


export function SystemConsolePage({ onWorkspaceUpdated }: SystemConsolePageProps) {
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null)
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null)
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [workspaceName, setWorkspaceName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [demoMode, setDemoMode] = useState(true)
  const [approvalRequired, setApprovalRequired] = useState(true)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      const [workspaceData, diagnosticData, providerData, auditData] = await Promise.all([
        superstaffApi.getWorkspace(),
        superstaffApi.getDiagnostics(),
        superstaffApi.listProviders(),
        superstaffApi.listAuditEvents(80),
      ])
      setWorkspace(workspaceData)
      setDiagnostics(diagnosticData)
      setProviders(providerData)
      setAuditEvents(auditData)
      setWorkspaceName(workspaceData.workspace_name)
      setOwnerName(workspaceData.owner_name)
      setDemoMode(workspaceData.demo_mode)
      setApprovalRequired(workspaceData.human_approval_required)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '系统控制台加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const metrics = useMemo(() => ({
    tasks: (diagnostics?.counts.jobs ?? 0) + (diagnostics?.counts.workflow_runs ?? 0),
    assets: diagnostics?.counts.assets ?? 0,
    production: diagnostics?.counts.production_jobs ?? 0,
    audit: diagnostics?.counts.audit_events ?? 0,
  }), [diagnostics])

  async function saveWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const updated = await superstaffApi.updateWorkspace({
        workspace_name: workspaceName,
        owner_name: ownerName,
        demo_mode: demoMode,
        human_approval_required: approvalRequired,
      })
      setWorkspace(updated)
      onWorkspaceUpdated(updated)
      setNotice('工作区设置已保存')
      const [diagnosticData, auditData] = await Promise.all([
        superstaffApi.getDiagnostics(),
        superstaffApi.listAuditEvents(80),
      ])
      setDiagnostics(diagnosticData)
      setAuditEvents(auditData)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '工作区保存失败')
    } finally {
      setBusy(false)
    }
  }

  async function downloadBackup() {
    setBusy(true)
    setError('')
    try {
      const blob = await superstaffApi.downloadBackup()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `superstaff-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('全量 JSON 备份已开始下载')
      setAuditEvents(await superstaffApi.listAuditEvents(80))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '备份下载失败')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <main className="loading-screen"><div className="loading-mark">控</div><p>正在检查系统状态…</p></main>

  return <main className="system-console-page">
    {error && <div className="error-banner" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => setError('')} aria-label="关闭错误提示">×</button></div>}
    {notice && <div className="asset-notice" role="status"><span>✓</span><p>{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="关闭通知">×</button></div>}

    <section className="system-console-header">
      <div><span className="page-breadcrumb">首页 / 系统控制台</span><h1>系统控制台</h1><p>集中维护工作区、能力适配、运行健康、审计记录和数据备份。</p></div>
      <div className={`system-health-pill ${diagnostics?.status === 'ok' ? 'healthy' : 'degraded'}`}><i /> <span><b>{diagnostics?.status === 'ok' ? '系统运行正常' : '系统需要检查'}</b><small>Superstaff {diagnostics?.version}</small></span></div>
    </section>

    <section className="system-metrics">
      <article><i>任</i><div><b>{metrics.tasks}</b><small>任务与运行</small></div></article>
      <article><i>资</i><div><b>{metrics.assets}</b><small>成果资产</small></div></article>
      <article><i>制</i><div><b>{metrics.production}</b><small>制作任务</small></div></article>
      <article><i>审</i><div><b>{metrics.audit}</b><small>操作审计</small></div></article>
    </section>

    <section className="system-console-grid">
      <form className="system-panel workspace-settings-panel" onSubmit={saveWorkspace}>
        <header><div><span>WORKSPACE</span><h2>工作区设置</h2></div><em>{workspace?.demo_mode ? '演示模式' : '正式模式'}</em></header>
        <div className="workspace-form-grid">
          <label><span>工作区名称</span><input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} minLength={2} maxLength={80} required /></label>
          <label><span>管理员称呼</span><input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} minLength={2} maxLength={40} required /></label>
        </div>
        <label className="system-toggle"><input type="checkbox" checked={demoMode} onChange={(event) => setDemoMode(event.target.checked)} /><span><b>演示执行模式</b><small>没有模型密钥时仍能完整演示业务闭环。</small></span><i /></label>
        <label className="system-toggle"><input type="checkbox" checked={approvalRequired} onChange={(event) => setApprovalRequired(event.target.checked)} /><span><b>关键动作需要人工确认</b><small>保留成果验收和发布前确认，避免无监督外部操作。</small></span><i /></label>
        <footer><small>最后更新：{workspace ? formatDateTime(workspace.updated_at) : '—'}</small><button type="submit" disabled={busy}>{busy ? '保存中…' : '保存设置'}</button></footer>
      </form>

      <section className="system-panel diagnostic-panel">
        <header><div><span>DIAGNOSTICS</span><h2>运行诊断</h2></div><button type="button" onClick={() => void load()}>↻</button></header>
        <dl><div><dt>API 版本</dt><dd>{diagnostics?.version}</dd></div><div><dt>运行时</dt><dd>{diagnostics?.runtime}</dd></div><div><dt>数据存储</dt><dd>{diagnostics?.storage}</dd></div><div><dt>数据库</dt><dd className={diagnostics?.database_ready ? 'ok' : 'bad'}>{diagnostics?.database_ready ? '可读写' : '异常'}</dd></div><div><dt>数据库大小</dt><dd>{formatBytes(diagnostics?.database_size_bytes ?? 0)}</dd></div><div><dt>检查时间</dt><dd>{diagnostics ? formatDateTime(diagnostics.checked_at) : '—'}</dd></div></dl>
        <div className="backup-action"><div><i>↓</i><span><b>导出全量数据备份</b><small>包含任务、成果、账号、设置与审计，不包含任何模型密钥。</small></span></div><button type="button" disabled={busy} onClick={() => void downloadBackup()}>下载 JSON</button></div>
      </section>
    </section>

    <section className="system-panel provider-panel">
      <header><div><span>CAPABILITY ADAPTERS</span><h2>能力与供应商</h2></div><small>凭据只从服务端环境读取</small></header>
      <div className="provider-grid">{providers.map((provider) => <article key={provider.id}><div className="provider-card-head"><i>{providerLabels[provider.category].slice(0, 1)}</i><span><small>{providerLabels[provider.category]}</small><strong>{provider.display_name}</strong></span><em className={`provider-mode provider-mode-${provider.mode}`}>{provider.mode === 'active' ? '可用' : provider.mode === 'demo' ? '演示' : '待接入'}</em></div><p>{provider.description}</p><footer><code>{provider.adapter}</code>{provider.credential_env && <span className={provider.credential_detected ? 'detected' : ''}>{provider.credential_detected ? '已检测凭据' : provider.credential_env}</span>}</footer></article>)}</div>
    </section>

    <section className="system-panel audit-panel">
      <header><div><span>OPERATION AUDIT</span><h2>最近操作记录</h2></div><small>只记录成功的写操作，不记录请求正文和密钥</small></header>
      <div className="audit-table"><div className="audit-table-head"><span>时间</span><span>动作</span><span>资源</span><span>摘要</span><span>状态</span></div>{auditEvents.map((event) => <div className="audit-table-row" key={event.id}><span>{formatDateTime(event.created_at)}</span><span><b>{event.action.toUpperCase()}</b></span><span>{event.resource}{event.resource_id ? ` / ${event.resource_id.slice(0, 12)}` : ''}</span><span>{event.summary}</span><span className="audit-ok">{event.detail.status_code ?? 'OK'}</span></div>)}{auditEvents.length === 0 && <div className="audit-empty">完成一次任务、设置或发布排期后，操作记录会出现在这里。</div>}</div>
    </section>
  </main>
}
