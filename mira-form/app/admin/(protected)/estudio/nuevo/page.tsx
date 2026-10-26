'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150'

export default function NuevoCursoPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) {
      toast.error('El título es requerido')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/estudio/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descripcion: descripcion || undefined }),
      })
      const json = (await res.json()) as { data?: { _id: string }; error?: string }
      if (!res.ok || !json.data) throw new Error(json.error ?? 'Error al crear el curso')
      router.push(`/admin/estudio/${json.data._id}/editar`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el curso')
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-view">
      <Link
        href="/admin/estudio"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-primary transition-transform duration-150 hover:-translate-x-0.5 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
        Volver a estudio
      </Link>

      <form onSubmit={handleSubmit} className="bg-surface rounded-card border border-border shadow-card p-7 max-w-xl space-y-5">
        <div>
          <label className="block text-[13px] font-medium text-ink mb-1.5">Título del curso</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Ej. Liderazgo juvenil"
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-ink mb-1.5">Descripción (opcional)</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className={INPUT_CLASS + ' resize-none'}
            placeholder="De qué trata el curso..."
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary-3d px-4 py-2.5 text-[13.5px] text-white rounded-field font-medium disabled:opacity-60"
        >
          Crear y agregar contenido
        </button>
      </form>
    </div>
  )
}
