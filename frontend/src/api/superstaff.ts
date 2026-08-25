import type {
  AssetHandoff,
  AuditEvent,
  AssetHandoffTarget,
  AssetRecord,
  CreateJobInput,
  CreateWorkflowInput,
  CreateSocialAccountInput,
  Employee,
  Job,
  ProductionJob,
  ProductionTarget,
  ProviderConfig,
  SocialAccount,
  SocialAccountStatus,
  TaskCenterItem,
  SystemDiagnostics,
  UpdateAssetInput,
  UpdateWorkspaceInput,
  Workflow,
  WorkflowRun,
  WorkspaceSettings,
} from '../types/contracts'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new Error(body?.detail ?? `请求失败（HTTP ${response.status}）`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const superstaffApi = {
  listEmployees: () => request<Employee[]>('/employees'),
  listJobs: () => request<Job[]>('/jobs'),
  getJob: (jobId: string) => request<Job>(`/jobs/${jobId}`),
  createJob: (input: CreateJobInput) =>
    request<Job>('/jobs', { method: 'POST', body: JSON.stringify(input) }),
  runJob: (jobId: string) => request<Job>(`/jobs/${jobId}/run`, { method: 'POST' }),
  approveJob: (jobId: string) =>
    request<Job>(`/jobs/${jobId}/approve`, { method: 'POST' }),
  listWorkflows: () => request<Workflow[]>('/workflows'),
  createWorkflow: (input: CreateWorkflowInput) =>
    request<Workflow>('/workflows', { method: 'POST', body: JSON.stringify(input) }),
  deleteWorkflow: (workflowId: string) =>
    request<void>(`/workflows/${workflowId}`, { method: 'DELETE' }),
  listWorkflowRuns: (workflowId?: string) =>
    request<WorkflowRun[]>(
      `/workflow-runs${workflowId ? `?workflow_id=${encodeURIComponent(workflowId)}` : ''}`,
    ),
  runWorkflow: (workflowId: string, input: string) =>
    request<WorkflowRun>(`/workflows/${workflowId}/runs`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),
  listTasks: () => request<TaskCenterItem[]>('/tasks'),
  listAssets: () => request<AssetRecord[]>('/assets'),
  getAsset: (assetId: string) => request<AssetRecord>(`/assets/${assetId}`),
  updateAsset: (assetId: string, input: UpdateAssetInput) =>
    request<AssetRecord>(`/assets/${assetId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  listAssetHandoffs: (assetId?: string) =>
    request<AssetHandoff[]>(
      `/asset-handoffs${assetId ? `?asset_id=${encodeURIComponent(assetId)}` : ''}`,
    ),
  createAssetHandoff: (assetId: string, target: AssetHandoffTarget, note = '') =>
    request<AssetHandoff>(`/assets/${assetId}/handoffs`, {
      method: 'POST',
      body: JSON.stringify({ target, note }),
    }),
  listProductionJobs: (target?: ProductionTarget) =>
    request<ProductionJob[]>(
      `/production-jobs${target ? `?target=${encodeURIComponent(target)}` : ''}`,
    ),
  runProductionJob: (jobId: string) =>
    request<ProductionJob>(`/production-jobs/${jobId}/run`, { method: 'POST' }),
  approveProductionJob: (jobId: string) =>
    request<ProductionJob>(`/production-jobs/${jobId}/approve`, { method: 'POST' }),
  scheduleProductionJob: (jobId: string, accountId: string, scheduledAt: string) =>
    request<ProductionJob>(`/production-jobs/${jobId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId, scheduled_at: scheduledAt }),
    }),
  listAccounts: () => request<SocialAccount[]>('/accounts'),
  createAccount: (input: CreateSocialAccountInput) =>
    request<SocialAccount>('/accounts', { method: 'POST', body: JSON.stringify(input) }),
  updateAccountStatus: (accountId: string, status: SocialAccountStatus) =>
    request<SocialAccount>(`/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getWorkspace: () => request<WorkspaceSettings>('/workspace'),
  updateWorkspace: (input: UpdateWorkspaceInput) =>
    request<WorkspaceSettings>('/workspace', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  listProviders: () => request<ProviderConfig[]>('/admin/providers'),
  listAuditEvents: (limit = 100) =>
    request<AuditEvent[]>(`/admin/audit-events?limit=${limit}`),
  getDiagnostics: () => request<SystemDiagnostics>('/admin/diagnostics'),
  downloadBackup: async () => {
    const response = await fetch(`${API_BASE}/admin/backups/export`)
    if (!response.ok) throw new Error(`备份下载失败（HTTP ${response.status}）`)
    return response.blob()
  },
}
