import type { JobStatus, StepStatus } from '../types/contracts'
import { jobStatusLabel, stepStatusLabel } from '../utils/jobPresentation'

interface JobStatusBadgeProps {
  status: JobStatus
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return <span className={`status status-${status}`}>{jobStatusLabel(status)}</span>
}

interface StepStatusBadgeProps {
  status: StepStatus
}

export function StepStatusBadge({ status }: StepStatusBadgeProps) {
  return <span className={`step-status step-status-${status}`}>{stepStatusLabel(status)}</span>
}
