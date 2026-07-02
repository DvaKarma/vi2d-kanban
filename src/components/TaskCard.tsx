'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Trash2, Calendar, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Task, Responsavel } from '@/lib/api'

const RESPONSAVEL_INITIAL: Record<Responsavel, string> = {
  vinicius: 'V',
  igor: 'I',
}

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  alta: 'bg-red-500',
  media: 'bg-amber-400',
  baixa: 'bg-emerald-500',
}

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

interface Props {
  task: Task
  index: number
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
  mobile?: boolean
  onMove?: (id: number, direction: 'prev' | 'next') => void
  canMovePrev?: boolean
  canMoveNext?: boolean
}

export default function TaskCard({ task, index, onEdit, onDelete, mobile, onMove, canMovePrev, canMoveNext }: Props) {
  const tags = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().toDateString())
  const checklist = task.checklist ?? []
  const checklistDone = checklist.filter(i => i.feito).length
  const anexos = task.anexos ?? []

  const cardClasses = (dragging: boolean) => `
    group relative rounded-lg p-3 mb-2 border transition-all select-none cursor-pointer
    bg-[#0a1628] border-[rgba(0,229,255,0.12)]
    hover:border-[rgba(0,229,255,0.35)] hover:shadow-[0_0_12px_rgba(0,229,255,0.08)]
    ${dragging ? 'shadow-[0_0_20px_rgba(0,229,255,0.2)] border-[rgba(0,229,255,0.45)] rotate-1 scale-[1.02]' : ''}
  `

  const body = (
    <>
      {/* Priority bar */}
      <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ml-px ${PRIORITY_COLOR[task.priority]}`} />

      <div className="pl-2">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-[#e8f4f8] leading-snug flex-1">{task.title}</p>

          <div className="flex items-center -space-x-1.5 shrink-0">
            {(task.responsavel ?? []).map(r => (
              <span
                key={r}
                title={r === 'vinicius' ? 'Vinicius' : 'Igor'}
                className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-semibold bg-[rgba(0,229,255,0.12)] border border-[rgba(0,229,255,0.35)] text-[#00e5ff]"
              >
                {RESPONSAVEL_INITIAL[r]}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {mobile && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); if (canMovePrev) onMove?.(task.id, 'prev') }}
                  disabled={!canMovePrev}
                  className="p-1.5 rounded hover:bg-[rgba(0,229,255,0.1)] text-[#7a9bbf] hover:text-[#00e5ff] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); if (canMoveNext) onMove?.(task.id, 'next') }}
                  disabled={!canMoveNext}
                  className="p-1.5 rounded hover:bg-[rgba(0,229,255,0.1)] text-[#7a9bbf] hover:text-[#00e5ff] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDelete(task.id) }}
              className="p-1.5 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-red-500/10 text-[#7a9bbf] hover:text-red-400 transition-all shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-[#7a9bbf] mt-1 line-clamp-2">{task.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_COLOR[task.priority]} bg-opacity-20 text-white`}>
            {PRIORITY_LABEL[task.priority]}
          </span>

          {checklist.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,229,255,0.08)] text-[#00e5ff]">
              ✓ {checklistDone}/{checklist.length}
            </span>
          )}

          {anexos.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,229,255,0.08)] text-[#00e5ff]">
              📎 {anexos.length}
            </span>
          )}

          {task.due_date && (
            <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-400' : 'text-[#7a9bbf]'}`}>
              <Calendar size={10} />
              {task.due_date}
            </span>
          )}

          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,229,255,0.08)] text-[#00e5ff]">
              <Tag size={9} />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  )

  if (mobile) {
    return (
      <div onClick={() => onEdit(task)} className={cardClasses(false)}>
        {body}
      </div>
    )
  }

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => !snapshot.isDragging && onEdit(task)}
          className={cardClasses(snapshot.isDragging)}
        >
          {body}
        </div>
      )}
    </Draggable>
  )
}
