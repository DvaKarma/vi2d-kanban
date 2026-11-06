'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import ptBr from '@fullcalendar/core/locales/pt-br'
import type { EventClickArg, DatesSetArg, EventInput } from '@fullcalendar/core'
import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X, Video, ExternalLink, RefreshCw, AlertCircle, Repeat } from 'lucide-react'
import type { Task, Usuario } from '@/lib/api'
import {
  ORIGENS, corDa, nomeDa, buscarAgenda,
  type ItemAgenda, type Origem,
} from '@/lib/calendario'

const CAMADAS_LS = 'vi2d_cal_camadas'
const TODAS = ORIGENS.map(o => o.id)

function lerCamadas(): Origem[] {
  try {
    const v = JSON.parse(localStorage.getItem(CAMADAS_LS) ?? 'null')
    return Array.isArray(v) ? v.filter((o: Origem) => TODAS.includes(o)) : TODAS
  } catch { return TODAS }
}

function quandoTexto(i: ItemAgenda) {
  const ini = new Date(i.inicio)
  if (i.dia_inteiro) return format(ini, "EEEE, d 'de' MMMM", { locale: ptBR }) + ' · dia todo'
  const fim = new Date(i.fim)
  return format(ini, "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR }) + ' a ' + format(fim, 'HH:mm')
}

interface Props {
  tasks: Task[]
  isMobile: boolean
  usuario: Usuario
  onOpenTask: (t: Task) => void
}

export default function AgendaView({ tasks, isMobile, usuario, onOpenTask }: Props) {
  const origensVisiveis = ORIGENS.filter(o => usuario.papel === 'dono' || !o.soDono)
  const [camadas, setCamadas] = useState<Origem[]>(TODAS)
  const [range, setRange] = useState<{ de: string; ate: string } | null>(null)
  const [itens, setItens] = useState<ItemAgenda[]>([])
  const [avisos, setAvisos] = useState<string[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState<ItemAgenda | null>(null)

  useEffect(() => { setCamadas(lerCamadas()) }, [])

  const carregar = useCallback(async () => {
    if (!range) return
    setCarregando(true)
    setErro('')
    try {
      const r = await buscarAgenda(range.de, range.ate)
      setItens(r.itens)
      setAvisos(r.avisos)
    } catch {
      setErro('Não foi possível carregar a agenda. Verifique se o servidor está online.')
    } finally {
      setCarregando(false)
    }
  }, [range])

  useEffect(() => { carregar() }, [carregar])

  const alternar = (o: Origem) => {
    setCamadas(atual => {
      const novo = atual.includes(o) ? atual.filter(x => x !== o) : [...atual, o]
      try { localStorage.setItem(CAMADAS_LS, JSON.stringify(novo)) } catch { /* sem storage */ }
      return novo
    })
  }

  const eventos: EventInput[] = useMemo(() => itens
    .filter(i => camadas.includes(i.origem))
    .map(i => ({
      id: i.chave,
      title: i.titulo,
      start: i.inicio,
      end: i.fim,
      allDay: i.dia_inteiro,
      backgroundColor: corDa(i.origem),
      borderColor: corDa(i.origem),
      textColor: '#050c1a',
      classNames: i.feito ? ['ev-feito'] : [],
      extendedProps: { item: i },
    })), [itens, camadas])

  const contagem = useMemo(() => {
    const c: Partial<Record<Origem, number>> = {}
    for (const i of itens) c[i.origem] = (c[i.origem] ?? 0) + 1
    return c
  }, [itens])

  const aoMudarDatas = (a: DatesSetArg) => {
    const de = format(a.start, 'yyyy-MM-dd')
    const ate = format(addDays(a.end, -1), 'yyyy-MM-dd')
    setRange(r => (r && r.de === de && r.ate === ate ? r : { de, ate }))
  }

  const aoClicar = (a: EventClickArg) => {
    a.jsEvent.preventDefault()
    setAberto(a.event.extendedProps.item as ItemAgenda)
  }

  const taskDoItem = aberto?.board === 'vi2d' ? tasks.find(t => t.id === aberto.id) : undefined

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {origensVisiveis.map(o => {
          const ligada = camadas.includes(o.id)
          return (
            <button
              key={o.id}
              onClick={() => alternar(o.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                ligada ? 'text-[#e8f4f8] border-[rgba(0,229,255,0.2)] bg-[#0a1628]' : 'text-[#7a9bbf]/60 border-transparent bg-transparent line-through'
              }`}
              title={ligada ? 'Esconder esta camada' : 'Mostrar esta camada'}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: o.cor, opacity: ligada ? 1 : 0.35 }} />
              {o.nome}
              {contagem[o.id] ? <span className="text-[#7a9bbf]">{contagem[o.id]}</span> : null}
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={carregar} disabled={carregando} title="Recarregar agenda"
            className="p-1.5 rounded-lg text-[#7a9bbf] hover:text-[#00e5ff] disabled:opacity-40">
            <RefreshCw size={14} className={carregando ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {(erro || avisos.length > 0) && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{[erro, ...avisos].filter(Boolean).join(' · ')}</span>
        </div>
      )}

      <div className="agenda-vi2d bg-[#0a1628] border border-[rgba(0,229,255,0.1)] rounded-xl p-2 md:p-3">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          locale={ptBr}
          initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
          headerToolbar={isMobile
            ? { left: 'prev,next', center: 'title', right: 'today' }
            : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
          footerToolbar={isMobile ? { center: 'dayGridMonth,timeGridDay,listWeek' } : undefined}
          buttonText={{ listWeek: 'lista' }}
          height={isMobile ? 'auto' : 'calc(100dvh - 230px)'}
          slotMinTime="06:00:00"
          scrollTime="07:30:00"
          nowIndicator
          allDayText="dia todo"
          dayMaxEvents={4}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          events={eventos}
          datesSet={aoMudarDatas}
          eventClick={aoClicar}
          noEventsText="Nada nesta semana"
        />
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4" onClick={() => setAberto(null)}>
          <div className="w-full md:max-w-md bg-[#0a1628] border border-[rgba(0,229,255,0.15)] rounded-t-2xl md:rounded-2xl p-5 space-y-3 max-h-[85dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: corDa(aberto.origem) + '22', color: corDa(aberto.origem) }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: corDa(aberto.origem) }} />
                  {nomeDa(aberto.origem)}
                  {aberto.feito && ' · feito'}
                </span>
                <h3 className={`text-[#e8f4f8] font-semibold leading-snug ${aberto.feito ? 'line-through opacity-70' : ''}`}>{aberto.titulo}</h3>
              </div>
              <button onClick={() => setAberto(null)} className="p-1 text-[#7a9bbf] hover:text-[#e8f4f8]"><X size={18} /></button>
            </div>

            <p className="text-sm text-[#7a9bbf] first-letter:uppercase flex items-center gap-1.5">
              {quandoTexto(aberto)}
              {aberto.repete && <Repeat size={12} />}
            </p>

            {aberto.responsavel.length > 0 && (
              <p className="text-xs text-[#7a9bbf]">Responsável: {aberto.responsavel.join(', ')}</p>
            )}

            {aberto.descricao && (
              <p className="text-sm text-[#e8f4f8]/90 whitespace-pre-wrap break-words">{aberto.descricao}</p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {aberto.link && (
                <a href={aberto.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00e5ff] text-[#050c1a] text-sm font-medium">
                  <Video size={14} /> Entrar na reunião
                </a>
              )}
              {taskDoItem && (
                <button onClick={() => { setAberto(null); onOpenTask(taskDoItem) }}
                  className="px-3 py-1.5 rounded-lg border border-[rgba(0,229,255,0.25)] text-[#e8f4f8] text-sm">
                  Abrir card
                </button>
              )}
              {aberto.google_url && (
                <a href={aberto.google_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(0,229,255,0.15)] text-[#7a9bbf] text-sm hover:text-[#e8f4f8]">
                  <ExternalLink size={14} /> Abrir no Google
                </a>
              )}
            </div>
            {aberto.board === 'vnc' && (
              <p className="text-xs text-[#7a9bbf]/80">Esta tarefa mora no Kanban VNC ({nomeDa(aberto.origem)}).</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
