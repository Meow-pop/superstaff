import type {
  CreateJobInput,
  CreateWorkflowInput,
  Employee,
  Job,
  Workflow,
  WorkflowRun,
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
}
