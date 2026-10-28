'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarClock, ChevronRight, ClipboardList, Plus } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Eyebrow } from '@/components/admin/ui'
import { cn } from '@/lib/cn'
import { formatFechaLimite, tareaVencida, type Tarea } from '../../_types'
import { useCurso } from '../_curso'
import { TareaModal, estadoTarea } from './_form'

function ordenar(a: Tarea, b: Tarea): number {
  const fa = a.fechaLimite ? new Date(a.fechaLimite).getTime() : Infinity
  const fb = b.fechaLimite ? new Date(b.fechaLimite).getTime() : Infinity
  return fa - fb
}

export default function TareasPage() {
  const { course, esAdmin, refetch } = useCurso()
  const [creando, setCreando] = useState(false)
  const base = `/admin/estudio/${course._id}/tareas`

  const proximas = course.tareas.filter((t) => !tareaVencida(t)).sort(ordenar)
  const pasadas = course.tareas.filter((t) => tareaVencida(t)).sort((a, b) => ordenar(b, a))

  function lista(titulo: string, tareas: Tarea[]) {
    if (tareas.length === 0) return null
    return (
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-surface-muted">
          <Eyebrow>{titulo}</Eyebrow>
        </div>
        <ul className="divide-y divide-[#F1F2F5]">
          {tareas.map((t) => {
            const estado = estadoTarea(t, esAdmin)
            return (
              <li key={t._id}>
                <Link href={`${base}/${t._id}`} className="flex items-center gap-3.5 px-5 py-4 hover:bg-surface-muted transition-colors duration-150">
                  <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0', t.publicada ? 'bg-primary-tint' : 'bg-canvas')}>
                    <ClipboardList className={cn('w-[18px] h-[18px]', t.publicada ? 'text-primary' : 'text-ink-faint')} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-ink truncate">{t.titulo}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink-muted mt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5" strokeWidth={1.8} />
                        {t.fechaLimite ? `Vence ${formatFechaLimite(t.fechaLimite)}` : 'Sin fecha límite'}
                      </span>
                      <span>{t.puntajeMaximo} puntos</span>
                    </p>
                  </div>
                  <Badge tone={estado.tone} className="hidden sm:inline-flex">
                    {estado.label}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0" strokeWidth={1.8} />
                </Link>
                <div className="sm:hidden px-5 pb-3 -mt-2 pl-[70px]">
                  <Badge tone={estado.tone}>{estado.label}</Badge>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-[18px] font-extrabold text-ink tracking-[-0.01em]">Tareas</h3>
          <p className="text-[13px] text-ink-muted">
            {esAdmin ? 'Crea tareas con fecha límite, revisa las entregas y califícalas.' : 'Entrega tus tareas antes de la fecha límite.'}
          </p>
        </div>
        {esAdmin && (
          <Button icon={<Plus className="w-4 h-4" strokeWidth={1.8} />} onClick={() => setCreando(true)}>
            Nueva tarea
          </Button>
        )}
      </div>

      {course.tareas.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="Todavía no hay tareas"
            description={esAdmin ? 'Crea la primera tarea para que los coordinadores entreguen archivos o respuestas escritas.' : 'Cuando haya tareas para entregar aparecerán aquí.'}
          />
        </Card>
      ) : (
        <>
          {lista('Próximas', proximas)}
          {lista('Pasadas', pasadas)}
        </>
      )}

      {esAdmin && (
        <TareaModal
          key={creando ? 'abierto' : 'cerrado'}
          open={creando}
          onClose={() => setCreando(false)}
          courseId={course._id}
          onSaved={() => {
            setCreando(false)
            void refetch()
          }}
        />
      )}
    </div>
  )
}
