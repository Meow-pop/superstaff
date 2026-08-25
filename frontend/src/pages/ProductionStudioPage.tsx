import { useEffect, useMemo, useState } from 'react'

import { superstaffApi } from '../api/superstaff'
import type { ProductionJob, ProductionTarget } from '../types/contracts'
import { renderLocalVideo } from '../utils/localVideoRenderer'
import { formatDateTime } from '../utils/jobPresentation'

interface ProductionStudioPageProps {
  target: Extract<ProductionTarget, 'creative_video' | 'storyboard'>
}

const studioMeta = {
  creative_video: {
    title: '创意视频',
    eyebrow: 'CREATIVE VIDEO STUDIO',
    subtitle: '把成果资产转换成脚本、分镜与可下载的本地演示视频。',
    icon: '视',
  },
  storyboard: {
    title: '多场景剪辑',
    eyebrow: 'STORYBOARD STUDIO',
    subtitle: '将脚本拆成画面、旁白和时长明确的多场景制作方案。',
    icon: '剪',
  },
} as const

const statusLabels: Record<ProductionJob['status'], string> = {
  queued: '待制作', running: '制作中', review: '待审核', ready: '已就绪', done: '已完成', failed: '失败',
}

export function ProductionStudioPage({ target }: ProductionStudioPageProps) {
  const meta = studioMeta[target]
  const [jobs, setJobs] = useState<ProductionJob[]>([])
  const [activeJob, setActiveJob] = useState<ProductionJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadJobs(preferredId?: string) {
    setError('')
    try {
      const list = await superstaffApi.listProductionJobs(target)
      setJobs(list)
      setActiveJob((current) => list.find((job) => job.id === (preferredId ?? current?.id)) ?? list[0] ?? null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '制作任务加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadJobs()
  }, [target])

  const metrics = useMemo(() => ({
    queued: jobs.filter((job) => job.status === 'queued').length,
    review: jobs.filter((job) => job.status === 'review').length,
    done: jobs.filter((job) => job.status === 'done').length,
    scenes: jobs.reduce((sum, job) => sum + job.scenes.length, 0),
  }), [jobs])

  async function perform(action: () => Promise<ProductionJob>) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const updated = await action()
      setJobs((current) => current.map((job) => job.id === updated.id ? updated : job))
      setActiveJob(updated)
      setNotice(updated.status === 'review' ? '制作方案已生成，请检查场景与旁白' : '制作方案已确认完成')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '制作任务操作失败')
    } finally {
      setBusy(false)
    }
  }

  async function downloadPreview(job: ProductionJob) {
    setRendering(true)
    setRenderProgress(0)
    setError('')
    try {
      const blob = await renderLocalVideo(job, setRenderProgress)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${job.title.replace(/[\\/:*?"<>|]/g, '_')}-演示版.webm`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('本地演示视频已生成并开始下载')
    } catch (renderError) {
      setError(renderError instanceof Error ? renderError.message : '本地视频生成失败')
    } finally {
      setRendering(false)
    }
  }

  if (loading) return <main className="loading-screen"><div className="loading-mark">{meta.icon}</div><p>正在加载制作任务…</p></main>

  return <main className="production-page">
    {error && <div className="error-banner" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => setError('')} aria-label="关闭错误提示">×</button></div>}
    {notice && <div className="asset-notice" role="status"><span>✓</span><p>{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="关闭通知">×</button></div>}
    <section className="production-header"><div><span className="page-breadcrumb">首页 / AI 智能创作 / {meta.title}</span><h1>{meta.title}</h1><p>{meta.subtitle}</p></div><div className="production-flow"><span>成果资产</span><i>→</i><span>脚本分镜</span><i>→</i><span>审核下载</span></div></section>
    <section className="production-metrics"><article><i>队</i><div><b>{metrics.queued}</b><small>待制作</small></div></article><article><i>审</i><div><b>{metrics.review}</b><small>待审核</small></div></article><article><i>景</i><div><b>{metrics.scenes}</b><small>已生成场景</small></div></article><article><i>成</i><div><b>{metrics.done}</b><small>已完成</small></div></article></section>
    <section className="production-shell">
      <div className="production-job-list"><header><div><span>{meta.eyebrow}</span><h2>制作任务</h2></div><button type="button" onClick={() => void loadJobs(activeJob?.id)}>↻ 刷新</button></header>{jobs.map((job) => <button type="button" key={job.id} className={activeJob?.id === job.id ? 'active' : ''} onClick={() => setActiveJob(job)}><i>{meta.icon}</i><div><strong>{job.title}</strong><small>{formatDateTime(job.updated_at)} · {job.scenes.length || 0} 个场景</small></div><em className={`production-status production-status-${job.status}`}>{statusLabels[job.status]}</em></button>)}{jobs.length === 0 && <div className="production-empty"><i>◇</i><strong>还没有制作任务</strong><p>先在“成果资产”中将一份内容送往{meta.title}。</p></div>}</div>
      <div className="production-detail">{!activeJob ? <div className="production-detail-empty"><i>{meta.icon}</i><strong>选择一项制作任务</strong></div> : <><div className="production-detail-head"><div><span>{meta.eyebrow} · {activeJob.id.slice(-8).toUpperCase()}</span><h2>{activeJob.title}</h2><p>{activeJob.output || '成果已进入制作队列，点击开始生成脚本与场景方案。'}</p></div><em className={`production-status production-status-${activeJob.status}`}>{statusLabels[activeJob.status]}</em></div>{activeJob.script && <div className="production-script"><header><span>VIDEO SCRIPT</span><strong>口播脚本</strong></header><pre>{activeJob.script}</pre></div>}<div className="scene-board">{activeJob.scenes.map((scene) => <article key={`${activeJob.id}-${scene.order}`}><div className="scene-preview"><span>SCENE {scene.order.toString().padStart(2, '0')}</span><i>{scene.order}</i><small>{scene.duration_seconds}s</small></div><div className="scene-copy"><header><strong>{scene.title}</strong><span>{scene.visual}</span></header><p>{scene.narration}</p></div></article>)}{activeJob.scenes.length === 0 && <div className="scene-empty"><i>＋</i><p>执行任务后会自动生成四个场景。</p></div>}</div>{rendering && <div className="local-render-progress"><span><i style={{ width: `${renderProgress}%` }} /></span><strong>正在本地渲染 {renderProgress}%</strong></div>}<div className="production-actions"><p>本地 WebM 仅用于演示流程；高质量画面与配音将在模型适配层接入。</p>{['queued', 'failed'].includes(activeJob.status) && <button type="button" className="primary" disabled={busy} onClick={() => void perform(() => superstaffApi.runProductionJob(activeJob.id))}>{busy ? '生成中…' : '生成脚本与分镜'}</button>}{activeJob.status === 'review' && <button type="button" className="approve" disabled={busy} onClick={() => void perform(() => superstaffApi.approveProductionJob(activeJob.id))}>{busy ? '提交中…' : '确认方案 ✓'}</button>}{activeJob.scenes.length > 0 && <button type="button" className="download" disabled={rendering} onClick={() => void downloadPreview(activeJob)}>{rendering ? `${renderProgress}%` : '下载演示 WebM'}</button>}</div></>}</div>
    </section>
  </main>
}
