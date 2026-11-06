// Aba Agenda: le /calendario da API do Kanban VI2D (que repassa para a fleet-api).
// Socio (Igor) recebe so VI2D, Cvent e PA; o servidor ja filtra.
import { api } from './api'

export type Origem = 'vi2d' | 'cvent' | 'pa' | 'vnctec' | 'pessoal'

export interface ItemAgenda {
  chave: string
  origem: Origem
  board: 'vi2d' | 'vnc' | null
  id: number | null
  titulo: string
  status: string
  descricao: string
  prioridade: string | null
  responsavel: string[]
  link: string
  gcal: string | null
  google_url: string
  inicio: string
  fim: string
  dia_inteiro: boolean
  repete: boolean
  feito: boolean
}

export interface RespostaAgenda {
  ok: boolean
  itens: ItemAgenda[]
  avisos: string[]
  erro?: string
}

export const ORIGENS: { id: Origem; nome: string; cor: string; soDono?: boolean }[] = [
  { id: 'vi2d', nome: 'VI2D', cor: '#00e5ff' },
  { id: 'cvent', nome: 'Cvent', cor: '#33b679' },
  { id: 'pa', nome: 'PA', cor: '#f4801e' },
  { id: 'vnctec', nome: 'VNC', cor: '#5b8def', soDono: true },
  { id: 'pessoal', nome: 'Pessoal', cor: '#a78bfa', soDono: true },
]

export const corDa = (o: Origem) => ORIGENS.find(x => x.id === o)?.cor ?? '#9aa8bd'
export const nomeDa = (o: Origem) => ORIGENS.find(x => x.id === o)?.nome ?? o

export async function buscarAgenda(de: string, ate: string): Promise<RespostaAgenda> {
  const r = (await api.calendario(de, ate)) as RespostaAgenda
  if (!r.ok) throw new Error(r.erro || 'Agenda indisponível')
  return r
}
