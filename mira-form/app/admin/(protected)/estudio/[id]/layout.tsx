'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { BarChart3, ClipboardCheck, ClipboardList, GraduationCap, Home, Layers, Lock, Pencil, ScrollText } from 'lucide-react'
import { BackLink, Badge, Button } from '@/components/admin/ui'
import { cn } from '@/lib/cn'
import { courseGradient, tareaVencida } from '../_types'
import { CursoProvider, useCursoEstado } from './_curso'

// Editar y Reporte son pantallas completas del admin: no llevan el menú del curso.
const SIN_MENU = /\/(editar|reporte)$/

export default function CursoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { id } = useParams<{ id: string }>()
  if (SIN_MENU.test(pathname)) return <>{children}</>
  return (
    <CursoProvider id={id}>
      <CursoShell id={id}>{children}</CursoShell>
    </CursoProvider>
  )
}

function CursoShell({ id, children }: { id: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { course, loading, esAdmin } = useCursoEstado()

  if (loading) {
    return (
      <div className="admin-view">
        <div className="h-4 w-28 bg-zinc-100 rounded animate-pulse mb-4" />
        <div className="h-6 w-72 bg-zinc-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr] gap-6">
          <div className="h-[260px] bg-surface rounded-card border border-border animate-pulse hidden xl:block" />
          <div className="h-[420px] bg-surface rounded-card border border-border animate-pulse" />
        </div>
      </div>
    )
  }
  if (!course) {
    return (
      <div className="admin-view">
        <BackLink href="/admin/estudio">Volver a estudio</BackLink>
        <div className="py-16 text-center text-ink-muted text-sm">Curso no encontrado.</div>
      </div>
    )
  }

  const estados = course.estadoModulos ?? []
  const totalPasos = estados.reduce((s, e) => s + e.totalLecciones + (e.tieneCuestionario ? 1 : 0), 0)
  const pasosHechos = estados.reduce((s, e) => s + e.leccionesVistas + (e.tieneCuestionario && e.aprobado ? 1 : 0), 0)
  const pct = totalPasos > 0 ? (pasosHechos / totalPasos) * 100 : 0
  const cursoCompleto = estados.length > 0 && estados.every((e) => e.completo)

  const tareasPendientes = esAdmin
    ? course.tareas.reduce((s, t) => s + (t.sinCalificar ?? 0), 0)
    : course.tareas.filter((t) => !t.miEntrega && !tareaVencida(t)).length

  const base = `/admin/estudio/${id}`
  const items = [
    { href: base, label: 'Inicio', icon: Home, exact: true },
    { href: `${base}/programa`, label: 'Programa del curso', icon: ScrollText },
    { href: `${base}/modulos`, label: 'Módulos', icon: Layers },
    { href: `${base}/tareas`, label: 'Tareas', icon: ClipboardList, count: tareasPendientes },
    { href: `${base}/evaluaciones`, label: 'Evaluaciones', icon: ClipboardCheck },
    { href: `${base}/calificaciones`, label: 'Calificaciones', icon: GraduationCap },
  ]
  const activo = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`))

  return (
    <div className="admin-view">
      <BackLink href="/admin/estudio">Volver a estudio</BackLink>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="w-11 h-11 rounded-[12px] flex-shrink-0 bg-cover bg-center"
            style={{ background: course.portadaUrl ? `center / cover no-repeat url("${course.portadaUrl}")` : courseGradient(course._id) }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-0.5 flex-wrap">
              <h2 className="text-[20px] md:text-[22px] font-extrabold text-ink tracking-[-0.015em] truncate">{course.titulo}</h2>
              {course.estado === 'borrador' && <Badge tone="neutral">Borrador</Badge>}
              {course.desbloqueoSecuencial && (
                <Badge tone="violet">
                  <Lock className="w-3 h-3" strokeWidth={2.2} />
                  En orden
                </Badge>
              )}
            </div>
            {course.descripcion && <p className="text-[13px] text-ink-muted max-w-2xl">{course.descripcion}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          <div className="w-[190px]">
            <p className="text-[11.5px] text-ink-muted mb-1 flex justify-between">
              <span>Tu avance</span>
              <span className="font-mono tabular-nums">{Math.round(pct)}%</span>
            </p>
            <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
              <div className={cn('progress-fill h-full w-full rounded-full', cursoCompleto ? 'bg-success' : 'bg-primary')} style={{ transform: `scaleX(${pct / 100})` }} />
            </div>
          </div>
          {esAdmin && (
            <>
              <Button variant="secondary" size="sm" icon={<BarChart3 className="w-3.5 h-3.5" strokeWidth={1.8} />} onClick={() => router.push(`${base}/reporte`)}>
                Reporte
              </Button>
              <Button variant="secondary" size="sm" icon={<Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />} onClick={() => router.push(`${base}/editar`)}>
                Editar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr] gap-4 xl:gap-6 items-start">
        {/* Menú del curso: vertical en escritorio (como Canvas) y pestañas desplazables en pantallas pequeñas */}
        <nav aria-label="Secciones del curso" className="xl:sticky xl:top-[88px] -mx-4 px-4 xl:mx-0 xl:px-0 overflow-x-auto xl:overflow-visible">
          <ul className="flex xl:flex-col gap-1 min-w-max xl:min-w-0 border-b border-border xl:border-b-0 pb-px xl:pb-0">
            {items.map((it) => {
              const on = activo(it.href, it.exact)
              const Icon = it.icon
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    aria-current={on ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-2.5 px-3 py-2.5 xl:py-2 text-[13px] whitespace-nowrap transition-colors duration-150',
                      'xl:rounded-[10px]',
                      on
                        ? 'text-primary font-semibold xl:bg-primary-tint after:absolute after:left-2 after:right-2 after:-bottom-px after:h-[2px] after:bg-primary after:rounded-full xl:after:hidden'
                        : 'text-ink-muted hover:text-ink xl:hover:bg-canvas'
                    )}
                  >
                    {on && <span className="hidden xl:block absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary" />}
                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                    <span className="flex-1">{it.label}</span>
                    {!!it.count && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10.5px] font-bold flex items-center justify-center tabular-nums">
                        {it.count}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
