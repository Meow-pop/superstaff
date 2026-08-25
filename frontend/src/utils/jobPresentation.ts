import type { JobStatus, StepStatus } from '../types/contracts'

const jobLabels: Record<JobStatus, string> = {
  draft: '待启动',
  running: '执行中',
  review: '待验收',
  done: '已完成',
  failed: '执行失败',
}

const stepLabels: Record<StepStatus, string> = {
  pending: '等待',
  running: '执行中',
  done: '完成',
  failed: '失败',
}

export function jobStatusLabel(status: JobStatus): string {
  return jobLabels[status]
}

export function stepStatusLabel(status: StepStatus): string {
  return stepLabels[status]
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
