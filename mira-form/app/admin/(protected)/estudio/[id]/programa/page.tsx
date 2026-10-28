'use client'

import Link from 'next/link'
import { Pencil, ScrollText } from 'lucide-react'
import { Card, EmptyState, Eyebrow, buttonClass } from '@/components/admin/ui'
import { Teoria, useCurso } from '../_curso'

export default function ProgramaCursoPage() {
  const { course, esAdmin } = useCurso()
  const editar = `/admin/estudio/${course._id}/editar#programa`

  return (
    <Card className="p-5 md:p-7">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <Eyebrow className="mb-1">Programa del curso</Eyebrow>
          <h3 className="text-[20px] font-extrabold text-ink leading-tight tracking-[-0.01em]">{course.titulo}</h3>
        </div>
        {esAdmin && course.programa && (
          <Link href={editar} className={buttonClass('secondary', 'sm')}>
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
            Editar
          </Link>
        )}
      </div>

      {course.programa ? (
        <Teoria html={course.programa} />
      ) : (
        <EmptyState
          icon={ScrollText}
          className="py-8"
          title="Todavía no hay programa"
          description={
            esAdmin
              ? 'Escribe los objetivos, la metodología, el cronograma y cómo se evalúa el curso.'
              : 'El administrador aún no ha publicado el programa de este curso.'
          }
          action={
            esAdmin ? (
              <Link href={editar} className={buttonClass('secondary', 'sm')}>
                <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
                Escribir el programa
              </Link>
            ) : undefined
          }
        />
      )}
    </Card>
  )
}
