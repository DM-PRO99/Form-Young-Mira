'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, RefreshCw } from 'lucide-react'

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
  if (pathname === '/admin/estudio') {
    return { title: 'Estudio', subtitle: 'Cursos y material de formación' }
  }
  if (pathname === '/admin/estudio/nuevo') {
    return { title: 'Nuevo curso', subtitle: 'Material de formación' }
  }
  if (pathname.endsWith('/reporte') && pathname.startsWith('/admin/estudio/')) {
    return { title: 'Reporte de avance', subtitle: 'Avance y notas del equipo en el curso' }
  }
  if (pathname.endsWith('/editar') && pathname.startsWith('/admin/estudio/')) {
    return { title: 'Editar curso', subtitle: 'Módulos, lecciones y archivos' }
  }
  if (pathname.startsWith('/admin/estudio/')) {
    return { title: 'Curso', subtitle: 'Material de formación' }
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

export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
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
    <header className="h-14 md:h-[64px] flex-shrink-0 sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-8 border-b border-border bg-white/[0.86] backdrop-blur-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="press lg:hidden -ml-1.5 p-2 rounded-[10px] text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
        >
          <Menu className="w-5 h-5" strokeWidth={1.8} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[17px] md:text-[20px] font-extrabold text-ink leading-tight tracking-[-0.01em] truncate">{title}</h1>
          {subtitle && <p className="hidden sm:block text-[12.5px] text-ink-muted leading-tight truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {lastSync !== null && (
          <div className="hidden md:flex items-center gap-2 text-[12.5px] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Sincronizado {timeAgoLabel(elapsed)}
          </div>
        )}
        <button
          onClick={handleRefresh}
          aria-label="Actualizar"
          className="press flex items-center gap-2 h-9 px-2.5 sm:px-3.5 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
        >
          <RefreshCw className={'w-4 h-4' + (spinning ? ' animate-spin' : '')} strokeWidth={1.8} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </header>
  )
}
