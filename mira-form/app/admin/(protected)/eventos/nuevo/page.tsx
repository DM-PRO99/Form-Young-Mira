'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Copy, Check, ShieldCheck, Plus, Trash2, Link2, Lock, Users, Info, CalendarDays, UserCog } from 'lucide-react'
import { Avatar, BackLink, Button, Card, CardHeader, Eyebrow, IconButton, Input, Textarea } from '@/components/admin/ui'
import { cn } from '@/lib/cn'
import { MAX_FECHAS } from '@/lib/recurrencia'
import { RecurrenciaEditor } from '../_recurrencia'

const FormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  fechas: z
    .array(z.object({ value: z.string().min(1, 'La fecha es requerida') }))
    .min(1, 'Agrega al menos una fecha'),
  lugar: z.string().min(1, 'El lugar es requerido'),
  capacidadMaxima: z
    .string()
    .optional()
    .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) > 0), 'Debe ser un número positivo'),
  descripcionPublica: z.string().optional(),
})

type FormValues = z.infer<typeof FormSchema>

interface Coordinador {
  _id: string
  nombre: string
  email: string
  role: 'admin' | 'coordinador'
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[12px] text-danger mt-1.5">{message}</p> : null
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink mb-1.5">
      {children}
    </label>
  )
}

export default function NuevoEventoPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'coordinador'>('admin')
  const [coordinadores, setCoordinadores] = useState<Coordinador[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [serie, setSerie] = useState<Date[] | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: { fechas: [{ value: '' }] } })

  const primeraFecha = watch('fechas.0.value')

  const { fields: fechaFields, append: appendFecha, remove: removeFecha } = useFieldArray({
    control,
    name: 'fechas',
  })

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const userData = await res.json()
        setRole(userData.role || 'admin')
        if (userData.role === 'admin') {
          const usersRes = await fetch('/api/admin/usuarios')
          if (usersRes.ok) {
            const usersJson = (await usersRes.json()) as { data: Coordinador[] }
            setCoordinadores(usersJson.data.filter((u) => u.role === 'coordinador'))
          }
        }
      } catch {
        // el formulario sigue funcionando sin la lista de coordinadores
      }
    }
    void fetchUserInfo()
  }, [])

  function toggleCoordinador(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function onSubmit(data: FormValues, estado: 'borrador' | 'publicado') {
    // El input datetime-local está en hora local; se envía en ISO para que el servidor (en UTC) guarde la hora correcta.
    const base = serie ?? [new Date(data.fechas[0].value)]
    const sueltas = data.fechas.slice(1).map((f) => new Date(f.value))
    const fechas = [...new Map([...base, ...sueltas].filter((d) => !Number.isNaN(d.getTime())).map((d) => [d.getTime(), d])).values()].sort(
      (a, b) => a.getTime() - b.getTime()
    )
    if (fechas.length === 0) {
      toast.error('Quitaste todas las fechas de la repetición. Restaura alguna o cambia la regla.')
      return
    }
    if (fechas.length > MAX_FECHAS) {
      toast.error(`Un evento puede tener como máximo ${MAX_FECHAS} fechas.`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          fechas: fechas.map((d) => d.toISOString()),
          lugar: data.lugar,
          capacidadMaxima: data.capacidadMaxima ? Number(data.capacidadMaxima) : undefined,
          descripcionPublica: data.descripcionPublica || undefined,
          estado,
          coordinadoresAsignados: selected,
        }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        throw new Error(body.error ?? 'Error al crear el evento')
      }
      const json = (await res.json()) as { data: { _id: string } }
      setCreatedId(json.data._id)
      toast.success(estado === 'publicado' ? 'Evento publicado' : 'Borrador guardado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el evento')
    } finally {
      setSubmitting(false)
    }
  }

  const publicUrl = createdId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/inscribirse/${createdId}` : ''

  function handleCopy() {
    if (!publicUrl) return
    void navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (createdId) {
    return (
      <div className="admin-view">
        <BackLink href="/admin/eventos">Volver a eventos</BackLink>
        <Card className="celebrate-in p-6 md:p-8 max-w-xl">
          <div className="w-11 h-11 rounded-full bg-success-tint flex items-center justify-center mb-4">
            <Check className="w-5 h-5 text-success" strokeWidth={2} />
          </div>
          <h2 className="text-[20px] font-extrabold text-ink mb-1">Evento creado</h2>
          <p className="text-[13.5px] text-ink-muted mb-5">Comparte este enlace para que las personas se inscriban.</p>
          <div className="bg-primary-tint rounded-field p-3 pl-4 flex items-center justify-between gap-3 mb-5">
            <p className="font-mono text-[12.5px] text-primary truncate">{publicUrl}</p>
            <Button size="sm" variant="secondary" onClick={handleCopy} icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}>
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <Button onClick={() => router.push(`/admin/eventos/${createdId}`)}>Ver evento</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="admin-view pb-20 lg:pb-0">
      <BackLink href="/admin/eventos">Volver a eventos</BackLink>
      <h2 className="text-[22px] font-extrabold text-ink leading-tight tracking-[-0.015em] mb-5">Nuevo evento</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 lg:gap-6 items-start">
        <form id="nuevo-evento" className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <Card>
            <CardHeader icon={Info} title="Información del evento" description="Lo que verán las personas en el enlace de inscripción." />
            <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Label htmlFor="nombre">Nombre del evento</Label>
                <Input id="nombre" {...register('nombre')} placeholder="Ej. Encuentro de juventudes 2026" />
                <FieldError message={errors.nombre?.message} />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="lugar">Lugar</Label>
                <Input id="lugar" {...register('lugar')} placeholder="Ej. Coliseo municipal, Itagüí" />
                <FieldError message={errors.lugar?.message} />
              </div>

              <div>
                <Label htmlFor="capacidad">Cupo por fecha (opcional)</Label>
                <Input id="capacidad" type="number" min={1} inputMode="numeric" {...register('capacidadMaxima')} placeholder="Ej. 120" />
                <FieldError message={errors.capacidadMaxima?.message} />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="descripcion">Descripción pública</Label>
                <Textarea id="descripcion" {...register('descripcionPublica')} placeholder="Lo que verán las personas al inscribirse…" />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={CalendarDays}
              tone="success"
              title="Fechas"
              description="Una fecha, varias sueltas o una serie que se repite (diaria, semanal o mensual). Cada persona elige a cuál asistir."
            />
            <div className="p-5 md:p-6">
              <Label htmlFor="fecha-inicio">{serie ? 'Primera fecha y hora' : 'Fecha y hora'}</Label>
              <Input id="fecha-inicio" type="datetime-local" {...register('fechas.0.value')} className="sm:max-w-[340px]" />
              <FieldError message={errors.fechas?.[0]?.value?.message} />

              <RecurrenciaEditor inicio={primeraFecha ?? ''} onChange={setSerie} />

              {fechaFields.length > 1 && (
                <div className="mt-5">
                  <p className="text-[13px] font-medium text-ink mb-1.5">{serie ? 'Fechas adicionales' : 'Otras fechas'}</p>
                  <div className="space-y-2.5">
                    {fechaFields.slice(1).map((field, i) => {
                      const index = i + 1
                      return (
                        <div key={field.id}>
                          <div className="flex items-center gap-2">
                            <Input type="datetime-local" {...register(`fechas.${index}.value`)} aria-label={`Fecha adicional ${index}`} className="flex-1 sm:max-w-[340px]" />
                            <IconButton label={`Quitar fecha adicional ${index}`} tone="danger" onClick={() => removeFecha(index)}>
                              <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                            </IconButton>
                          </div>
                          <FieldError message={errors.fechas?.[index]?.value?.message} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <FieldError message={errors.fechas?.root?.message} />
              <Button variant="ghost" size="sm" className="mt-3 text-primary" icon={<Plus className="w-4 h-4" strokeWidth={1.8} />} onClick={() => appendFecha({ value: '' })}>
                {serie ? 'Agregar una fecha suelta' : 'Agregar otra fecha'}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader icon={UserCog} tone="violet" title="Coordinadores" description="Quiénes pueden ver y gestionar este evento." />
            <div className="p-5 md:p-6">
              {role === 'admin' ? (
                coordinadores.length === 0 ? (
                  <p className="text-[13px] text-ink-faint">No hay coordinadores registrados aún.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {coordinadores.map((c) => {
                      const active = selected.includes(c._id)
                      return (
                        <button
                          key={c._id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleCoordinador(c._id)}
                          className={cn(
                            'press flex items-center gap-2 h-9 pl-1 pr-3 rounded-full border text-[12.5px] font-medium',
                            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
                            active ? 'bg-primary-tint border-primary/40 text-primary' : 'bg-white border-border-input text-ink-muted hover:border-primary/40'
                          )}
                        >
                          <Avatar name={c.nombre} email={c.email} size="xs" className={active ? 'bg-primary text-white' : ''} />
                          {c.nombre}
                          {active && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                        </button>
                      )
                    })}
                  </div>
                )
              ) : (
                <div className="flex items-start gap-2.5 bg-primary-tint rounded-field p-3">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                  <p className="text-[12.5px] text-primary">Quedarás asignado automáticamente como coordinador de este evento.</p>
                </div>
              )}
            </div>
          </Card>

          <div className="hidden lg:flex items-center gap-2.5">
            <Button loading={submitting} onClick={handleSubmit((data) => onSubmit(data, 'publicado'))}>
              Publicar y generar enlace
            </Button>
            <Button variant="secondary" disabled={submitting} onClick={handleSubmit((data) => onSubmit(data, 'borrador'))}>
              Guardar borrador
            </Button>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-[88px]">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <Link2 className="w-4 h-4 text-primary" strokeWidth={1.8} />
              <Eyebrow className="text-primary">Enlace público</Eyebrow>
            </div>
            <p className="text-[13px] text-ink-muted">
              Al publicar se genera <span className="font-mono text-ink">/inscribirse/…</span> para compartir por WhatsApp o redes.
            </p>
          </Card>
          <Card className="p-5">
            <Eyebrow className="mb-3">Cómo funciona</Eyebrow>
            <ul className="space-y-3 text-[13px] text-ink-muted">
              <li className="flex gap-2.5">
                <Users className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                El cupo se controla por fecha en cada inscripción.
              </li>
              <li className="flex gap-2.5">
                <Check className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                Una misma cédula no se puede inscribir dos veces en la misma fecha.
              </li>
              <li className="flex gap-2.5">
                <Lock className="w-4 h-4 text-ink-faint flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                Solo tú y los coordinadores asignados pueden ver el evento.
              </li>
            </ul>
          </Card>
        </aside>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 border-t border-border bg-white/[0.92] backdrop-blur-md px-4 py-3 flex gap-2">
        <Button variant="secondary" className="flex-1" disabled={submitting} onClick={handleSubmit((data) => onSubmit(data, 'borrador'))}>
          Borrador
        </Button>
        <Button className="flex-[2]" loading={submitting} onClick={handleSubmit((data) => onSubmit(data, 'publicado'))}>
          Publicar
        </Button>
      </div>
    </div>
  )
}
