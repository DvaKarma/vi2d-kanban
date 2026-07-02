'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { RefreshCw, AlertCircle, Search, Plus } from 'lucide-react'
import KanbanColumn, { COLUMN_LABEL, COLUMN_COLOR } from './KanbanColumn'
import TaskModal from './TaskModal'
import { api } from '@/lib/api'
import type { Task, Responsavel, ColumnName, TaskCreate, TaskUpdate } from '@/lib/api'

const COLUMNS: ColumnName[] = ['backlog', 'a_fazer', 'em_andamento', 'concluido', 'nao_concluido']

type Filtro = 'todos' | Responsavel

const FILTRO_LABELS: Record<Filtro, string> = {
  todos: 'Todos',
  vinicius: 'Vinicius',
  igor: 'Igor',
}

function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpointPx])
  return isMobile
}

export default function KanbanBoard() {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultColumn, setDefaultColumn] = useState<ColumnName>('backlog')

  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isMobile = useIsMobile()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getTasks(filtro === 'todos' ? undefined : filtro)
      setTasks(data)
    } catch {
      setError('Não foi possível conectar à API. Verifique se o servidor está online.')
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const visibleTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search.trim().toLowerCase())
  )

  const tasksByColumn = (col: ColumnName) =>
    visibleTasks
      .filter(t => t.column_name === col)
      .sort((a, b) => a.position - b.position)

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const taskId = Number(draggableId)
    const newColumn = destination.droppableId as ColumnName

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, column_name: newColumn, position: destination.index }
          : t
      )
    )

    try {
      await api.updateTask(taskId, { column_name: newColumn, position: destination.index })
    } catch {
      fetchTasks()
    }
  }

  const moveTask = async (taskId: number, direction: 'prev' | 'next') => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const idx = COLUMNS.indexOf(task.column_name)
    const newIdx = direction === 'next' ? idx + 1 : idx - 1
    if (newIdx < 0 || newIdx >= COLUMNS.length) return
    const newColumn = COLUMNS[newIdx]
    const newPosition = tasksByColumn(newColumn).length

    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, column_name: newColumn, position: newPosition } : t))
    )
    try {
      await api.updateTask(taskId, { column_name: newColumn, position: newPosition })
    } catch {
      fetchTasks()
    }
  }

  const getColumnWidth = () => {
    const el = scrollRef.current
    const firstColumn = el?.firstElementChild
    return firstColumn instanceof HTMLElement ? firstColumn.clientWidth : el?.clientWidth ?? 0
  }

  const handleScroll = () => {
    const el = scrollRef.current
    const colWidth = getColumnWidth()
    if (!el || colWidth === 0) return
    setActiveIndex(Math.round(el.scrollLeft / colWidth))
  }

  const scrollToColumn = (idx: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * getColumnWidth(), behavior: 'smooth' })
    setActiveIndex(idx)
  }

  useEffect(() => {
    setActiveIndex(0)
    scrollRef.current?.scrollTo({ left: 0 })
  }, [filtro])

  const openCreate = useCallback((col: ColumnName) => {
    setEditingTask(null)
    setDefaultColumn(col)
    setModalOpen(true)
  }, [])

  const defaultResponsavel: Responsavel[] = filtro === 'todos' ? [] : [filtro]

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key === '/') {
        if (isTypingTarget(e.target)) return
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        if (!modalOpen && search) setSearch('')
      } else if ((e.key === 'n' || e.key === 'N') && !modalOpen && !isTypingTarget(e.target)) {
        e.preventDefault()
        openCreate('backlog')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [modalOpen, search, openCreate])

  const handleSave = async (data: TaskCreate | TaskUpdate) => {
    if (editingTask) {
      const updated = await api.updateTask(editingTask.id, data as TaskUpdate)
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    } else {
      const created = await api.createTask(data as TaskCreate)
      setTasks(prev => [...prev, created])
    }
  }

  const handleDelete = async (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await api.deleteTask(id)
    } catch {
      fetchTasks()
    }
  }

  const handleDeleteFromModal = async (id: number) => {
    setModalOpen(false)
    await handleDelete(id)
  }

  return (
    <div className="min-h-dvh bg-[#050c1a] flex flex-col">
      {/* Header */}
      <header className="border-b border-[rgba(0,229,255,0.1)] bg-[#050c1a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-3 md:py-0 md:h-14 flex flex-col md:flex-row md:items-center gap-3 md:gap-0 md:justify-between">
          {/* Logo + ações mobile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" />
              <span className="text-sm font-semibold text-[#e8f4f8] tracking-wide">KANBAN</span>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => openCreate('backlog')}
                className="p-2 rounded-lg hover:bg-[rgba(0,229,255,0.08)] text-[#7a9bbf] hover:text-[#00e5ff] transition-colors"
                title="Nova task"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={fetchTasks}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-[rgba(0,229,255,0.08)] text-[#7a9bbf] hover:text-[#00e5ff] transition-colors disabled:opacity-40"
                title="Recarregar"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Filtro de responsável + busca */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#0a1628] rounded-lg p-1 border border-[rgba(0,229,255,0.12)]">
              {(['todos', 'vinicius', 'igor'] as Filtro[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3.5 md:px-4 py-2 md:py-1.5 rounded-md text-sm font-medium transition-all ${
                    filtro === f
                      ? 'bg-[#00e5ff] text-[#050c1a]'
                      : 'text-[#7a9bbf] hover:text-[#e8f4f8]'
                  }`}
                >
                  {FILTRO_LABELS[f]}
                </button>
              ))}
            </div>

            <div className="relative flex-1 md:flex-none">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7a9bbf] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar... (/)"
                className="w-full md:w-44 bg-[#0a1628] border border-[rgba(0,229,255,0.12)] rounded-lg pl-8 pr-3 py-2 md:py-1.5 text-sm md:text-xs text-[#e8f4f8] placeholder-[#7a9bbf]/60 focus:outline-none focus:border-[#00e5ff] transition-colors"
              />
            </div>
          </div>

          {/* Nova task + refresh (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => openCreate('backlog')}
              className="p-2 rounded-lg hover:bg-[rgba(0,229,255,0.08)] text-[#7a9bbf] hover:text-[#00e5ff] transition-colors"
              title="Nova task"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={fetchTasks}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-[rgba(0,229,255,0.08)] text-[#7a9bbf] hover:text-[#00e5ff] transition-colors disabled:opacity-40"
              title="Recarregar"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 md:px-6 py-4 md:py-6 max-w-screen-2xl mx-auto w-full">
        {error && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            <AlertCircle size={16} />
            {error}
            <button onClick={fetchTasks} className="ml-auto underline hover:no-underline">Tentar novamente</button>
          </div>
        )}

        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3 text-[#7a9bbf]">
              <RefreshCw size={24} className="animate-spin text-[#00e5ff]" />
              <span className="text-sm">Carregando tasks...</span>
            </div>
          </div>
        ) : isMobile ? (
          <>
            {/* Indicador de coluna */}
            <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap">
              {COLUMNS.map((col, idx) => (
                <button
                  key={col}
                  onClick={() => scrollToColumn(idx)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    activeIndex === idx
                      ? 'text-[#050c1a]'
                      : 'bg-[#0a1628] text-[#7a9bbf] border border-[rgba(0,229,255,0.12)]'
                  }`}
                  style={activeIndex === idx ? { backgroundColor: COLUMN_COLOR[col] } : undefined}
                >
                  {COLUMN_LABEL[col]} · {tasksByColumn(col).length}
                </button>
              ))}
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory -mx-4 px-4"
            >
              {COLUMNS.map((col, idx) => (
                <KanbanColumn
                  key={col}
                  columnId={col}
                  tasks={tasksByColumn(col)}
                  onAddTask={openCreate}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  mobile
                  onMove={moveTask}
                  isFirst={idx === 0}
                  isLast={idx === COLUMNS.length - 1}
                />
              ))}
            </div>
          </>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col}
                  columnId={col}
                  tasks={tasksByColumn(col)}
                  onAddTask={openCreate}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultColumn={defaultColumn}
          defaultResponsavel={defaultResponsavel}
          onSave={handleSave}
          onDelete={handleDeleteFromModal}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
