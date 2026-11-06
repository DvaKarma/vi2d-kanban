const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api'
const TOKEN_LS = 'vi2d_token'

// Login (06/11/2026): o token fica so neste navegador. 401 = sessao vencida ou invalida.
export interface Usuario {
  usuario: string
  nome: string
  papel: 'dono' | 'socio'
}

export function getToken(): string {
  try { return localStorage.getItem(TOKEN_LS) ?? '' } catch { return '' }
}

export function setToken(t: string) {
  try {
    if (t) localStorage.setItem(TOKEN_LS, t)
    else localStorage.removeItem(TOKEN_LS)
  } catch { /* sem storage: pede login de novo */ }
}

export const EVENTO_SAIR = 'vi2d-sair'

function sessaoCaiu() {
  setToken('')
  window.dispatchEvent(new Event(EVENTO_SAIR))
}

function authHeader(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

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
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...init?.headers },
  })
  if (res.status === 401) {
    sessaoCaiu()
    throw new Error('Sessão expirada')
  }
  if (!res.ok) {
    let detalhe = ''
    try { detalhe = (await res.json()).detail ?? '' } catch { /* corpo sem json */ }
    throw new Error(detalhe || `API ${res.status}: ${res.statusText}`)
  }
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
    const res = await fetch(`${BASE}/tasks/${taskId}/anexos`, { method: 'POST', body: form, headers: authHeader() })
    if (res.status === 401) sessaoCaiu()
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
    return res.json() as Promise<Anexo>
  },
  deleteAnexo: (taskId: number, filename: string) =>
    request<void>(`/tasks/${taskId}/anexos/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
  // link de download abre em outra aba, sem cabecalho: o token vai na URL
  anexoUrl: (path: string) => `${BASE}${path}?t=${encodeURIComponent(getToken())}`,
  login: async (usuario: string, senha: string) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha }),
    })
    const r = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(r.detail || 'Não foi possível entrar')
    setToken(r.token)
    return r as Usuario & { token: string }
  },
  eu: () => request<Usuario>('/auth/me'),
  sair: async () => {
    try { await request('/auth/logout', { method: 'POST' }) } catch { /* ja caiu */ }
    setToken('')
  },
  trocarSenha: (atual: string, nova: string) =>
    request<{ ok: boolean }>('/auth/senha', { method: 'POST', body: JSON.stringify({ atual, nova }) }),
  calendario: (de: string, ate: string) =>
    request<{ ok: boolean; itens: unknown[]; avisos: string[]; erro?: string }>(`/calendario?de=${de}&ate=${ate}`),
}
