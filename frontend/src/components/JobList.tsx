import type { Job } from '../types/contracts'
import { formatDateTime } from '../utils/jobPresentation'
import { JobStatusBadge } from './StatusBadge'

interface JobListProps {
  jobs: Job[]
  activeJobId?: string
  onSelect: (job: Job) => void
}

export function JobList({ jobs, activeJobId, onSelect }: JobListProps) {
  return (
    <section className="job-list-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">TASK CENTER</span>
          <h2>任务中心</h2>
        </div>
        <span className="count-badge">{jobs.length}</span>
      </div>
      <div className="job-list">
        {jobs.length === 0 ? (
          <div className="empty-state">
            <span>◎</span>
            <p>还没有任务</p>
            <small>从上方给员工下达第一个业务目标。</small>
          </div>
        ) : (
          jobs.map((job) => (
            <button
              type="button"
              key={job.id}
              className={`job-list-item ${activeJobId === job.id ? 'job-list-item-active' : ''}`}
              onClick={() => onSelect(job)}
            >
              <div className="job-list-title">
                <strong>{job.title}</strong>
                <JobStatusBadge status={job.status} />
              </div>
              <p>{job.goal}</p>
              <div className="job-list-meta">
                <span>{job.employee_name}</span>
                <time>{formatDateTime(job.updated_at)}</time>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  )
}
