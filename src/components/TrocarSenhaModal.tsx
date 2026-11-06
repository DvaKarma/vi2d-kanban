'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function TrocarSenhaModal({ onClose }: { onClose: () => void }) {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [repete, setRepete] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (nova.length < 8) return setErro('A nova senha precisa de pelo menos 8 caracteres.')
    if (nova !== repete) return setErro('As duas senhas novas não são iguais.')
    setEnviando(true)
    try {
      await api.trocarSenha(atual, nova)
      setOk(true)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível trocar a senha')
    } finally {
      setEnviando(false)
    }
  }

  const campo = 'w-full bg-[#050c1a] border border-[rgba(0,229,255,0.15)] rounded-lg px-3 py-2 text-sm text-[#e8f4f8] focus:outline-none focus:border-[#00e5ff]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onSubmit={salvar} onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0a1628] border border-[rgba(0,229,255,0.15)] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[#e8f4f8] font-semibold">Trocar senha</h3>
          <button type="button" onClick={onClose} className="p-1 text-[#7a9bbf] hover:text-[#e8f4f8]"><X size={18} /></button>
        </div>
        {ok ? (
          <>
            <p className="text-sm text-[#e8f4f8]">Senha trocada. Nos outros aparelhos vai pedir login de novo.</p>
            <button type="button" onClick={onClose} className="w-full bg-[#00e5ff] text-[#050c1a] font-medium rounded-lg py-2 text-sm">Fechar</button>
          </>
        ) : (
          <>
            <input type="password" autoComplete="current-password" placeholder="Senha atual" value={atual}
              onChange={e => setAtual(e.target.value)} className={campo} autoFocus />
            <input type="password" autoComplete="new-password" placeholder="Nova senha (mínimo 8)" value={nova}
              onChange={e => setNova(e.target.value)} className={campo} />
            <input type="password" autoComplete="new-password" placeholder="Repita a nova senha" value={repete}
              onChange={e => setRepete(e.target.value)} className={campo} />
            {erro && <p className="text-sm text-red-400">{erro}</p>}
            <button type="submit" disabled={enviando || !atual || !nova || !repete}
              className="w-full flex items-center justify-center gap-2 bg-[#00e5ff] text-[#050c1a] font-medium rounded-lg py-2 text-sm hover:opacity-90 disabled:opacity-50">
              {enviando && <Loader2 size={14} className="animate-spin" />}
              Salvar
            </button>
          </>
        )}
      </form>
    </div>
  )
}
