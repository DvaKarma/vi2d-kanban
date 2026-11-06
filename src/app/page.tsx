'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import KanbanBoard from '@/components/KanbanBoard'
import LoginScreen from '@/components/LoginScreen'
import { api, getToken, EVENTO_SAIR, type Usuario } from '@/lib/api'

export default function Home() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [conferindo, setConferindo] = useState(true)

  useEffect(() => {
    const sair = () => setUsuario(null)
    window.addEventListener(EVENTO_SAIR, sair)
    if (!getToken()) {
      setConferindo(false)
    } else {
      api.eu().then(setUsuario).catch(() => setUsuario(null)).finally(() => setConferindo(false))
    }
    return () => window.removeEventListener(EVENTO_SAIR, sair)
  }, [])

  if (conferindo) {
    return (
      <div className="min-h-dvh bg-[#050c1a] flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#00e5ff]" />
      </div>
    )
  }
  if (!usuario) return <LoginScreen onEntrar={setUsuario} />
  return <KanbanBoard usuario={usuario} onSair={async () => { await api.sair(); setUsuario(null) }} />
}
