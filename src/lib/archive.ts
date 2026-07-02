import type { Task } from './api'

export interface MonthGroup {
  key: string
  label: string
  tasks: Task[]
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function monthKey(updatedAt: string | null | undefined): string {
  if (!updatedAt) return 'sem-data'
  const d = new Date(updatedAt)
  if (isNaN(d.getTime())) return 'sem-data'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(key: string): string {
  if (key === 'sem-data') return 'Sem data'
  const [year, month] = key.split('-')
  return `${MESES[Number(month) - 1] ?? month} de ${year}`
}

export function groupArchivedByMonth(tasks: Task[]): MonthGroup[] {
  const arquivadas = tasks.filter(t => t.column_name === 'concluido' || t.column_name === 'nao_concluido')

  const buckets = new Map<string, Task[]>()
  for (const t of arquivadas) {
    const key = monthKey(t.updated_at)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(t)
  }

  const keys = Array.from(buckets.keys()).sort((a, b) =>
    a === 'sem-data' ? 1 : b === 'sem-data' ? -1 : b.localeCompare(a)
  )

  return keys.map(key => ({
    key,
    label: formatMonthLabel(key),
    tasks: buckets.get(key)!.sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '')),
  }))
}
