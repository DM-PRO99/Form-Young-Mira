import '../styles/tailwind.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Encuesta Juventudes MIRA',
  description: 'Formulario para consolidar el grupo - Juventudes MIRA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-miraBlue/90 text-slate-900 antialiased">
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
