'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { uploadPresigned } from '@vercel/blob/client'
import { Button, Field, Input, Modal, type BadgeTone } from '@/components/admin/ui'
import { cn } from '@/lib/cn'
import { tareaVencida, type Tarea } from '../../_types'
import { RichTextEditor, Switch } from '../editar/_partes'

function aInputLocal(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function safeFileName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-')
}

function Check({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 p-3 rounded-[12px] border cursor-pointer transition-colors duration-150',
        checked ? 'border-primary bg-primary-tint/60' : 'border-border-input hover:border-primary/40'
      )}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-primary w-4 h-4 mt-0.5" />
      <span>
        <span className="block text-[13px] font-semibold text-ink">{label}</span>
        <span className="block text-[12px] text-ink-muted">{hint}</span>
      </span>
    </label>
  )
}

// Crear o editar una tarea. Se monta con `key` para reiniciar el formulario al abrir otra tarea.
export function TareaModal({
  open,
  onClose,
  courseId,
  tarea,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  courseId: string
  tarea?: Tarea | null
  onSaved: (t: Tarea) => void
}) {
  const [titulo, setTitulo] = useState(tarea?.titulo ?? '')
  const [instrucciones, setInstrucciones] = useState(tarea?.instrucciones ?? '')
  const [fecha, setFecha] = useState(aInputLocal(tarea?.fechaLimite))
  const [puntaje, setPuntaje] = useState(String(tarea?.puntajeMaximo ?? 100))
  const [entregaArchivo, setEntregaArchivo] = useState(tarea?.entregaArchivo ?? true)
  const [entregaTexto, setEntregaTexto] = useState(tarea?.entregaTexto ?? true)
  const [publicada, setPublicada] = useState(tarea?.publicada ?? true)
  const [saving, setSaving] = useState(false)

  async function uploadImage(file: File): Promise<string> {
    const blob = await uploadPresigned(`estudio/${courseId}/img/${safeFileName(file.name)}`, file, {
      access: 'public',
      handleUploadUrl: '/api/estudio/upload',
      clientPayload: 'imagen',
    })
    return blob.url
  }

  async function guardar() {
    const puntajeMaximo = Number(puntaje)
    if (!titulo.trim()) return toast.error('La tarea necesita un título')
    if (!Number.isInteger(puntajeMaximo) || puntajeMaximo < 1 || puntajeMaximo > 1000) return toast.error('El puntaje debe ser un número entre 1 y 1000')
    if (!entregaArchivo && !entregaTexto) return toast.error('Elige al menos una forma de entrega')

    setSaving(true)
    try {
      const res = await fetch(tarea ? `/api/estudio/cursos/${courseId}/tareas/${tarea._id}` : `/api/estudio/cursos/${courseId}/tareas`, {
        method: tarea ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          instrucciones,
          // datetime-local está en hora local: se envía en ISO para que el servidor guarde la hora correcta.
          fechaLimite: fecha ? new Date(fecha).toISOString() : null,
          puntajeMaximo,
          entregaArchivo,
          entregaTexto,
          publicada,
        }),
      })
      const json = (await res.json()) as { data?: Tarea; error?: string }
      if (!res.ok || !json.data) throw new Error(json.error ?? 'No se pudo guardar la tarea')
      toast.success(tarea ? 'Tarea actualizada' : 'Tarea creada')
      onSaved(json.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la tarea')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={tarea ? 'Editar tarea' : 'Nueva tarea'}
      description="Los coordinadores la verán en «Tareas» y podrán entregar hasta la fecha límite."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={() => void guardar()}>
            {tarea ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título">{(id) => <Input id={id} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Informe de la actividad del mes" maxLength={200} />}</Field>

        <div>
          <p className="block text-[13px] font-medium text-ink mb-1.5">Instrucciones</p>
          <RichTextEditor
            value={instrucciones}
            onChange={setInstrucciones}
            onUploadImage={uploadImage}
            placeholder="Explica qué hay que entregar, el formato y cómo se va a calificar…"
            minHeight={140}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fecha límite" hint="Déjala vacía si no tiene fecha.">
            {(id) => <Input id={id} type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />}
          </Field>
          <Field label="Puntaje máximo">
            {(id) => <Input id={id} type="number" min={1} max={1000} value={puntaje} onChange={(e) => setPuntaje(e.target.value)} />}
          </Field>
        </div>

        <div>
          <p className="block text-[13px] font-medium text-ink mb-1.5">Cómo se entrega</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Check checked={entregaArchivo} onChange={setEntregaArchivo} label="Subir un archivo" hint="PDF, Word, PowerPoint, Excel, imagen, video o ZIP" />
            <Check checked={entregaTexto} onChange={setEntregaTexto} label="Escribir un texto" hint="Respuesta escrita directamente en la plataforma" />
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-[12px] bg-surface-muted border border-border">
          <div className="flex-1">
            <p className="text-[13px] font-bold text-ink">Publicada</p>
            <p className="text-[12px] text-ink-muted">Si la apagas, solo los administradores ven la tarea.</p>
          </div>
          <Switch checked={publicada} label="Publicada" onChange={setPublicada} />
        </div>
      </div>
    </Modal>
  )
}

export function estadoTarea(t: Tarea, esAdmin: boolean): { label: string; tone: BadgeTone } {
  if (esAdmin) {
    if (!t.publicada) return { label: 'Sin publicar', tone: 'neutral' }
    if (t.sinCalificar) return { label: `${t.sinCalificar} por calificar`, tone: 'warning' }
    return { label: `${t.totalEntregas ?? 0} entrega${t.totalEntregas === 1 ? '' : 's'}`, tone: 'primary' }
  }
  if (t.miEntrega?.calificacion !== null && t.miEntrega?.calificacion !== undefined) {
    return { label: `Calificada · ${t.miEntrega.calificacion}/${t.puntajeMaximo}`, tone: 'success' }
  }
  if (t.miEntrega) return { label: 'Entregada', tone: 'primary' }
  if (tareaVencida(t)) return { label: 'Vencida', tone: 'danger' }
  return { label: 'Pendiente', tone: 'warning' }
}
