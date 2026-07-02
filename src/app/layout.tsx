import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kanban — VI2D',
  description: 'Kanban compartilhado VI2D self-hosted',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  )
}
