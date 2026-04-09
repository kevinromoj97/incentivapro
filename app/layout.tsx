import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TuTableroDOR — Plataforma DOR 2026',
  description: 'Control de incentivos, puntos DOR y ranking para la Red Empresas e Instituciones BBVA México.',
  keywords: ['DOR', 'incentivos', 'BBVA', 'ranking', 'ejecutivos'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  )
}
