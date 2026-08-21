'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface PageMeta {
  title: string
  subtitle: string
}

function getPageMeta(pathname: string): PageMeta {
  if (pathname === '/admin/dashboard') {
    return { title: 'Gestión de Juventudes', subtitle: 'Resumen general de los registros' }
  }
  if (pathname === '/admin/registros') {
    return { title: 'Registros', subtitle: 'Jóvenes registrados en el formulario' }
  }
  if (pathname.startsWith('/admin/registros/')) {
    return { title: 'Ficha del registro', subtitle: 'Detalle y edición' }
  }
  if (pathname.startsWith('/admin/usuarios')) {
    return { title: 'Usuarios', subtitle: 'Administradores y coordinadores del panel' }
  }
  if (pathname === '/admin/eventos/nuevo') {
    return { title: 'Crear evento', subtitle: 'Nuevo evento de juventudes' }
  }
  if (pathname === '/admin/eventos') {
    return { title: 'Eventos', subtitle: 'Eventos de juventudes' }
  }
  if (pathname.startsWith('/admin/eventos/')) {
    return { title: 'Detalle del evento', subtitle: 'Inscripciones, inventario y tareas' }
  }
  return { title: 'Panel', subtitle: '' }
}

function timeAgoLabel(seconds: number): string {
  if (seconds < 8) return 'ahora mismo'
  if (seconds < 60) return `hace ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `hace ${hours} h`
}

export default function Topbar() {
  const pathname = usePathname()
  const { title, subtitle } = getPageMeta(pathname)

  const [lastSync, setLastSync] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    setLastSync(Date.now())
  }, [])

  useEffect(() => {
    if (lastSync === null) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - lastSync) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [lastSync])

  function handleRefresh() {
    setSpinning(true)
    setLastSync(Date.now())
    setElapsed(0)
    window.dispatchEvent(new Event('mira:refresh'))
    setTimeout(() => setSpinning(false), 600)
  }

  return (
    <header
      className="h-[68px] flex-shrink-0 sticky top-0 z-30 flex items-center justify-between px-8 border-b border-border"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.86)' }}
    >
      <div className="min-w-0">
        <h1 className="text-[19px] font-semibold text-ink leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-[12.5px] text-ink-muted leading-tight truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {lastSync !== null && (
          <div className="hidden sm:flex items-center gap-2 text-[12.5px] text-ink-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-40 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Sincronizado {timeAgoLabel(elapsed)}
          </div>
        )}
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas transition duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
        >
          <RefreshCw className={'w-4 h-4' + (spinning ? ' animate-spin' : '')} strokeWidth={1.8} />
          Actualizar
        </button>
      </div>
    </header>
  )
}
