import { useEffect, useMemo, useState } from 'react'

import { superstaffApi } from '../api/superstaff'
import type { AssetHandoff, AssetHandoffTarget, AssetRecord, AssetStatus } from '../types/contracts'
import { formatDateTime } from '../utils/jobPresentation'

type SourceFilter = 'all' | 'agent_job' | 'workflow_run'
type StatusFilter = 'all' | AssetStatus

const targetMeta: Record<AssetHandoffTarget, { label: string; icon: string; description: string }> = {
  creative_video: { label: '创意视频', icon: '视', description: '进入视频生成任务队列' },
  storyboard: { label: '多场景剪辑', icon: '剪', description: '作为脚本进入场景编排' },
  publisher: { label: '发布管家', icon: '发', description: '进入内容发布准备队列' },
}

export function AssetCenterPage() {
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [handoffs, setHandoffs] = useState<AssetHandoff[]>([])
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [editTitle, setEditTitle] = useState('')
  const [editTags, setEditTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  function selectAsset(asset: AssetRecord | null) {
    setSelectedAsset(asset)
    setEditTitle(asset?.title ?? '')
    setEditTags(asset?.tags.join('、') ?? '')
    setNotice('')
  }

  async function loadData(preferredId?: string) {
    setError('')
    try {
      const [assetList, handoffList] = await Promise.all([
        superstaffApi.listAssets(),
        superstaffApi.listAssetHandoffs(),
      ])
      setAssets(assetList)
      setHandoffs(handoffList)
      const preferred = assetList.find((asset) => asset.id === (preferredId ?? selectedAsset?.id)) ?? assetList[0] ?? null
      selectAsset(preferred)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '成果资产加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredAssets = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return assets.filter((asset) => {
      const matchesSource = sourceFilter === 'all' || asset.source_type === sourceFilter
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
      const matchesQuery = !keyword || `${asset.title} ${asset.content} ${asset.source_name} ${asset.tags.join(' ')}`.toLowerCase().includes(keyword)
      return matchesSource && matchesStatus && matchesQuery
    })
  }, [assets, query, sourceFilter, statusFilter])

  const selectedHandoffs = useMemo(
    () => handoffs.filter((handoff) => handoff.asset_id === selectedAsset?.id),
    [handoffs, selectedAsset?.id],
  )

  async function saveMetadata() {
    if (!selectedAsset) return
    setBusy(true)
    setError('')
    try {
      const updated = await superstaffApi.updateAsset(selectedAsset.id, {
        title: editTitle.trim(),
        tags: editTags.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean),
      })
      setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset))
      selectAsset(updated)
      setNotice('资产信息已保存')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  async function toggleArchive() {
    if (!selectedAsset) return
    setBusy(true)
    setError('')
    try {
      const nextStatus: AssetStatus = selectedAsset.status === 'active' ? 'archived' : 'active'
      const updated = await superstaffApi.updateAsset(selectedAsset.id, { status: nextStatus })
      setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset))
      selectAsset(updated)
      setNotice(nextStatus === 'archived' ? '资产已归档，可在“已归档”中恢复' : '资产已恢复')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '状态更新失败')
    } finally {
      setBusy(false)
    }
  }

  async function createHandoff(target: AssetHandoffTarget) {
    if (!selectedAsset) return
    setBusy(true)
    setError('')
    try {
      const created = await superstaffApi.createAssetHandoff(selectedAsset.id, target, `由成果资产中心送往${targetMeta[target].label}`)
      setHandoffs((current) => [created, ...current])
      setNotice(`已进入“${targetMeta[target].label}”任务队列`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创建流转任务失败')
    } finally {
      setBusy(false)
    }
  }

  async function copyContent() {
    if (!selectedAsset) return
    try {
      await navigator.clipboard.writeText(selectedAsset.content)
      setNotice('成果正文已复制')
    } catch {
      setError('浏览器未允许复制，请手动选择正文复制')
    }
  }

  if (loading) {
    return <main className="loading-screen"><div className="loading-mark">果</div><p>正在整理成果资产…</p></main>
  }

  return (
    <main className="asset-center-page">
      {error && <div className="error-banner" role="alert"><span>!</span><p>{error}</p><button type="button" aria-label="关闭错误提示" onClick={() => setError('')}>×</button></div>}
      {notice && <div className="asset-notice" role="status"><span>✓</span><p>{notice}</p><button type="button" aria-label="关闭通知" onClick={() => setNotice('')}>×</button></div>}

      <section className="asset-page-header">
        <div><span className="page-breadcrumb">首页 / AI 智能创作 / 素材管家</span><h1>成果资产</h1><p>自动沉淀 Agent 与工作流交付物，并将有效成果继续送往内容生产模块。</p></div>
        <div className="asset-header-flow"><span>任务执行</span><i>→</i><span>成果沉淀</span><i>→</i><span>跨模块复用</span></div>
      </section>

      <section className="asset-metrics">
        <article><i className="asset-metric-blue">果</i><div><b>{assets.filter((item) => item.status === 'active').length}</b><small>可用成果</small></div></article>
        <article><i className="asset-metric-purple">AI</i><div><b>{assets.filter((item) => item.source_type === 'agent_job').length}</b><small>Agent 交付</small></div></article>
        <article><i className="asset-metric-green">流</i><div><b>{assets.filter((item) => item.source_type === 'workflow_run').length}</b><small>工作流成果</small></div></article>
        <article><i className="asset-metric-orange">转</i><div><b>{handoffs.length}</b><small>跨模块流转</small></div></article>
      </section>

      <section className="asset-library">
        <div className="asset-toolbar">
          <div className="asset-source-tabs">{([['all', '全部成果'], ['agent_job', 'Agent 交付'], ['workflow_run', '工作流成果']] as const).map(([value, label]) => <button type="button" key={value} className={sourceFilter === value ? 'active' : ''} onClick={() => setSourceFilter(value)}>{label}</button>)}</div>
          <div className="asset-search-tools"><select aria-label="按资产状态筛选" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="active">使用中</option><option value="archived">已归档</option><option value="all">全部状态</option></select><input aria-label="搜索成果资产" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、标签或正文" /></div>
        </div>

        <div className="asset-library-layout">
          <section className="asset-card-list">
            {filteredAssets.map((asset) => <button type="button" key={asset.id} className={`asset-list-card ${selectedAsset?.id === asset.id ? 'active' : ''}`} onClick={() => selectAsset(asset)}>
              <div className={`asset-kind-icon ${asset.source_type === 'agent_job' ? 'agent' : 'workflow'}`}>{asset.source_type === 'agent_job' ? 'AI' : '流'}</div>
              <div className="asset-list-copy"><div><strong>{asset.title}</strong>{asset.status === 'archived' && <em>已归档</em>}</div><p>{asset.content}</p><footer><span>{asset.source_name}</span><time>{formatDateTime(asset.updated_at)}</time></footer></div>
            </button>)}
            {filteredAssets.length === 0 && <div className="asset-empty"><i>◇</i><strong>暂无符合条件的成果</strong><p>运行 Agent 或工作流后，成果会自动出现在这里。</p></div>}
          </section>

          <section className="asset-detail-panel">
            {!selectedAsset ? <div className="asset-detail-empty"><i>果</i><strong>选择一份成果开始复用</strong></div> : <>
              <div className="asset-detail-head"><div><span>{selectedAsset.kind.toUpperCase()} · {selectedAsset.id.slice(-8).toUpperCase()}</span><h2>{selectedAsset.title}</h2><p>来源：{selectedAsset.source_name} · {formatDateTime(selectedAsset.created_at)}</p></div><em className={selectedAsset.status}>{selectedAsset.status === 'active' ? '使用中' : '已归档'}</em></div>
              <div className="asset-editor"><label><span>成果名称</span><input aria-label="成果名称" minLength={2} maxLength={120} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></label><label><span>标签（使用逗号或顿号分隔）</span><input aria-label="成果标签" value={editTags} onChange={(event) => setEditTags(event.target.value)} /></label><button type="button" disabled={busy || editTitle.trim().length < 2} onClick={() => void saveMetadata()}>保存信息</button></div>
              <div className="asset-content-preview"><header><span>成果正文</span><button type="button" onClick={() => void copyContent()}>复制全文</button></header><pre>{selectedAsset.content}</pre></div>
              <div className="asset-handoff-section"><div className="asset-section-title"><div><span>CROSS-MODULE HANDOFF</span><h3>继续交给其他模块</h3></div><small>只创建可追踪任务，不会未经确认直接发布</small></div><div className="asset-handoff-grid">{(Object.entries(targetMeta) as Array<[AssetHandoffTarget, typeof targetMeta[AssetHandoffTarget]]>).map(([target, meta]) => <button type="button" key={target} disabled={busy || selectedAsset.status === 'archived'} onClick={() => void createHandoff(target)}><i>{meta.icon}</i><span><strong>{meta.label}</strong><small>{meta.description}</small></span><b>＋</b></button>)}</div></div>
              <div className="asset-handoff-history"><header><strong>流转记录</strong><span>{selectedHandoffs.length} 条</span></header>{selectedHandoffs.map((handoff) => <article key={handoff.id}><i>{targetMeta[handoff.target].icon}</i><div><strong>{targetMeta[handoff.target].label}</strong><small>{handoff.note || '已创建任务'}</small></div><em>{handoff.status === 'queued' ? '已排队' : handoff.status}</em><time>{formatDateTime(handoff.created_at)}</time></article>)}{selectedHandoffs.length === 0 && <p>还没有流转记录。</p>}</div>
              <div className="asset-detail-footer"><p>归档不会删除数据，之后仍可恢复。</p><button type="button" disabled={busy} onClick={() => void toggleArchive()}>{selectedAsset.status === 'active' ? '归档成果' : '恢复成果'}</button></div>
            </>}
          </section>
        </div>
      </section>
    </main>
  )
}
