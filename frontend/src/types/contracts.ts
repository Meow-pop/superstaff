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

export type ProductionStatus = 'queued' | 'running' | 'review' | 'ready' | 'done' | 'failed'
export type ProductionTarget = AssetHandoffTarget

export interface ProductionScene {
  order: number
  title: string
  visual: string
  narration: string
  duration_seconds: number
  shot_type: '特写' | '中景' | '全景' | '信息图' | '产品镜头'
  camera_motion: '静止' | '快速推进' | '缓慢横移' | '分层上浮' | '轻推定格'
  transition: '硬切' | '闪白切入' | '遮罩滑动' | '叠化' | '淡出'
}

export interface ProductionBrief {
  audience: string
  objective: string
  aspect_ratio: '9:16' | '16:9' | '1:1'
  visual_style: 'editorial' | 'minimal' | 'technology'
  pace: 'calm' | 'balanced' | 'fast'
  brand_name: string
  primary_color: string
  accent_color: string
  call_to_action: string
  ai_label: boolean
}

export interface ProductionJob {
  id: string
  handoff_id: string
  asset_id: string
  title: string
  target: ProductionTarget
  status: ProductionStatus
  script: string
  scenes: ProductionScene[]
  brief: ProductionBrief
  output: string
  account_id: string | null
  account_name: string
  scheduled_at: string | null
  created_at: string
  updated_at: string
}

export type SocialPlatform = '抖音' | '小红书' | '视频号' | '快手' | 'B站'
export type SocialAccountStatus = 'demo' | 'connected' | 'disabled'

export interface SocialAccount {
  id: string
  platform: SocialPlatform
  display_name: string
  handle: string
  status: SocialAccountStatus
  follower_count: number
  created_at: string
  updated_at: string
}

export interface CreateSocialAccountInput {
  platform: SocialPlatform
  display_name: string
  handle: string
}

export interface WorkspaceSettings {
  id: string
  workspace_name: string
  owner_name: string
  demo_mode: boolean
  human_approval_required: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface UpdateWorkspaceInput {
  workspace_name?: string
  owner_name?: string
  demo_mode?: boolean
  human_approval_required?: boolean
  onboarding_completed?: boolean
}

export type ProviderCategory = 'language' | 'image' | 'voice' | 'video' | 'publishing'
export type ProviderMode = 'active' | 'demo' | 'waiting'

export interface ProviderConfig {
  id: string
  category: ProviderCategory
  display_name: string
  adapter: string
  mode: ProviderMode
  credential_env: string
  credential_detected: boolean
  description: string
  updated_at: string
}

export interface AuditEvent {
  id: string
  action: string
  resource: string
  resource_id: string
  summary: string
  detail: Record<string, string | number | boolean>
  created_at: string
}

export interface SystemDiagnostics {
  status: 'ok' | 'degraded'
  version: string
  runtime: string
  storage: string
  database_ready: boolean
  database_size_bytes: number
  counts: Record<string, number>
  checked_at: string
}

export interface LocalModelStatus {
  mode: 'demo' | 'ollama'
  reachable: boolean
  model_ready: boolean
  configured_model: string
  installed_models: string[]
  base_url: string
  detail: string
}
