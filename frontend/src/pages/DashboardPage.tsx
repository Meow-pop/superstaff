import { useEffect, useState } from 'react'

import { superstaffApi } from '../api/superstaff'
import { CapabilityIcon } from '../components/CapabilityIcon'
import type { Employee, Job } from '../types/contracts'
import type { PageKey } from '../App'

interface DashboardPageProps {
  onNavigate: (page: PageKey) => void
}

const mainCapabilities: Array<{
  key: PageKey
  title: string
  subtitle: string
  icon: 'agent' | 'workflow' | 'trend'
  tone: string
  action: string
}> = [
  {
    key: 'agent',
    title: 'Agent智能体',
    subtitle: '自主感知 · 智能规划 · 闭环执行，拥有一个 AI Agent 生产力',
    icon: 'agent',
    tone: 'blue',
    action: '开始发布工作任务',
  },
  {
    key: 'workflow',
    title: '自动工作流',
    subtitle: '规则驱动、智能编排，让复杂业务像流水线一样自动完成',
    icon: 'workflow',
    tone: 'purple',
    action: '开始创建工作流',
  },
  {
    key: 'trend',
    title: '一键追爆',
    subtitle: '智能抓取热点素材，快速复刻并生成适配多平台的内容',
    icon: 'trend',
    tone: 'cyan',
    action: '开始复制爆款视频',
  },
]

const businessCapabilities: Array<{
  key: PageKey
  title: string
  subtitle: string
  icon: string
  tone: string
  tags: string[]
}> = [
  {
    key: 'brain',
    title: '企业大脑',
    subtitle: '打造适配企业的专属“智能中枢”',
    icon: '◇',
    tone: 'indigo',
    tags: ['企业知识库'],
  },
  {
    key: 'assistant',
    title: '快速训练专属 AI 智能体',
    subtitle: '沉淀企业知识，让员工越用越懂业务',
    icon: '◎',
    tone: 'violet',
    tags: ['知识库', '角色训练'],
  },
  {
    key: 'matrix',
    title: '短视频矩阵',
    subtitle: '多账号管理，自动发布，打造短视频流量矩阵',
    icon: '▦',
    tone: 'mint',
    tags: ['账号管理', '矩阵任务', '数据总览'],
  },
  {
    key: 'keyword',
    title: 'AI 搜索拓客',
    subtitle: '多渠道按需检索，沉淀可持续跟进的业务线索',
    icon: '⌖',
    tone: 'pink',
    tags: ['关键词拓客'],
  },
]

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([superstaffApi.listEmployees(), superstaffApi.listJobs()])
      .then(([employeeList, jobList]) => {
        if (cancelled) return
        setEmployees(employeeList)
        setJobs(jobList)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="dashboard-page">
      <section className="system-banner">
        <div className="banner-ai-cube" aria-hidden="true">AI</div>
        <div className="banner-copy">
          <h1>AI <em>超级员工</em>系统</h1>
          <p>基础岗位全托管，告别重复劳动与人力内耗</p>
        </div>
        <div className="banner-grid" aria-hidden="true" />
      </section>

      <section className="capability-main-grid">
        {mainCapabilities.map((capability) => (
          <article className={`capability-main capability-${capability.tone}`} key={capability.key}>
            <div className="capability-main-copy">
              <h2>{capability.title}</h2>
              <p>{capability.subtitle}</p>
            </div>
            <div className="capability-main-icon"><CapabilityIcon kind={capability.icon} /></div>
            <button type="button" onClick={() => onNavigate(capability.key)}>
              <span>◎</span>{capability.action}
            </button>
          </article>
        ))}
      </section>

      <section className="capability-business-grid">
        {businessCapabilities.map((capability) => (
          <button
            type="button"
            className={`business-card business-${capability.tone}`}
            key={capability.key}
            onClick={() => onNavigate(capability.key)}
          >
            <div className="business-card-copy">
              <span className="business-label">核心能力</span>
              <h3>{capability.title}</h3>
              <p>{capability.subtitle}</p>
              <div>{capability.tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
            </div>
            <i aria-hidden="true">{capability.icon}</i>
          </button>
        ))}
      </section>

      <section className="dashboard-data-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-title">
            <div><span>AI TEAM</span><h2>我的 AI 员工</h2></div>
            <button type="button" onClick={() => onNavigate('agent')}>管理员工 →</button>
          </div>
          <div className="dashboard-employee-list">
            {employees.map((employee) => (
              <article key={employee.id}>
                <div className="dashboard-employee-avatar">{employee.avatar}</div>
                <div><strong>{employee.name}</strong><span>{employee.role}</span></div>
                <small className={employee.status === 'ready' ? 'ready-dot' : 'soon-dot'}>
                  {employee.status === 'ready' ? '工作中' : '待启用'}
                </small>
              </article>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-title">
            <div><span>RECENT JOBS</span><h2>最近任务</h2></div>
            <button type="button" onClick={() => onNavigate('tasks')}>查看全部 →</button>
          </div>
          <div className="dashboard-job-list">
            {jobs.slice(0, 4).map((job) => (
              <article key={job.id}>
                <span className={`job-dot job-dot-${job.status}`} />
                <div><strong>{job.title}</strong><small>{job.employee_name}</small></div>
                <em>{job.status === 'done' ? '已完成' : job.status === 'review' ? '待验收' : job.status === 'draft' ? '待执行' : '执行中'}</em>
              </article>
            ))}
            {jobs.length === 0 && <p className="dashboard-empty">还没有任务，从 Agent 智能体开始发布第一项工作。</p>}
          </div>
        </div>
      </section>
    </main>
  )
}
