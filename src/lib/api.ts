const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api'

export type Responsavel = 'vinicius' | 'igor'
export type ColumnName = 'backlog' | 'stand_by' | 'a_fazer' | 'em_andamento' | 'concluido' | 'nao_concluido'
export type Priority = 'baixa' | 'media' | 'alta'

export interface ChecklistItem {
  id: string
  texto: string
  feito: boolean
}

export interface AtividadeItem {
  data: string
  texto: string
}

export interface Anexo {
  nome: string
  url: string
  tamanho: number
  criado_em: string
}

export interface Task {
  id: number
  title: string
  description: string
  responsavel: Responsavel[]
  column_name: ColumnName
  priority: Priority
  due_date: string | null
  tags: string
  position: number
  checklist?: ChecklistItem[]
  anexos?: Anexo[]
  created_at: string
  updated_at: string
}

export type TaskCreate = Omit<Task, 'id' | 'created_at' | 'updated_at'>
export type TaskUpdate = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  getTasks: (responsavel?: Responsavel) => {
    const qs = responsavel ? `?responsavel=${responsavel}` : ''
    return request<Task[]>(`/tasks${qs}`)
  },
  createTask: (data: TaskCreate) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: number, data: TaskUpdate) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: number) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  getAtividade: (id: number) =>
    request<AtividadeItem[]>(`/tasks/${id}/atividade`),
  uploadAnexo: async (taskId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/tasks/${taskId}/anexos`, { method: 'POST', body: form })
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
    return res.json() as Promise<Anexo>
  },
  deleteAnexo: (taskId: number, filename: string) =>
    request<void>(`/tasks/${taskId}/anexos/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
  anexoUrl: (path: string) => `${BASE}${path}`,
}
