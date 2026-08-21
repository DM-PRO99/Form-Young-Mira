'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { CalendarDays, MapPin, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'

interface PublicEvent {
  nombre: string
  descripcionPublica: string
  fecha: string
  lugar: string
  estado: 'borrador' | 'publicado' | 'cerrado'
  cupoAbierto: boolean
}

const FormSchema = z
  .object({
    nombreCompleto: z.string().min(1, 'El nombre es requerido'),
    cedula: z.string().min(1, 'La cédula es requerida'),
    telefono: z.string().min(1, 'El teléfono es requerido'),
    correo: z.string().email('Correo inválido').optional().or(z.literal('')),
    edad: z.string().optional(),
    acudienteNombre: z.string().optional(),
    acudienteTelefono: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const edad = data.edad ? Number(data.edad) : undefined
    if (edad !== undefined && edad < 18) {
      if (!data.acudienteNombre) {
        ctx.addIssue({ code: 'custom', path: ['acudienteNombre'], message: 'El nombre del acudiente es requerido' })
      }
      if (!data.acudienteTelefono) {
        ctx.addIssue({ code: 'custom', path: ['acudienteTelefono'], message: 'El teléfono del acudiente es requerido' })
      }
    }
  })

type FormValues = z.infer<typeof FormSchema>

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function InscribirsePage() {
  const params = useParams<{ id: string }>()
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [status, setStatus] = useState<'form' | 'success' | 'full' | 'duplicate'>('form')
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) })

  const edad = watch('edad')
  const esMenor = edad !== undefined && edad !== '' && Number(edad) < 18

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${params.id}/public`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        const json = (await res.json()) as { data: PublicEvent }
        setEvent(json.data)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    void fetchEvent()
  }, [params.id])

  async function onSubmit(data: FormValues) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${params.id}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto: data.nombreCompleto,
          cedula: data.cedula,
          telefono: data.telefono,
          correo: data.correo || undefined,
          edad: data.edad ? Number(data.edad) : undefined,
          acudiente: esMenor ? { nombre: data.acudienteNombre, telefono: data.acudienteTelefono } : undefined,
        }),
      })
      const json = (await res.json()) as { success: boolean; message: string }
      if (!res.ok) {
        if (res.status === 409 && json.message.toLowerCase().includes('cupo')) {
          setStatus('full')
        } else if (res.status === 409) {
          setStatus('duplicate')
        } else {
          toast.error(json.message)
        }
        return
      }
      setStatus('success')
    } catch {
      toast.error('No se pudo completar la inscripción. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" strokeWidth={1.8} />
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-[19px] font-semibold text-ink mb-1.5">Evento no encontrado</h1>
          <p className="text-[13.5px] text-ink-muted">El enlace que abriste no corresponde a ningún evento.</p>
        </div>
      </div>
    )
  }

  const cerrado = event.estado !== 'publicado' || !event.cupoAbierto

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4">
      <div className="wizard-card-enter w-full max-w-[520px] rounded-card overflow-hidden shadow-elevated">
        <div
          className="px-7 py-8 text-white"
          style={{ background: 'linear-gradient(175deg, #00318C 0%, #001348 100%)' }}
        >
          <h1 className="text-[21px] font-semibold mb-3">{event.nombre}</h1>
          <div className="flex items-center gap-2 text-[13px] text-white/85 mb-1.5">
            <CalendarDays className="w-4 h-4" strokeWidth={1.8} />
            {formatFecha(event.fecha)}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-white/85">
            <MapPin className="w-4 h-4" strokeWidth={1.8} />
            {event.lugar}
          </div>
          {event.descripcionPublica && (
            <p className="text-[13px] text-white/80 mt-4 leading-relaxed">{event.descripcionPublica}</p>
          )}
        </div>

        <div className="bg-white p-7">
          {status === 'success' ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" strokeWidth={1.6} />
              <h2 className="text-[17px] font-semibold text-ink mb-1.5">¡Inscripción confirmada!</h2>
              <p className="text-[13.5px] text-ink-muted">
                Quedaste inscrito/a en <span className="font-medium text-ink">{event.nombre}</span>. Nos pondremos
                en contacto contigo pronto.
              </p>
            </div>
          ) : status === 'full' ? (
            <div className="text-center py-6">
              <h2 className="text-[17px] font-semibold text-ink mb-1.5">Cupo agotado</h2>
              <p className="text-[13.5px] text-ink-muted">
                Este evento ya alcanzó el número máximo de inscritos. ¡Gracias por tu interés!
              </p>
            </div>
          ) : status === 'duplicate' ? (
            <div className="text-center py-6">
              <h2 className="text-[17px] font-semibold text-ink mb-1.5">Ya estás inscrito/a</h2>
              <p className="text-[13.5px] text-ink-muted">
                Esta cédula ya se encuentra registrada en este evento.
              </p>
            </div>
          ) : cerrado ? (
            <div className="text-center py-6">
              <h2 className="text-[17px] font-semibold text-ink mb-1.5">Inscripciones no disponibles</h2>
              <p className="text-[13.5px] text-ink-muted">
                Este evento no está recibiendo inscripciones en este momento.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">Nombre completo</label>
                <input
                  {...register('nombreCompleto')}
                  className="wizard-input w-full px-3.5 py-2.5 text-[14px] border border-border-input rounded-field bg-canvas"
                />
                {errors.nombreCompleto && (
                  <p className="text-[12px] text-danger mt-1">{errors.nombreCompleto.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1.5">Cédula</label>
                  <input
                    {...register('cedula')}
                    className="wizard-input w-full px-3.5 py-2.5 text-[14px] border border-border-input rounded-field bg-canvas font-mono"
                  />
                  {errors.cedula && <p className="text-[12px] text-danger mt-1">{errors.cedula.message}</p>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1.5">Edad</label>
                  <input
                    type="number"
                    min={0}
                    {...register('edad')}
                    className="wizard-input w-full px-3.5 py-2.5 text-[14px] border border-border-input rounded-field bg-canvas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1.5">Teléfono / WhatsApp</label>
                  <input
                    {...register('telefono')}
                    className="wizard-input w-full px-3.5 py-2.5 text-[14px] border border-border-input rounded-field bg-canvas font-mono"
                  />
                  {errors.telefono && <p className="text-[12px] text-danger mt-1">{errors.telefono.message}</p>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-ink mb-1.5">Correo (opcional)</label>
                  <input
                    {...register('correo')}
                    className="wizard-input w-full px-3.5 py-2.5 text-[14px] border border-border-input rounded-field bg-canvas"
                  />
                  {errors.correo && <p className="text-[12px] text-danger mt-1">{errors.correo.message}</p>}
                </div>
              </div>

              {esMenor && (
                <div className="bg-primary-tint rounded-field p-4 space-y-3">
                  <p className="text-[12.5px] font-medium text-primary">Datos del acudiente (menor de edad)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        {...register('acudienteNombre')}
                        placeholder="Nombre del acudiente"
                        className="wizard-input w-full px-3.5 py-2.5 text-[14px] border border-border-input rounded-field bg-white"
                      />
                      {errors.acudienteNombre && (
                        <p className="text-[12px] text-danger mt-1">{errors.acudienteNombre.message}</p>
                      )}
                    </div>
                    <div>
                      <input
                        {...register('acudienteTelefono')}
                        placeholder="Teléfono del acudiente"
                        className="wizard-input w-full px-3.5 py-2.5 text-[14px] border border-border-input rounded-field bg-white font-mono"
                      />
                      {errors.acudienteTelefono && (
                        <p className="text-[12px] text-danger mt-1">{errors.acudienteTelefono.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="wizard-btn-primary w-full flex items-center justify-center gap-2 px-4 py-3 text-[14px] font-semibold text-white rounded-field disabled:opacity-60"
                style={{ background: 'linear-gradient(180deg, #1140C7, #00289F)' }}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar mi inscripción
              </button>

              <p className="flex items-start gap-1.5 text-[12px] text-ink-faint pt-1">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.6} />
                No mostramos cuántas personas van ni los datos de otros inscritos.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
