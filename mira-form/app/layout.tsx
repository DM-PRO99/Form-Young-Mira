import '../styles/tailwind.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Encuesta Juventudes MIRA',
  description: 'Formulario para consolidar el grupo - Juventudes MIRA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
