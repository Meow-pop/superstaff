import type { Job } from '../types/contracts'
import { JobStatusBadge, StepStatusBadge } from './StatusBadge'

interface JobDetailProps {
  job: Job | null
  busy: boolean
  onRun: (jobId: string) => Promise<void>
  onApprove: (jobId: string) => Promise<void>
}

export function JobDetail({ job, busy, onRun, onApprove }: JobDetailProps) {
  if (!job) {
    return (
      <section className="job-detail job-detail-empty">
        <div className="empty-orbit">✦</div>
        <h3>一项任务就是一次员工工作闭环</h3>
        <p>选择已有任务，或创建新任务查看计划、执行步骤和最终成果。</p>
      </section>
    )
  }

  const canRun = job.status === 'draft' || job.status === 'failed'
  const canApprove = job.status === 'review'

  return (
    <section className="job-detail">
      <div className="job-detail-header">
        <div>
          <span className="eyebrow">JOB · {job.id.slice(-6).toUpperCase()}</span>
          <h2>{job.title}</h2>
          <p>{job.goal}</p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>

      <div className="owner-strip">
        <div className="owner-avatar">{job.employee_name.slice(0, 1)}</div>
        <div>
          <small>负责人</small>
          <strong>{job.employee_name}</strong>
        </div>
        <div className="lifecycle-mini" aria-label="任务生命周期">
          <span className="is-reached">计划</span>
          <i />
          <span className={job.status !== 'draft' ? 'is-reached' : ''}>执行</span>
          <i />
          <span className={['review', 'done'].includes(job.status) ? 'is-reached' : ''}>验收</span>
          <i />
          <span className={job.status === 'done' ? 'is-reached' : ''}>完成</span>
        </div>
      </div>

      <div className="step-stack">
        {job.steps.map((step) => (
          <article className={`step-card step-card-${step.status}`} key={step.id}>
            <div className="step-number">{String(step.order).padStart(2, '0')}</div>
            <div className="step-body">
              <div className="step-heading">
                <strong>{step.title}</strong>
                <StepStatusBadge status={step.status} />
              </div>
              <p>{step.instruction}</p>
              {step.output && <pre>{step.output}</pre>}
            </div>
          </article>
        ))}
      </div>

      {job.artifacts.length > 0 && (
        <div className="artifact-block">
          <div className="artifact-heading">
            <span>交付成果</span>
            <small>{job.artifacts[0].kind}</small>
          </div>
          <h3>{job.artifacts[0].title}</h3>
          <pre>{job.artifacts[0].content}</pre>
        </div>
      )}

      <div className="job-actions">
        <p>{job.result_summary || '计划已生成。确认后让员工开始执行。'}</p>
        {canRun && (
          <button className="button button-primary" disabled={busy} onClick={() => onRun(job.id)}>
            {busy ? '执行中…' : job.status === 'failed' ? '重新执行' : '开始执行'}
          </button>
        )}
        {canApprove && (
          <button className="button button-approve" disabled={busy} onClick={() => onApprove(job.id)}>
            {busy ? '正在提交…' : '验收通过 ✓'}
          </button>
        )}
        {job.status === 'done' && <span className="done-note">✓ 这项工作已形成可追踪成果</span>}
      </div>
    </section>
  )
}
