import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

import { superstaffApi } from '../api/superstaff'
import type {
  ProductionBrief,
  ProductionJob,
  ProductionScene,
  ProductionTarget,
} from '../types/contracts'
import { formatDateTime } from '../utils/jobPresentation'
import { renderLocalVideo } from '../utils/localVideoRenderer'

interface ProductionStudioPageProps {
  target: Extract<ProductionTarget, 'creative_video' | 'storyboard'>
}

type StudioPanel = 'brief' | 'storyboard' | 'quality'

const studioMeta = {
  creative_video: {
    title: '创意视频',
    eyebrow: 'LOCAL-FIRST VIDEO STUDIO',
    subtitle: '从创作简报到分镜、品牌动效、人工审核和本地成片的完整工作台。',
    icon: '视',
  },
  storyboard: {
    title: '多场景剪辑',
    eyebrow: 'STORYBOARD DIRECTOR',
    subtitle: '用镜头类型、运动、转场和时长把脚本组织成可执行的制作方案。',
    icon: '剪',
  },
} as const

const statusLabels: Record<ProductionJob['status'], string> = {
  queued: '待制作', running: '制作中', review: '待审核', ready: '已就绪', done: '已完成', failed: '失败',
}

const styleLabels: Record<ProductionBrief['visual_style'], string> = {
  editorial: '编辑部质感', minimal: '克制极简', technology: '未来科技',
}

const paceLabels: Record<ProductionBrief['pace'], string> = {
  calm: '沉稳', balanced: '均衡', fast: '快节奏',
}

function safeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '_')
}

export function ProductionStudioPage({ target }: ProductionStudioPageProps) {
  const meta = studioMeta[target]
  const [jobs, setJobs] = useState<ProductionJob[]>([])
  const [activeJob, setActiveJob] = useState<ProductionJob | null>(null)
  const [briefDraft, setBriefDraft] = useState<ProductionBrief | null>(null)
  const [sceneDraft, setSceneDraft] = useState<ProductionScene | null>(null)
  const [panel, setPanel] = useState<StudioPanel>('brief')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  function activateJob(job: ProductionJob | null) {
    setActiveJob(job)
    setBriefDraft(job ? { ...job.brief } : null)
    setSceneDraft(null)
  }

  async function loadJobs(preferredId?: string) {
    setError('')
    try {
      const list = await superstaffApi.listProductionJobs(target)
      setJobs(list)
      const preferred = list.find((job) => job.id === (preferredId ?? activeJob?.id)) ?? list[0] ?? null
      activateJob(preferred)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '制作任务加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPanel('brief')
    void loadJobs()
  }, [target])

  const metrics = useMemo(() => ({
    queued: jobs.filter((job) => job.status === 'queued').length,
    review: jobs.filter((job) => job.status === 'review').length,
    done: jobs.filter((job) => job.status === 'done').length,
    scenes: jobs.reduce((sum, job) => sum + job.scenes.length, 0),
  }), [jobs])

  const qualityChecks = useMemo(() => {
    if (!activeJob) return []
    const totalDuration = activeJob.scenes.reduce((sum, scene) => sum + scene.duration_seconds, 0)
    return [
      { label: '品牌套件完整', detail: `${activeJob.brief.brand_name} · 主色与强调色已设置`, ok: Boolean(activeJob.brief.brand_name && activeJob.brief.primary_color && activeJob.brief.accent_color) },
      { label: '镜头语言完整', detail: '每个镜头包含景别、运动与转场', ok: activeJob.scenes.length >= 4 && activeJob.scenes.every((scene) => scene.shot_type && scene.camera_motion && scene.transition) },
      { label: '时长适合短视频', detail: `当前总时长 ${totalDuration} 秒`, ok: totalDuration >= 12 && totalDuration <= 60 },
      { label: '行动引导明确', detail: activeJob.brief.call_to_action, ok: activeJob.brief.call_to_action.trim().length >= 2 },
      { label: 'AI 内容标识', detail: activeJob.brief.ai_label ? '导出画面将保留 AI 生成标识' : '尚未启用标识', ok: activeJob.brief.ai_label },
    ]
  }, [activeJob])

  function updateCurrent(updated: ProductionJob) {
    setJobs((current) => current.map((job) => job.id === updated.id ? updated : job))
    activateJob(updated)
  }

  async function perform(action: () => Promise<ProductionJob>) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const updated = await action()
      updateCurrent(updated)
      setPanel(updated.status === 'review' ? 'storyboard' : panel)
      setNotice(updated.status === 'review' ? '制作方案已生成，可以逐镜头修改和审核' : '制作方案已确认完成')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '制作任务操作失败')
    } finally {
      setBusy(false)
    }
  }

  async function saveBrief() {
    if (!activeJob || !briefDraft) return
    setBusy(true)
    setError('')
    try {
      const updated = await superstaffApi.updateProductionBrief(activeJob.id, briefDraft)
      updateCurrent(updated)
      setNotice('创作简报与品牌套件已保存')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创作简报保存失败')
    } finally {
      setBusy(false)
    }
  }

  async function saveScene() {
    if (!activeJob || !sceneDraft) return
    setBusy(true)
    setError('')
    try {
      const updated = await superstaffApi.updateProductionScene(activeJob.id, sceneDraft)
      updateCurrent(updated)
      setNotice(`镜头 ${sceneDraft.order} 已更新`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '镜头保存失败')
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
      link.download = `${safeFilename(job.title)}-${job.brief.aspect_ratio.replace(':', 'x')}.webm`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('本地高清视频已生成并开始下载')
    } catch (renderError) {
      setError(renderError instanceof Error ? renderError.message : '本地视频生成失败')
    } finally {
      setRendering(false)
    }
  }

  function downloadProductionPackage(job: ProductionJob) {
    const manifest = {
      schema_version: 1,
      product: 'superstaff-local-video-studio',
      exported_at: new Date().toISOString(),
      ai_generated: true,
      human_review_status: job.status,
      project: { id: job.id, title: job.title, brief: job.brief, script: job.script, scenes: job.scenes },
      publishing_note: '请在人工核对事实、版权、品牌和平台规范后上传。',
    }
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeFilename(job.title)}-制作包.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('制作包已导出，包含创作简报、脚本、分镜与合规状态')
  }

  if (loading) return <main className="loading-screen"><div className="loading-mark">{meta.icon}</div><p>正在加载制作任务…</p></main>

  return <main className="production-page">
    {error && <div className="error-banner" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => setError('')} aria-label="关闭错误提示">×</button></div>}
    {notice && <div className="asset-notice" role="status"><span>✓</span><p>{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="关闭通知">×</button></div>}
    <section className="production-header"><div><span className="page-breadcrumb">首页 / AI 智能创作 / {meta.title}</span><h1>{meta.title}</h1><p>{meta.subtitle}</p></div><div className="production-flow"><span>创作简报</span><i>→</i><span>脚本分镜</span><i>→</i><span>品牌渲染</span><i>→</i><span>人工审核</span></div></section>
    <section className="local-first-strip"><div><i>LOCAL</i><span><strong>默认本地运行</strong><small>规则引擎可离线使用，可选连接客户自己的 Ollama</small></span></div><div><i>SAFE</i><span><strong>发布前人工确认</strong><small>不保存平台密码，不绕过第三方平台授权</small></span></div><div><i>OWN</i><span><strong>品牌资产归客户</strong><small>颜色、文案、分镜和导出包保存在本机</small></span></div></section>
    <section className="production-metrics"><article><i>队</i><div><b>{metrics.queued}</b><small>待制作</small></div></article><article><i>审</i><div><b>{metrics.review}</b><small>待审核</small></div></article><article><i>景</i><div><b>{metrics.scenes}</b><small>已生成镜头</small></div></article><article><i>成</i><div><b>{metrics.done}</b><small>已完成</small></div></article></section>
    <section className="production-shell">
      <div className="production-job-list"><header><div><span>{meta.eyebrow}</span><h2>制作任务</h2></div><button type="button" onClick={() => void loadJobs(activeJob?.id)}>↻ 刷新</button></header>{jobs.map((job) => <button type="button" key={job.id} className={activeJob?.id === job.id ? 'active' : ''} onClick={() => activateJob(job)}><i>{meta.icon}</i><div><strong>{job.title}</strong><small>{formatDateTime(job.updated_at)} · {job.scenes.length || 0} 个镜头 · {job.brief.aspect_ratio}</small></div><em className={`production-status production-status-${job.status}`}>{statusLabels[job.status]}</em></button>)}{jobs.length === 0 && <div className="production-empty"><i>◇</i><strong>还没有制作任务</strong><p>先在“成果资产”中将一份内容送往{meta.title}。</p></div>}</div>
      <div className="production-detail">{!activeJob || !briefDraft ? <div className="production-detail-empty"><i>{meta.icon}</i><strong>选择一项制作任务</strong></div> : <>
        <div className="production-detail-head"><div><span>{meta.eyebrow} · {activeJob.id.slice(-8).toUpperCase()}</span><h2>{activeJob.title}</h2><p>{activeJob.output || '先完成创作简报，再生成脚本和镜头方案。'}</p></div><em className={`production-status production-status-${activeJob.status}`}>{statusLabels[activeJob.status]}</em></div>
        <div className="studio-panel-tabs">{([['brief', '01 创作简报'], ['storyboard', '02 分镜导演'], ['quality', '03 质量与交付']] as const).map(([value, label]) => <button type="button" key={value} className={panel === value ? 'active' : ''} onClick={() => setPanel(value)}>{label}{value === 'storyboard' && <small>{activeJob.scenes.length}</small>}</button>)}</div>

        {panel === 'brief' && <section className="creative-brief-panel">
          <header><div><span>CREATIVE DIRECTION</span><h3>告诉 AI 员工这条视频应该为谁、解决什么问题</h3></div><em>{styleLabels[briefDraft.visual_style]} · {paceLabels[briefDraft.pace]}</em></header>
          <div className="creative-brief-grid">
            <label className="wide"><span>目标受众</span><input value={briefDraft.audience} onChange={(event) => setBriefDraft({ ...briefDraft, audience: event.target.value })} /></label>
            <label className="wide"><span>传播目标</span><input value={briefDraft.objective} onChange={(event) => setBriefDraft({ ...briefDraft, objective: event.target.value })} /></label>
            <label><span>画幅</span><select value={briefDraft.aspect_ratio} onChange={(event) => setBriefDraft({ ...briefDraft, aspect_ratio: event.target.value as ProductionBrief['aspect_ratio'] })}><option value="9:16">9:16 竖屏</option><option value="16:9">16:9 横屏</option><option value="1:1">1:1 方形</option></select></label>
            <label><span>视觉风格</span><select value={briefDraft.visual_style} onChange={(event) => setBriefDraft({ ...briefDraft, visual_style: event.target.value as ProductionBrief['visual_style'] })}><option value="editorial">编辑部质感</option><option value="minimal">克制极简</option><option value="technology">未来科技</option></select></label>
            <label><span>节奏</span><select value={briefDraft.pace} onChange={(event) => setBriefDraft({ ...briefDraft, pace: event.target.value as ProductionBrief['pace'] })}><option value="calm">沉稳</option><option value="balanced">均衡</option><option value="fast">快节奏</option></select></label>
            <label><span>品牌名称</span><input value={briefDraft.brand_name} onChange={(event) => setBriefDraft({ ...briefDraft, brand_name: event.target.value })} /></label>
            <label><span>品牌主色</span><div className="color-input"><input type="color" value={briefDraft.primary_color} onChange={(event) => setBriefDraft({ ...briefDraft, primary_color: event.target.value })} /><code>{briefDraft.primary_color}</code></div></label>
            <label><span>强调色</span><div className="color-input"><input type="color" value={briefDraft.accent_color} onChange={(event) => setBriefDraft({ ...briefDraft, accent_color: event.target.value })} /><code>{briefDraft.accent_color}</code></div></label>
            <label className="wide"><span>行动引导</span><input value={briefDraft.call_to_action} onChange={(event) => setBriefDraft({ ...briefDraft, call_to_action: event.target.value })} /></label>
          </div>
          <label className="ai-label-toggle"><input type="checkbox" checked={briefDraft.ai_label} onChange={(event) => setBriefDraft({ ...briefDraft, ai_label: event.target.checked })} /><span><strong>保留 AI 生成内容标识</strong><small>导出画面显示可感知标识，并在制作包中记录来源属性。</small></span><i /></label>
          <footer><p>修改已经生成的项目后，可重新生成分镜；原始成果资产不会被覆盖。</p><button type="button" disabled={busy} onClick={() => void saveBrief()}>{busy ? '保存中…' : '保存创作简报'}</button></footer>
        </section>}

        {panel === 'storyboard' && <section className="storyboard-director-panel">
          {activeJob.script && <div className="production-script"><header><span>VIDEO SCRIPT</span><strong>完整口播脚本</strong></header><pre>{activeJob.script}</pre></div>}
          <div className="scene-board">{activeJob.scenes.map((scene) => <article key={`${activeJob.id}-${scene.order}`}><div className="scene-preview" style={{ '--scene-primary': activeJob.brief.primary_color, '--scene-accent': activeJob.brief.accent_color } as CSSProperties}><span>SCENE {scene.order.toString().padStart(2, '0')}</span><i>{scene.order}</i><small>{scene.duration_seconds}s · {scene.shot_type}</small></div><div className="scene-copy"><header><strong>{scene.title}</strong><button type="button" disabled={activeJob.status !== 'review'} onClick={() => setSceneDraft({ ...scene })}>编辑镜头</button></header><p>{scene.narration}</p><footer><span>画面：{scene.visual}</span><div><em>{scene.camera_motion}</em><em>{scene.transition}</em></div></footer></div></article>)}{activeJob.scenes.length === 0 && <div className="scene-empty"><i>＋</i><p>保存创作简报后，生成第一版脚本和分镜。</p></div>}</div>
        </section>}

        {panel === 'quality' && <section className="production-quality-panel">
          <header><div><span>PRODUCTION READINESS</span><h3>商业交付前检查</h3></div><b>{qualityChecks.filter((item) => item.ok).length}/{qualityChecks.length}</b></header>
          <div className="quality-check-grid">{qualityChecks.map((item) => <article key={item.label} className={item.ok ? 'ok' : 'warning'}><i>{item.ok ? '✓' : '!'}</i><span><strong>{item.label}</strong><small>{item.detail}</small></span></article>)}</div>
          <div className="delivery-package-card"><i>包</i><div><strong>结构化制作包</strong><p>把创作简报、脚本、逐镜头参数、AI 标识和人工审核状态一起交付，方便客户复核与二次制作。</p></div><button type="button" disabled={activeJob.scenes.length === 0} onClick={() => downloadProductionPackage(activeJob)}>导出 JSON</button></div>
        </section>}

        {rendering && <div className="local-render-progress"><span><i style={{ width: `${renderProgress}%` }} /></span><strong>正在本地渲染 {renderProgress}%</strong></div>}
        <div className="production-actions"><p>当前成片由本地品牌动效引擎生成；脚本可选由 Ollama 完成，全程不要求云端模型账号。</p>{['queued', 'failed'].includes(activeJob.status) && <button type="button" className="primary" disabled={busy} onClick={() => void perform(() => superstaffApi.runProductionJob(activeJob.id))}>{busy ? '生成中…' : '生成脚本与分镜'}</button>}{activeJob.status === 'review' && <><button type="button" disabled={busy} onClick={() => void perform(() => superstaffApi.runProductionJob(activeJob.id))}>{busy ? '生成中…' : '重新生成'}</button><button type="button" className="approve" disabled={busy} onClick={() => void perform(() => superstaffApi.approveProductionJob(activeJob.id))}>{busy ? '提交中…' : '确认方案 ✓'}</button></>}{activeJob.scenes.length > 0 && <button type="button" className="download" disabled={rendering} onClick={() => void downloadPreview(activeJob)}>{rendering ? `${renderProgress}%` : '生成本地高清 WebM'}</button>}</div>
      </>}</div>
    </section>

    {sceneDraft && <div className="flow-modal-backdrop"><form className="flow-modal scene-editor-modal" onSubmit={(event) => { event.preventDefault(); void saveScene() }}><div className="flow-modal-head"><div><span>SCENE {sceneDraft.order.toString().padStart(2, '0')}</span><h2>编辑镜头</h2></div><button type="button" onClick={() => setSceneDraft(null)}>×</button></div><div className="scene-editor-grid"><label className="wide"><span>镜头标题</span><input required value={sceneDraft.title} onChange={(event) => setSceneDraft({ ...sceneDraft, title: event.target.value })} /></label><label className="wide"><span>画面说明</span><textarea required value={sceneDraft.visual} onChange={(event) => setSceneDraft({ ...sceneDraft, visual: event.target.value })} /></label><label className="wide"><span>旁白与字幕</span><textarea required value={sceneDraft.narration} onChange={(event) => setSceneDraft({ ...sceneDraft, narration: event.target.value })} /></label><label><span>时长（秒）</span><input type="number" min="2" max="20" value={sceneDraft.duration_seconds} onChange={(event) => setSceneDraft({ ...sceneDraft, duration_seconds: Number(event.target.value) })} /></label><label><span>景别</span><select value={sceneDraft.shot_type} onChange={(event) => setSceneDraft({ ...sceneDraft, shot_type: event.target.value as ProductionScene['shot_type'] })}>{['特写', '中景', '全景', '信息图', '产品镜头'].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>镜头运动</span><select value={sceneDraft.camera_motion} onChange={(event) => setSceneDraft({ ...sceneDraft, camera_motion: event.target.value as ProductionScene['camera_motion'] })}>{['静止', '快速推进', '缓慢横移', '分层上浮', '轻推定格'].map((value) => <option key={value}>{value}</option>)}</select></label><label><span>转场</span><select value={sceneDraft.transition} onChange={(event) => setSceneDraft({ ...sceneDraft, transition: event.target.value as ProductionScene['transition'] })}>{['硬切', '闪白切入', '遮罩滑动', '叠化', '淡出'].map((value) => <option key={value}>{value}</option>)}</select></label></div><div className="flow-modal-footer"><button type="button" onClick={() => setSceneDraft(null)}>取消</button><button type="submit" className="primary" disabled={busy}>{busy ? '保存中…' : '保存镜头'}</button></div></form></div>}
  </main>
}
