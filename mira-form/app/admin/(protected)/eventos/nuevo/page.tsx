'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Check, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { getInitials } from '@/lib/initials'

const FormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
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

export default function NuevoEventoPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'coordinador'>('admin')
  const [coordinadores, setCoordinadores] = useState<Coordinador[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) })

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
    setSubmitting(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          fecha: data.fecha,
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

  return (
    <div className="admin-view">
      <Link
        href="/admin/eventos"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-primary transition-transform duration-150 hover:-translate-x-0.5 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
        Volver a eventos
      </Link>

      {createdId ? (
        <div className="bg-surface rounded-card border border-border shadow-card p-8 max-w-xl">
          <div className="w-10 h-10 rounded-full bg-success-tint flex items-center justify-center mb-4">
            <Check className="w-5 h-5 text-success" strokeWidth={2} />
          </div>
          <h3 className="text-[17px] font-semibold text-ink mb-1">Evento creado</h3>
          <p className="text-[13.5px] text-ink-muted mb-5">
            Comparte este enlace para que las personas se inscriban.
          </p>
          <div className="bg-primary-tint rounded-field p-4 flex items-center justify-between gap-3 mb-5">
            <p className="font-mono text-[12.5px] text-primary truncate">{publicUrl}</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-primary flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <button
            onClick={() => router.push(`/admin/eventos/${createdId}`)}
            className="btn-primary-3d px-4 py-2.5 text-[13.5px] text-white rounded-field font-medium"
          >
            Ver evento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[1.6fr_1fr] gap-6 items-start">
          <form className="bg-surface rounded-card border border-border shadow-card p-7 grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-[13px] font-medium text-ink mb-1.5">Nombre del evento</label>
              <input
                {...register('nombre')}
                className="w-full px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
                placeholder="Ej. Encuentro de juventudes 2026"
              />
              {errors.nombre && <p className="text-[12px] text-danger mt-1">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Fecha y hora</label>
              <input
                type="datetime-local"
                {...register('fecha')}
                className="w-full px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
              />
              {errors.fecha && <p className="text-[12px] text-danger mt-1">{errors.fecha.message}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Cupo máximo (opcional)</label>
              <input
                type="number"
                min={1}
                {...register('capacidadMaxima')}
                className="w-full px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
                placeholder="Ej. 120"
              />
              {errors.capacidadMaxima && (
                <p className="text-[12px] text-danger mt-1">{errors.capacidadMaxima.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-[13px] font-medium text-ink mb-1.5">Lugar</label>
              <input
                {...register('lugar')}
                className="w-full px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
                placeholder="Ej. Coliseo municipal, Itagüí"
              />
              {errors.lugar && <p className="text-[12px] text-danger mt-1">{errors.lugar.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-[13px] font-medium text-ink mb-1.5">Descripción pública</label>
              <textarea
                {...register('descripcionPublica')}
                rows={3}
                className="w-full px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150 resize-none"
                placeholder="Lo que verán las personas al inscribirse..."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[13px] font-medium text-ink mb-2">Coordinadores</label>
              {role === 'admin' ? (
                coordinadores.length === 0 ? (
                  <p className="text-[12.5px] text-ink-faint">No hay coordinadores registrados aún.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {coordinadores.map((c) => {
                      const active = selected.includes(c._id)
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => toggleCoordinador(c._id)}
                          className={
                            'flex items-center gap-2 px-3 py-1.5 rounded-full text-[12.5px] font-medium border transition-colors duration-150 ' +
                            (active
                              ? 'bg-primary-tint border-primary text-primary'
                              : 'bg-white border-border-input text-ink-muted hover:border-primary/40')
                          }
                        >
                          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9.5px] font-semibold">
                            {getInitials(c.nombre, c.email)}
                          </span>
                          {c.nombre}
                        </button>
                      )
                    })}
                  </div>
                )
              ) : (
                <div className="flex items-start gap-2.5 bg-primary-tint rounded-field p-3">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                  <p className="text-[12.5px] text-primary">
                    Quedarás asignado automáticamente como coordinador de este evento.
                  </p>
                </div>
              )}
            </div>

            <div className="col-span-2 flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit((data) => onSubmit(data, 'publicado'))}
                className="btn-primary-3d px-4 py-2.5 text-[13.5px] text-white rounded-field font-medium disabled:opacity-60"
              >
                Publicar y generar enlace
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit((data) => onSubmit(data, 'borrador'))}
                className="px-4 py-2.5 text-[13.5px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas transition-colors duration-150 disabled:opacity-60"
              >
                Guardar borrador
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="bg-primary-tint rounded-card p-5">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.08em] mb-1.5">
                Enlace público
              </p>
              <p className="text-[13px] text-primary">
                Al publicar, se generará la ruta <span className="font-mono">/inscribirse/[eventoId]</span> para
                compartir con los inscritos.
              </p>
            </div>
            <div className="bg-surface rounded-card border border-border shadow-card p-5">
              <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-1.5">
                Validaciones
              </p>
              <ul className="text-[13px] text-ink-muted space-y-1.5 list-disc pl-4">
                <li>El cupo máximo se valida en cada inscripción.</li>
                <li>No se permite inscribir dos veces la misma cédula.</li>
                <li>Solo tú y los coordinadores asignados pueden ver este evento.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
