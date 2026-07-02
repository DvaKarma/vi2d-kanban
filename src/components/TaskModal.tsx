'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Trash2, AlertTriangle, Plus, CheckSquare, Square, CheckCircle2, Clock, Paperclip, Download, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { Task, TaskCreate, TaskUpdate, Responsavel, ColumnName, Priority, ChecklistItem, AtividadeItem, Anexo } from '@/lib/api'

interface Props {
  task: Task | null
  defaultColumn?: ColumnName
  defaultResponsavel: Responsavel[]
  onSave: (data: TaskCreate | TaskUpdate) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  onClose: () => void
}

const COLUMNS: { value: ColumnName; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'stand_by', label: 'Stand-By' },
  { value: 'a_fazer', label: 'A Fazer' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'nao_concluido', label: 'Não Concluído' },
]

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'bg-emerald-500' },
  { value: 'media', label: 'Média', color: 'bg-amber-400' },
  { value: 'alta', label: 'Alta', color: 'bg-red-500' },
]

const RESPONSAVEIS: { value: Responsavel; label: string }[] = [
  { value: 'vinicius', label: 'Vinicius' },
  { value: 'igor', label: 'Igor' },
]

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const INPUT =
  'w-full bg-[#050c1a] border border-[rgba(0,229,255,0.15)] rounded-lg px-3 py-2.5 text-sm text-[#e8f4f8] placeholder-[#7a9bbf] focus:outline-none focus:border-[#00e5ff] transition-colors'

const LABEL = 'block text-xs font-medium text-[#7a9bbf] mb-1'

export default function TaskModal({ task, defaultColumn, defaultResponsavel, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [responsavel, setResponsavel] = useState<Responsavel[]>(defaultResponsavel)
  const [column, setColumn] = useState<ColumnName>(defaultColumn ?? 'backlog')
  const [priority, setPriority] = useState<Priority>('media')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false)
  const [atividade, setAtividade] = useState<AtividadeItem[]>([])
  const [atividadeLoading, setAtividadeLoading] = useState(false)
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [uploadingAnexo, setUploadingAnexo] = useState(false)
  const [anexoError, setAnexoError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setResponsavel(task.responsavel ?? [])
      setColumn(task.column_name)
      setPriority(task.priority)
      setDueDate(task.due_date ?? '')
      setTags(task.tags ?? '')
      setChecklist(task.checklist ?? [])
      setAnexos(task.anexos ?? [])
    } else {
      setTitle('')
      setDescription('')
      setResponsavel(defaultResponsavel)
      setColumn(defaultColumn ?? 'backlog')
      setPriority('media')
      setDueDate('')
      setTags('')
      setChecklist([])
      setAnexos([])
    }
    setNewChecklistItem('')
    setDismissedSuggestion(false)
    setConfirmDelete(false)
    setError('')
    setAnexoError('')
  }, [task, defaultColumn, defaultResponsavel])

  const addChecklistItem = () => {
    const texto = newChecklistItem.trim()
    if (!texto) return
    setChecklist(prev => [...prev, { id: crypto.randomUUID().slice(0, 8), texto, feito: false }])
    setNewChecklistItem('')
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(i => (i.id === id ? { ...i, feito: !i.feito } : i)))
  }

  const removeChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(i => i.id !== id))
  }

  const toggleResponsavel = (value: Responsavel) => {
    setResponsavel(prev =>
      prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
    )
  }

  const handleUploadAnexo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !task) return
    setUploadingAnexo(true)
    setAnexoError('')
    try {
      const anexo = await api.uploadAnexo(task.id, file)
      setAnexos(prev => [...prev, anexo])
    } catch {
      setAnexoError('Erro ao enviar anexo (verifique o limite de 2GB).')
    } finally {
      setUploadingAnexo(false)
    }
  }

  const handleDeleteAnexo = async (anexo: Anexo) => {
    if (!task) return
    const filename = anexo.url.split('/').pop()
    if (!filename) return
    setAnexoError('')
    try {
      await api.deleteAnexo(task.id, filename)
      setAnexos(prev => prev.filter(a => a.url !== anexo.url))
    } catch {
      setAnexoError('Erro ao excluir anexo.')
    }
  }

  const checklistDone = checklist.length > 0 && checklist.every(i => i.feito)
  const showCompletionSuggestion = checklistDone && column !== 'concluido' && !dismissedSuggestion

  useEffect(() => {
    if (!checklistDone) setDismissedSuggestion(false)
  }, [checklistDone])

  useEffect(() => {
    if (!task) { setAtividade([]); return }
    let cancelled = false
    setAtividadeLoading(true)
    api.getAtividade(task.id)
      .then(data => { if (!cancelled) setAtividade(data) })
      .catch(() => { if (!cancelled) setAtividade([]) })
      .finally(() => { if (!cancelled) setAtividadeLoading(false) })
    return () => { cancelled = true }
  }, [task])

  const close = useCallback(() => {
    if (saving || deleting) return
    onClose()
  }, [saving, deleting, onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [close])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Título obrigatório'); return }
    if (responsavel.length === 0) { setError('Selecione ao menos um responsável'); return }
    setSaving(true)
    setError('')
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        column_name: column,
        priority,
        due_date: dueDate || null,
        tags: tags.trim(),
        responsavel,
        position: task?.position ?? 0,
        checklist,
      }
      await onSave(data)
      onClose()
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(task.id)
    } catch {
      setError('Erro ao excluir. Tente novamente.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="fixed inset-0 h-dvh z-50 flex items-center justify-center md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div
        className="relative w-full h-full md:h-auto md:max-w-lg rounded-none md:rounded-xl border-0 md:border border-[rgba(0,229,255,0.2)] bg-[#0a1628] md:shadow-[0_0_50px_rgba(0,229,255,0.1)] max-h-full md:max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,229,255,0.1)] shrink-0">
          <h2 className="text-base font-semibold text-[#e8f4f8]">
            {task ? 'Editar Task' : 'Nova Task'}
          </h2>
          <button
            onClick={close}
            className="p-2 rounded hover:bg-[rgba(0,229,255,0.1)] text-[#7a9bbf] hover:text-[#00e5ff] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form — scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
            {/* Title */}
            <div>
              <label className={LABEL}>Título *</label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="O que precisa ser feito?"
                className={INPUT}
              />
            </div>

            {/* Description */}
            <div>
              <label className={LABEL}>Descrição</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detalhes opcionais..."
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={LABEL}>Checklist</label>
                {checklist.length > 0 && (
                  <span className="text-[10px] text-[#7a9bbf]">
                    {checklist.filter(i => i.feito).length}/{checklist.length}
                  </span>
                )}
              </div>

              {checklist.length > 0 && (
                <div className="h-1 rounded-full bg-[rgba(0,229,255,0.1)] overflow-hidden mb-2">
                  <div
                    className="h-full bg-[#00e5ff] transition-all"
                    style={{ width: `${(checklist.filter(i => i.feito).length / checklist.length) * 100}%` }}
                  />
                </div>
              )}

              {showCompletionSuggestion && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-[rgba(0,229,255,0.08)] border border-[rgba(0,229,255,0.25)]">
                  <CheckCircle2 size={14} className="text-[#00e5ff] shrink-0" />
                  <span className="text-xs text-[#9fd9e8] flex-1">Checklist completo! Mover para Concluído?</span>
                  <button
                    type="button"
                    onClick={() => setDismissedSuggestion(true)}
                    className="text-xs text-[#7a9bbf] hover:text-[#e8f4f8] transition-colors"
                  >
                    Agora não
                  </button>
                  <button
                    type="button"
                    onClick={() => { setColumn('concluido'); setDismissedSuggestion(true) }}
                    className="text-xs font-semibold text-[#00e5ff] hover:text-[#5eeeff] transition-colors"
                  >
                    Mover
                  </button>
                </div>
              )}

              <div className="space-y-0.5">
                {checklist.map(item => (
                  <div
                    key={item.id}
                    className="group/item flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-[rgba(0,229,255,0.05)]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className="shrink-0 p-1 -m-1 text-[#7a9bbf] hover:text-[#00e5ff] transition-colors"
                    >
                      {item.feito ? <CheckSquare size={16} className="text-[#00e5ff]" /> : <Square size={16} />}
                    </button>
                    <span className={`flex-1 text-sm ${item.feito ? 'line-through text-[#7a9bbf]/60' : 'text-[#e8f4f8]'}`}>
                      {item.texto}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="shrink-0 p-1 rounded opacity-100 md:opacity-0 md:group-hover/item:opacity-100 text-[#7a9bbf] hover:text-red-400 transition-all"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 px-1 mt-1">
                <Plus size={14} className="text-[#7a9bbf] shrink-0" />
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={e => setNewChecklistItem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
                  placeholder="Adicionar item..."
                  className="flex-1 bg-transparent text-sm text-[#e8f4f8] placeholder-[#7a9bbf]/60 focus:outline-none py-1"
                />
              </div>
            </div>

            {/* Atividade — só aparece se houver histórico */}
            {(atividadeLoading || atividade.length > 0) && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock size={12} className="text-[#7a9bbf]" />
                  <label className={LABEL + ' mb-0'}>Atividade</label>
                </div>

                {atividadeLoading ? (
                  <p className="text-xs text-[#7a9bbf]">Carregando...</p>
                ) : (
                  <div className="space-y-2">
                    {atividade.map((item, idx) => (
                      <div key={idx} className="flex gap-2 text-xs">
                        <span className="text-[#7a9bbf]/70 shrink-0 tabular-nums">{item.data}</span>
                        <span className="text-[#e8f4f8]">{item.texto}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Anexos — só aparece editando (upload precisa do id da task) */}
            {task && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={LABEL}>Anexos</label>
                  <label className="flex items-center gap-1 text-xs text-[#00e5ff] hover:text-[#5eeeff] cursor-pointer transition-colors">
                    {uploadingAnexo ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    {uploadingAnexo ? 'Enviando...' : 'Adicionar'}
                    <input type="file" className="hidden" onChange={handleUploadAnexo} disabled={uploadingAnexo} />
                  </label>
                </div>

                {anexos.length > 0 && (
                  <div className="space-y-0.5">
                    {anexos.map(anexo => (
                      <div
                        key={anexo.url}
                        className="group/item flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-[rgba(0,229,255,0.05)]"
                      >
                        <Paperclip size={13} className="text-[#7a9bbf] shrink-0" />
                        <a
                          href={api.anexoUrl(anexo.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-0 text-sm text-[#e8f4f8] hover:text-[#00e5ff] truncate transition-colors"
                        >
                          {anexo.nome}
                        </a>
                        <span className="text-[10px] text-[#7a9bbf] shrink-0">{formatBytes(anexo.tamanho)}</span>
                        <a
                          href={api.anexoUrl(anexo.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1 text-[#7a9bbf] hover:text-[#00e5ff] transition-colors"
                        >
                          <Download size={13} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnexo(anexo)}
                          className="shrink-0 p-1 rounded opacity-100 md:opacity-0 md:group-hover/item:opacity-100 text-[#7a9bbf] hover:text-red-400 transition-all"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {anexoError && <p className="text-xs text-red-400 mt-1">{anexoError}</p>}
              </div>
            )}

            {/* Responsável + Column */}
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className={LABEL}>Responsável</label>
                <div className="flex gap-2">
                  {RESPONSAVEIS.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => toggleResponsavel(r.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        responsavel.includes(r.value)
                          ? 'border-[#00e5ff] bg-[rgba(0,229,255,0.1)] text-[#00e5ff]'
                          : 'border-[rgba(0,229,255,0.1)] text-[#7a9bbf] hover:border-[rgba(0,229,255,0.25)]'
                      }`}
                    >
                      {responsavel.includes(r.value) ? <CheckSquare size={14} /> : <Square size={14} />}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <label className={LABEL}>Coluna</label>
                <select
                  value={column}
                  onChange={e => setColumn(e.target.value as ColumnName)}
                  className={`${INPUT} appearance-none cursor-pointer`}
                >
                  {COLUMNS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className={LABEL}>Prioridade</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      priority === p.value
                        ? 'border-[#00e5ff] bg-[rgba(0,229,255,0.1)] text-[#00e5ff]'
                        : 'border-[rgba(0,229,255,0.1)] text-[#7a9bbf] hover:border-[rgba(0,229,255,0.25)]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.color}`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date + Tags */}
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className={LABEL}>Data limite</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={`${INPUT} [color-scheme:dark]`}
                />
              </div>
              <div className="min-w-0">
                <label className={LABEL}>Tags (CSV)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="infra, urgente"
                  className={INPUT}
                />
              </div>
            </div>

            {/* Timestamps — only when editing */}
            {task && (
              <div className="flex gap-4 pt-1 border-t border-[rgba(0,229,255,0.06)]">
                <div>
                  <p className="text-[10px] text-[#7a9bbf]/60 mb-0.5">Criado em</p>
                  <p className="text-[11px] text-[#7a9bbf]">{formatDate(task.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#7a9bbf]/60 mb-0.5">Atualizado em</p>
                  <p className="text-[11px] text-[#7a9bbf]">{formatDate(task.updated_at)}</p>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[rgba(0,229,255,0.1)] space-y-2 shrink-0">
            {/* Delete confirmation */}
            {task && onDelete && confirmDelete && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <span className="text-xs text-red-300 flex-1">Tem certeza? Essa ação não pode ser desfeita.</span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-[#7a9bbf] hover:text-[#e8f4f8] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Confirmar'}
                </button>
              </div>
            )}

            <div className="flex gap-2">
              {/* Delete trigger (only when editing) */}
              {task && onDelete && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2.5 rounded-lg border border-red-500/25 text-sm text-red-400/70 hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}

              <button
                type="button"
                onClick={close}
                className="flex-1 py-2.5 rounded-lg border border-[rgba(0,229,255,0.15)] text-sm text-[#7a9bbf] hover:border-[rgba(0,229,255,0.3)] hover:text-[#e8f4f8] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-[#00e5ff] text-[#050c1a] text-sm font-semibold hover:bg-[#00cce5] transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : task ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
