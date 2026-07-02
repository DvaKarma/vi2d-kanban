'use client'

import { Droppable } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'
import type { Task } from '@/lib/api'

export const COLUMN_LABEL: Record<Task['column_name'], string> = {
  backlog: 'Backlog',
  stand_by: 'Stand-By',
  a_fazer: 'A Fazer',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  nao_concluido: 'Não Concluído',
}

// Cor de identidade de cada coluna — usada nas badges de contagem (aqui e
// no indicador mobile). "Não Concluído" e "Stand-By" usam cores neutras,
// não vermelho/verde, pra não parecer erro nem sucesso.
export const COLUMN_COLOR: Record<Task['column_name'], string> = {
  backlog: '#00e5ff',
  stand_by: '#9b8fb0',
  a_fazer: '#00e5ff',
  em_andamento: '#00e5ff',
  concluido: '#00e5ff',
  nao_concluido: '#7a9bbf',
}

interface Props {
  columnId: Task['column_name']
  tasks: Task[]
  onAddTask: (columnId: Task['column_name']) => void
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
  mobile?: boolean
  onMove?: (id: number, direction: 'prev' | 'next') => void
  isFirst?: boolean
  isLast?: boolean
}

export default function KanbanColumn({ columnId, tasks, onAddTask, onEdit, onDelete, mobile, onMove, isFirst, isLast }: Props) {
  return (
    <div className={mobile ? 'flex flex-col w-full shrink-0 snap-start' : 'flex flex-col w-72 shrink-0'}>
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#e8f4f8]">{COLUMN_LABEL[columnId]}</span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${COLUMN_COLOR[columnId]}1a`, color: COLUMN_COLOR[columnId] }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(columnId)}
          className="p-1.5 rounded hover:bg-[rgba(0,229,255,0.12)] text-[#7a9bbf] hover:text-[#00e5ff] transition-colors"
          title="Adicionar task"
        >
          <Plus size={16} />
        </button>
      </div>

      {mobile ? (
        <div className="flex-1 min-h-[120px] rounded-lg p-2 bg-[rgba(255,255,255,0.02)] border border-transparent">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              index={0}
              onEdit={onEdit}
              onDelete={onDelete}
              mobile
              onMove={onMove}
              canMovePrev={!isFirst}
              canMoveNext={!isLast}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-[#7a9bbf]/50 text-center py-8">Nenhuma task aqui</p>
          )}
        </div>
      ) : (
        <Droppable droppableId={columnId}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                flex-1 min-h-[120px] rounded-lg p-2 transition-colors
                ${snapshot.isDraggingOver
                  ? 'bg-[rgba(0,229,255,0.05)] border border-[rgba(0,229,255,0.2)]'
                  : 'bg-[rgba(255,255,255,0.02)] border border-transparent'
                }
              `}
            >
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  )
}
