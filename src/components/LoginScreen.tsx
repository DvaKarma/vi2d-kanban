'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api, type Usuario } from '@/lib/api'

export default function LoginScreen({ onEntrar }: { onEntrar: (u: Usuario) => void }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const r = await api.login(usuario.trim(), senha)
      onEntrar({ usuario: r.usuario, nome: r.nome, papel: r.papel })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar')
    } finally {
      setEnviando(false)
    }
  }

  const campo = 'w-full bg-[#050c1a] border border-[rgba(0,229,255,0.15)] rounded-lg px-3 py-2.5 text-sm text-[#e8f4f8] focus:outline-none focus:border-[#00e5ff]'

  return (
    <div className="min-h-dvh bg-[#050c1a] flex items-center justify-center px-4">
      <form onSubmit={entrar} className="w-full max-w-sm bg-[#0a1628] border border-[rgba(0,229,255,0.15)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" />
          <span className="text-sm font-semibold text-[#e8f4f8] tracking-wide">KANBAN VI2D</span>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-[#7a9bbf]" htmlFor="usuario">Usuário</label>
          <input id="usuario" autoComplete="username" autoCapitalize="none" value={usuario}
            onChange={e => setUsuario(e.target.value)} className={campo} autoFocus />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-[#7a9bbf]" htmlFor="senha">Senha</label>
          <input id="senha" type="password" autoComplete="current-password" value={senha}
            onChange={e => setSenha(e.target.value)} className={campo} />
        </div>
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button type="submit" disabled={enviando || !usuario || !senha}
          className="w-full flex items-center justify-center gap-2 bg-[#00e5ff] text-[#050c1a] font-medium rounded-lg py-2.5 text-sm hover:opacity-90 disabled:opacity-50">
          {enviando && <Loader2 size={14} className="animate-spin" />}
          Entrar
        </button>
      </form>
    </div>
  )
}
