import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { superstaffApi } from '../api/superstaff'
import type {
  ProductionJob,
  SocialAccount,
  SocialPlatform,
} from '../types/contracts'
import { formatDateTime } from '../utils/jobPresentation'

type PublishingVariant = 'accounts' | 'matrix' | 'publisher'

interface PublishingCenterPageProps {
  variant: PublishingVariant
}

const pageMeta: Record<PublishingVariant, { title: string; eyebrow: string; subtitle: string }> = {
  accounts: { title: '账号矩阵', eyebrow: 'ACCOUNT MATRIX', subtitle: '统一管理内容账号元数据、演示状态与后续平台授权。' },
  matrix: { title: '短视频矩阵', eyebrow: 'VIDEO MATRIX', subtitle: '将成果、账号和发布时间组织成可追踪的矩阵发布计划。' },
  publisher: { title: '本地发布管家', eyebrow: 'PUBLISHING QUEUE', subtitle: '发布前选择账号和时间；没有正式授权时不会直接向平台发送内容。' },
}

const platformTone: Record<SocialPlatform, string> = {
  抖音: 'douyin', 小红书: 'red', 视频号: 'wechat', 快手: 'kuaishou', B站: 'bilibili',
}

function localDateTimeInput(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function PublishingCenterPage({ variant }: PublishingCenterPageProps) {
  const meta = pageMeta[variant]
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [jobs, setJobs] = useState<ProductionJob[]>([])
  const [activeJob, setActiveJob] = useState<ProductionJob | null>(null)
  const [accountId, setAccountId] = useState('')
  const [scheduledAt, setScheduledAt] = useState(localDateTimeInput)
  const [showCreate, setShowCreate] = useState(false)
  const [platform, setPlatform] = useState<SocialPlatform>('抖音')
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function loadData(preferredId?: string) {
    setError('')
    try {
      const [accountList, jobList] = await Promise.all([
        superstaffApi.listAccounts(),
        superstaffApi.listProductionJobs('publisher'),
      ])
      setAccounts(accountList)
      setJobs(jobList)
      const selected = jobList.find((job) => job.id === (preferredId ?? activeJob?.id)) ?? jobList[0] ?? null
      setActiveJob(selected)
      setAccountId(selected?.account_id ?? accountList.find((account) => account.status !== 'disabled')?.id ?? '')
      if (selected?.scheduled_at) setScheduledAt(selected.scheduled_at.slice(0, 16))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '账号与发布任务加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const metrics = useMemo(() => ({
    activeAccounts: accounts.filter((account) => account.status !== 'disabled').length,
    followers: accounts.reduce((sum, account) => sum + account.follower_count, 0),
    queued: jobs.filter((job) => job.status === 'queued').length,
    ready: jobs.filter((job) => job.status === 'ready').length,
  }), [accounts, jobs])

  function selectJob(job: ProductionJob) {
    setActiveJob(job)
    setAccountId(job.account_id ?? accounts.find((account) => account.status !== 'disabled')?.id ?? '')
    setScheduledAt(job.scheduled_at?.slice(0, 16) ?? localDateTimeInput())
    setNotice('')
  }

  async function scheduleJob() {
    if (!activeJob || !accountId || !scheduledAt) return
    setBusy(true)
    setError('')
    try {
      const updated = await superstaffApi.scheduleProductionJob(activeJob.id, accountId, scheduledAt)
      setJobs((current) => current.map((job) => job.id === updated.id ? updated : job))
      selectJob(updated)
      setNotice('发布计划已保存；正式授权前不会向外部平台发送内容')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '发布计划保存失败')
    } finally {
      setBusy(false)
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await superstaffApi.createAccount({ platform, display_name: displayName, handle })
      setAccounts((current) => [...current, created])
      setAccountId(created.id)
      setDisplayName('')
      setHandle('')
      setShowCreate(false)
      setNotice('演示账号已加入矩阵；正式发布仍需平台授权')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '账号创建失败')
    } finally {
      setBusy(false)
    }
  }

  async function toggleAccount(account: SocialAccount) {
    setBusy(true)
    setError('')
    try {
      const status = account.status === 'disabled' ? 'demo' : 'disabled'
      const updated = await superstaffApi.updateAccountStatus(account.id, status)
      setAccounts((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(status === 'disabled' ? '账号已停用' : '账号已恢复为演示状态')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '账号状态更新失败')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <main className="loading-screen"><div className="loading-mark">矩</div><p>正在加载账号与发布计划…</p></main>

  return <main className="publishing-page">
    {error && <div className="error-banner" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => setError('')} aria-label="关闭错误提示">×</button></div>}
    {notice && <div className="asset-notice" role="status"><span>✓</span><p>{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="关闭通知">×</button></div>}
    <section className="publishing-header"><div><span className="page-breadcrumb">首页 / AI 智能创作 / {meta.title}</span><h1>{meta.title}</h1><p>{meta.subtitle}</p></div><button type="button" onClick={() => setShowCreate(true)}>＋ 添加演示账号</button></section>
    <section className="publishing-metrics"><article><i>号</i><div><b>{metrics.activeAccounts}</b><small>可用账号</small></div></article><article><i>粉</i><div><b>{metrics.followers.toLocaleString('zh-CN')}</b><small>演示粉丝总量</small></div></article><article><i>队</i><div><b>{metrics.queued}</b><small>待设置计划</small></div></article><article><i>排</i><div><b>{metrics.ready}</b><small>已排期</small></div></article></section>
    <section className="account-matrix-section"><header><div><span>ACCOUNT MATRIX</span><h2>内容账号</h2></div><small>演示状态不代表已获得平台发布权限</small></header><div className="account-card-grid">{accounts.map((account) => <article key={account.id} className={`account-card account-${platformTone[account.platform]} ${account.status === 'disabled' ? 'disabled' : ''}`}><div className="account-platform"><i>{account.platform.slice(0, 1)}</i><span><strong>{account.platform}</strong><small>{account.status === 'connected' ? '已授权' : account.status === 'disabled' ? '已停用' : '演示账号'}</small></span><em /></div><h3>{account.display_name}</h3><p>@{account.handle}</p><footer><span><b>{account.follower_count.toLocaleString('zh-CN')}</b> 粉丝</span><button type="button" disabled={busy} onClick={() => void toggleAccount(account)}>{account.status === 'disabled' ? '恢复' : '停用'}</button></footer></article>)}</div></section>
    <section className="publishing-shell"><div className="publishing-list"><header><div><span>{meta.eyebrow}</span><h2>发布任务</h2></div><b>{jobs.length}</b></header>{jobs.map((job) => <button type="button" key={job.id} className={activeJob?.id === job.id ? 'active' : ''} onClick={() => selectJob(job)}><i>发</i><div><strong>{job.title}</strong><small>{job.account_name || '尚未选择账号'} · {formatDateTime(job.updated_at)}</small></div><em className={`production-status production-status-${job.status}`}>{job.status === 'ready' ? '已排期' : '待设置'}</em></button>)}{jobs.length === 0 && <div className="publishing-empty"><i>◇</i><strong>还没有发布任务</strong><p>在成果资产中选择“发布管家”，任务会自动进入这里。</p></div>}</div><div className="publishing-detail">{!activeJob ? <div className="publishing-detail-empty"><i>发</i><strong>选择发布任务</strong></div> : <><div className="publishing-detail-head"><span>PUBLISH TASK · {activeJob.id.slice(-8).toUpperCase()}</span><h2>{activeJob.title}</h2><p>{activeJob.output || '内容已经进入发布准备队列，请选择账号和计划时间。'}</p></div><div className="publish-safety-note"><i>!</i><div><strong>发布安全边界</strong><p>当前只保存计划，不会自动登录、私信或向任何外部平台发布。</p></div></div><div className="publish-form"><label><span>发布账号</span><select aria-label="选择发布账号" value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">请选择账号</option>{accounts.filter((account) => account.status !== 'disabled').map((account) => <option key={account.id} value={account.id}>{account.platform} · {account.display_name}</option>)}</select></label><label><span>计划时间</span><input aria-label="计划发布时间" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label></div>{activeJob.status === 'ready' && <div className="publish-plan-summary"><i>✓</i><div><strong>发布计划已就绪</strong><p>{activeJob.account_name} · {activeJob.scheduled_at ? formatDateTime(activeJob.scheduled_at) : ''}</p></div></div>}<div className="publish-actions"><p>接入正式平台 API 后，这里会增加发布前人工确认和平台回执。</p><button type="button" disabled={busy || !accountId || !scheduledAt} onClick={() => void scheduleJob()}>{busy ? '保存中…' : activeJob.status === 'ready' ? '更新发布计划' : '保存发布计划'}</button></div></>}</div></section>
    {showCreate && <div className="flow-modal-backdrop"><form className="flow-modal account-create-modal" onSubmit={createAccount}><div className="flow-modal-head"><div><span>ACCOUNT PROFILE</span><h2>添加演示账号</h2></div><button type="button" onClick={() => setShowCreate(false)}>×</button></div><label><span>平台</span><select value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)}>{(['抖音','小红书','视频号','快手','B站'] as SocialPlatform[]).map((item) => <option key={item}>{item}</option>)}</select></label><label><span>账号名称</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={80} required placeholder="如：超级员工实验室" /></label><label><span>账号标识</span><input value={handle} onChange={(event) => setHandle(event.target.value)} minLength={2} maxLength={80} required placeholder="如：superstaff_lab" /></label><p>这里只保存账号资料，不保存密码、Cookie 或平台令牌。</p><div className="flow-modal-footer"><button type="button" onClick={() => setShowCreate(false)}>取消</button><button type="submit" className="primary" disabled={busy}>{busy ? '保存中…' : '添加账号'}</button></div></form></div>}
  </main>
}
