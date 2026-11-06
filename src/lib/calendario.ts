// Aba Agenda: le a rota /calendario da fleet-api (VI2D + Kanban VNC + Google Agenda).
// Etapa 1 = so leitura. A chave fica so no navegador de quem digitou (localStorage).

const BASE = process.env.NEXT_PUBLIC_CAL_URL ?? '/cal'
const CHAVE_LS = 'vi2d_cal_key'

export type Origem = 'vi2d' | 'cvent' | 'pa' | 'vnctec' | 'pessoal' | 'casa' | 'google'

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

export const ORIGENS: { id: Origem; nome: string; cor: string }[] = [
  { id: 'vi2d', nome: 'VI2D', cor: '#00e5ff' },
  { id: 'cvent', nome: 'Cvent', cor: '#33b679' },
  { id: 'pa', nome: 'PA', cor: '#f4801e' },
  { id: 'vnctec', nome: 'VNC', cor: '#5b8def' },
  { id: 'pessoal', nome: 'Pessoal', cor: '#a78bfa' },
  { id: 'google', nome: 'Google', cor: '#9aa8bd' },
]

export const corDa = (o: Origem) => ORIGENS.find(x => x.id === o)?.cor ?? '#9aa8bd'
export const nomeDa = (o: Origem) => ORIGENS.find(x => x.id === o)?.nome ?? o

export class SemChave extends Error {}

export function lerChave(): string {
  try { return localStorage.getItem(CHAVE_LS) ?? '' } catch { return '' }
}

export function gravarChave(v: string) {
  try {
    if (v) localStorage.setItem(CHAVE_LS, v)
    else localStorage.removeItem(CHAVE_LS)
  } catch { /* navegador sem storage: pede a chave de novo na proxima vez */ }
}

export async function buscarAgenda(de: string, ate: string, chave: string): Promise<RespostaAgenda> {
  if (!chave) throw new SemChave()
  const res = await fetch(`${BASE}/calendario?de=${de}&ate=${ate}`, { headers: { 'X-Cal-Key': chave } })
  if (res.status === 401) throw new SemChave()
  if (!res.ok) throw new Error(`Agenda ${res.status}`)
  const r: RespostaAgenda = await res.json()
  if (!r.ok) throw new Error(r.erro || 'Agenda indisponível')
  return r
}
