import { useEffect, useMemo, useState } from 'react'

import { superstaffApi } from '../api/superstaff'
import { EmployeeCard } from '../components/EmployeeCard'
import { JobComposer } from '../components/JobComposer'
import { JobDetail } from '../components/JobDetail'
import { JobList } from '../components/JobList'
import type { CreateJobInput, Employee, Job } from '../types/contracts'

function replaceJob(jobs: Job[], updated: Job): Job[] {
  const exists = jobs.some((job) => job.id === updated.id)
  return exists
    ? jobs.map((job) => (job.id === updated.id ? updated : job))
    : [updated, ...jobs]
}

export function EmployeeWorkspace() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  )

  useEffect(() => {
    let cancelled = false
    async function loadWorkspace() {
      try {
        const [employeeList, jobList] = await Promise.all([
          superstaffApi.listEmployees(),
          superstaffApi.listJobs(),
        ])
        if (cancelled) return
        setEmployees(employeeList)
        setJobs(jobList)
        setSelectedEmployeeId(employeeList.find((employee) => employee.status === 'ready')?.id ?? '')
        setActiveJob(jobList[0] ?? null)
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : '加载工作台失败')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadWorkspace()
    return () => {
      cancelled = true
    }
  }, [])

  async function perform(action: () => Promise<Job>) {
    setBusy(true)
    setError('')
    try {
      const updated = await action()
      setJobs((current) => replaceJob(current, updated))
      setActiveJob(updated)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  async function createJob(input: CreateJobInput) {
    await perform(() => superstaffApi.createJob(input))
  }

  async function runJob(jobId: string) {
    await perform(() => superstaffApi.runJob(jobId))
  }

  async function approveJob(jobId: string) {
    await perform(() => superstaffApi.approveJob(jobId))
  }

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-mark">S</div>
        <p>正在连接员工工作台…</p>
      </main>
    )
  }

  return (
    <main className="workspace">
      {error && (
        <div className="error-banner" role="alert">
          <span>!</span>
          <p>{error}</p>
          <button type="button" onClick={() => setError('')} aria-label="关闭错误提示">
            ×
          </button>
        </div>
      )}

      <section className="module-page-header agent-page-header">
        <div>
          <span className="page-breadcrumb">首页 / Agent 智能体</span>
          <h1>Agent 智能体</h1>
          <p>创建你的专属 AI 员工，让它理解目标、制定计划、执行任务并交付结果。</p>
        </div>
        <div className="header-flow" aria-label="Agent 工作流程">
          <span>目标</span><i>→</i><span>计划</span><i>→</i><span>执行</span><i>→</i><span>验收</span>
        </div>
      </section>

      <section className="agent-metrics">
        <article><span className="metric-icon metric-blue">AI</span><div><b>{employees.filter((item) => item.status === 'ready').length}</b><small>可用智能体</small></div></article>
        <article><span className="metric-icon metric-purple">任</span><div><b>{jobs.length}</b><small>全部任务</small></div></article>
        <article><span className="metric-icon metric-orange">验</span><div><b>{jobs.filter((job) => job.status === 'review').length}</b><small>等待验收</small></div></article>
        <article><span className="metric-icon metric-green">果</span><div><b>{jobs.filter((job) => job.status === 'done').length}</b><small>已交付成果</small></div></article>
      </section>

      <section className="employee-section">
        <div className="section-heading employee-section-heading">
          <div>
            <span className="eyebrow">AI EMPLOYEES</span>
            <h2>选择 AI 员工</h2>
          </div>
          <p>角色定义长期职责，技能只是它为了完成工作可以调用的工具。</p>
        </div>
        <div className="employee-grid">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              selected={employee.id === selectedEmployeeId}
              onSelect={(selected) => setSelectedEmployeeId(selected.id)}
            />
          ))}
        </div>
      </section>

      <JobComposer employee={selectedEmployee} busy={busy} onCreate={createJob} />

      <div className="operations-grid">
        <JobList jobs={jobs} activeJobId={activeJob?.id} onSelect={setActiveJob} />
        <JobDetail job={activeJob} busy={busy} onRun={runJob} onApprove={approveJob} />
      </div>
    </main>
  )
}
