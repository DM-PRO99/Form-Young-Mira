'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import { BackLink, Button, Card, CardHeader, Field, Input, Textarea } from '@/components/admin/ui'

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
      <BackLink href="/admin/estudio">Volver a estudio</BackLink>

      <Card className="max-w-xl">
        <CardHeader title="Nuevo curso" description="Después podrás agregar módulos y subir videos, PDFs y presentaciones." />
        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 md:p-6 space-y-5">
          <Field label="Título del curso">
            {(id) => <Input id={id} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Liderazgo juvenil" autoFocus />}
          </Field>
          <Field label="Descripción" hint="Opcional. Aparece en la tarjeta del curso.">
            {(id) => <Textarea id={id} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="De qué trata el curso…" />}
          </Field>
          <Button type="submit" loading={submitting} className="w-full sm:w-auto">
            Crear y agregar contenido
            <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
          </Button>
        </form>
      </Card>
    </div>
  )
}
