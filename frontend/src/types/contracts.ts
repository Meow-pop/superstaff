export type EmployeeStatus = 'ready' | 'coming_soon'
export type JobStatus = 'draft' | 'running' | 'review' | 'done' | 'failed'
export type StepStatus = 'pending' | 'running' | 'done' | 'failed'

export interface Employee {
  id: string
  name: string
  role: string
  mission: string
  avatar: string
  skills: string[]
  status: EmployeeStatus
  created_at: string
}

export interface JobStep {
  id: string
  order: number
  title: string
  instruction: string
  status: StepStatus
  output: string
}

export interface Artifact {
  id: string
  job_id: string
  kind: string
  title: string
  content: string
  created_at: string
}

export interface Job {
  id: string
  employee_id: string
  employee_name: string
  title: string
  goal: string
  status: JobStatus
  steps: JobStep[]
  created_at: string
  updated_at: string
  result_summary: string
  artifacts: Artifact[]
}

export interface CreateJobInput {
  employee_id: string
  title: string
  goal: string
}

export interface WorkflowStep {
  id: string
  order: number
  name: string
  instruction: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  icon: string
  color: string
  status: string
  steps: WorkflowStep[]
  run_count: number
  created_at: string
  updated_at: string
}

export interface CreateWorkflowInput {
  name: string
  description: string
  icon: string
  color: string
  steps: Array<{ name: string; instruction: string }>
}

export interface WorkflowRunStep {
  id: string
  order: number
  name: string
  status: StepStatus
  output: string
}

export interface WorkflowRun {
  id: string
  workflow_id: string
  workflow_name: string
  input: string
  status: 'running' | 'done' | 'failed'
  steps: WorkflowRunStep[]
  output: string
  created_at: string
  completed_at: string | null
}

export type TaskSourceType = 'agent_job' | 'workflow_run'
export type AssetStatus = 'active' | 'archived'
export type AssetHandoffTarget = 'creative_video' | 'storyboard' | 'publisher'

export interface TaskCenterStep {
  order: number
  name: string
  status: StepStatus
  output: string
}

export interface TaskCenterItem {
  id: string
  source_type: TaskSourceType
  definition_id: string
  title: string
  description: string
  owner: string
  status: JobStatus
  steps: TaskCenterStep[]
  output: string
  asset_ids: string[]
  created_at: string
  updated_at: string
}

export interface AssetRecord {
  id: string
  source_type: TaskSourceType | 'manual'
  source_id: string
  source_name: string
  kind: string
  title: string
  content: string
  tags: string[]
  status: AssetStatus
  created_at: string
  updated_at: string
}

export interface UpdateAssetInput {
  title?: string
  tags?: string[]
  status?: AssetStatus
}

export interface AssetHandoff {
  id: string
  asset_id: string
  asset_title: string
  target: AssetHandoffTarget
  status: 'queued' | 'processing' | 'done' | 'failed'
  note: string
  created_at: string
}
