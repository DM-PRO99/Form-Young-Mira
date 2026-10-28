'use client'

import Link from 'next/link'
import { ChevronRight, ClipboardCheck, Lock } from 'lucide-react'
import { Badge, Card, EmptyState, type BadgeTone } from '@/components/admin/ui'
import { cn } from '@/lib/cn'
import { useCurso } from '../_curso'

export default function EvaluacionesPage() {
  const { course, esAdmin } = useCurso()
  const estados = course.estadoModulos ?? []
  const cuestionarios = course.modulos
    .map((m, mi) => ({ m, mi, est: estados[mi] }))
    .filter(({ m, est }) => est?.tieneCuestionario && (m.cuestionario?.totalPreguntas ?? m.cuestionario?.preguntas.length ?? 0) > 0)

  const aprobados = cuestionarios.filter((c) => c.est?.aprobado).length

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[18px] font-extrabold text-ink tracking-[-0.01em]">Evaluaciones</h3>
        <p className="text-[13px] text-ink-muted">
          {esAdmin
            ? 'Cuestionarios de cada tema. Se crean y editan en «Editar» › Cuestionario del tema.'
            : `Has aprobado ${aprobados} de ${cuestionarios.length} cuestionario${cuestionarios.length === 1 ? '' : 's'}.`}
        </p>
      </div>

      {cuestionarios.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardCheck} title="Este curso no tiene evaluaciones" description="Cuando un tema tenga cuestionario aparecerá aquí." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-[#F1F2F5]">
            {cuestionarios.map(({ m, mi, est }) => {
              const bloqueado = !!est?.bloqueado && !esAdmin
              const total = m.cuestionario?.totalPreguntas ?? m.cuestionario?.preguntas.length ?? 0
              let estado: { label: string; tone: BadgeTone } = { label: 'Sin presentar', tone: 'neutral' }
              if (bloqueado) estado = { label: 'Bloqueado', tone: 'neutral' }
              else if (est?.aprobado) estado = { label: `Aprobado · ${est.mejorPuntaje}%`, tone: 'success' }
              else if (est?.mejorPuntaje !== null && est?.mejorPuntaje !== undefined) estado = { label: `No aprobado · ${est.mejorPuntaje}%`, tone: 'warning' }

              const contenido = (
                <>
                  <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0', bloqueado ? 'bg-canvas' : 'bg-success-tint')}>
                    {bloqueado ? (
                      <Lock className="w-4 h-4 text-ink-faint" strokeWidth={1.8} />
                    ) : (
                      <ClipboardCheck className="w-[18px] h-[18px] text-success" strokeWidth={1.8} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-ink-faint uppercase tracking-[0.08em]">Tema {mi + 1}</p>
                    <p className="text-[14px] font-semibold text-ink truncate">Cuestionario · {m.titulo}</p>
                    <p className="text-[12px] text-ink-muted mt-0.5">
                      {total} pregunta{total === 1 ? '' : 's'} · nota mínima {m.cuestionario?.notaMinima ?? 70}%
                      {bloqueado && ' · completa el tema anterior para presentarlo'}
                    </p>
                  </div>
                  <Badge tone={estado.tone} className="flex-shrink-0">
                    {estado.label}
                  </Badge>
                  {!bloqueado && <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0 hidden sm:block" strokeWidth={1.8} />}
                </>
              )

              return (
                <li key={m._id ?? mi}>
                  {bloqueado ? (
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 px-5 py-4 opacity-70">{contenido}</div>
                  ) : (
                    <Link
                      href={`/admin/estudio/${course._id}/modulos?paso=quiz:${mi}`}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 px-5 py-4 hover:bg-surface-muted transition-colors duration-150"
                    >
                      {contenido}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
