'use client'

import TaskCard from './TaskCard'
import type { Task } from '@/lib/api'
import type { MonthGroup } from '@/lib/archive'

interface Props {
  groups: MonthGroup[]
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
}

export default function ArchiveView({ groups, onEdit, onDelete }: Props) {
  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#7a9bbf] text-sm">
        Nenhuma tarefa concluída ou não concluída ainda.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group.key}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-[#e8f4f8]">{group.label}</h3>
            <span className="text-xs text-[#7a9bbf]">{group.tasks.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {group.tasks.map((task, idx) => (
              <TaskCard
                key={task.id}
                task={task}
                index={idx}
                mobile
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
