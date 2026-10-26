'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarDays, CheckCircle2, Clock, Edit2, MapPin, Save, Trash2, X } from 'lucide-react'
import {
  Avatar,
  BackLink,
  Button,
  Card,
  CardHeader,
  ErrorState,
  Eyebrow,
  Input,
  Skeleton,
  useConfirm,
} from '@/components/admin/ui'

interface Submission {
  _id: string
  cedula: string
  municipio: string
  datos: Record<string, unknown>
  syncedToSheets: boolean
  createdAt: string
  updatedAt: string
}

const FIELD_LABELS: Record<string, string> = {
  q_1: 'Aceptación de política de datos',
  q_2: 'Nombre completo',
  q_3: 'Género',
  q_4: 'Fecha de nacimiento',
  q_5: 'Número de celular',
  tipoDocumento: 'Tipo de documento',
  numeroDocumento: 'Número de documento',
  q_7: 'Grupo poblacional',
  q_8: 'Municipio',
  q_8b: 'Barrio',
  q_8c: 'Comuna',
  q_9: 'Dirección',
  q_10: 'Libreta militar',
  q_11: '¿Está estudiando?',
  q_12: 'Institución donde estudia',
  q_13: 'Qué le gustaría estudiar',
  q_14: 'Qué está estudiando',
  q_15: 'Actividades deportivas',
  q_16: 'Actividades políticas',
  q_17: 'Actividades sociales o cívicas',
  q_18: 'Idiomas',
  q_19: 'Redes sociales',
  q_20: 'Conocimientos tecnológicos',
  q_21: '¿Tiene emprendimiento?',
  q_22: 'Cuál emprendimiento',
  q_23: 'Tiempo conociendo la iglesia',
  q_24: 'Horario de culto preferido',
  q_25: 'Áreas de trabajo o conocimiento',
  q_autorizacion_menor: 'Autorización acudiente (Ley 1581)',
}

const FIELD_SECTIONS: { title: string; subtitle: string; keys: string[] }[] = [
  {
    title: 'Identificación',
    subtitle: 'Datos personales y de documento',
    keys: ['q_1', 'tipoDocumento', 'numeroDocumento', 'q_2', 'q_3', 'q_4', 'q_7', 'q_10', 'q_autorizacion_menor'],
  },
  {
    title: 'Contacto',
    subtitle: 'Ubicación y medios de contacto',
    keys: ['q_5', 'q_8', 'q_8b', 'q_8c', 'q_9'],
  },
  {
    title: 'Participación',
    subtitle: 'Estudios, actividades e intereses',
    keys: ['q_11', 'q_12', 'q_13', 'q_14', 'q_15', 'q_16', 'q_17', 'q_18', 'q_19', 'q_20', 'q_21', 'q_22', 'q_23', 'q_24', 'q_25'],
  },
]

// La cédula identifica el registro en Mongo y en el Sheet; el servidor la ignora si cambia.
const READ_ONLY_KEYS = new Set(['numeroDocumento'])

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

function formatDate(iso: string, withTime = false): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  return String(v)
}

function SummaryItem({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <Card className="p-4 flex items-center gap-3.5">
      <span className="w-9 h-9 rounded-[10px] bg-primary-tint text-primary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <Eyebrow className="mb-0.5">{label}</Eyebrow>
        <p className="text-[13.5px] font-medium text-ink truncate">{value}</p>
      </div>
    </Card>
  )
}

export default function RegistroDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const confirm = useConfirm()
  const id = params.id

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedDatos, setEditedDatos] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const fetchSubmission = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/registros/${id}`)
      if (!res.ok) throw new Error('No se encontró el registro')
      const json = (await res.json()) as { data: Submission }
      setSubmission(json.data)
    } catch {
      setError('No se pudo cargar el registro.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchSubmission()
  }, [fetchSubmission])

  function enterEditMode() {
    if (!submission) return
    const flat: Record<string, string> = {}
    for (const [k, v] of Object.entries(submission.datos)) flat[k] = valueToString(v)
    setEditedDatos(flat)
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
    setEditedDatos({})
  }

  async function handleSave() {
    if (!submission) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/registros/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos: editedDatos }),
      })
      const json = (await res.json()) as { data?: Submission; error?: string }
      if (!res.ok || !json.data) throw new Error(json.error ?? 'No se pudo guardar el registro')
      setSubmission(json.data)
      setEditMode(false)
      setEditedDatos({})
      toast.success('Registro actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el registro')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!submission) return
    const nombre = typeof submission.datos['q_2'] === 'string' && submission.datos['q_2'] ? submission.datos['q_2'] : 'este registro'
    const ok = await confirm({
      title: 'Eliminar registro',
      description: (
        <>
          Se eliminará el registro de <span className="font-medium text-ink">{nombre}</span> (CC{' '}
          <span className="font-mono tabular-nums">{submission.cedula}</span>). Esta acción no se puede deshacer.
        </>
      ),
      confirmLabel: 'Eliminar',
    })
    if (!ok) return
    const res = await fetch(`/api/admin/registros/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Registro eliminado')
      router.push('/admin/registros')
    } else {
      toast.error('No se pudo eliminar el registro')
    }
  }

  if (loading) {
    return (
      <div className="admin-view space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-[148px] w-full rounded-section" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[70px] rounded-card" />
          ))}
        </div>
        <Card className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-40" />
            </div>
          ))}
        </Card>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <Card className="admin-view">
        <ErrorState message={error ?? 'Registro no encontrado'} onRetry={() => void fetchSubmission()} />
      </Card>
    )
  }

  const nombre = typeof submission.datos['q_2'] === 'string' && submission.datos['q_2'] ? (submission.datos['q_2'] as string) : 'Registro'

  return (
    <div className={'admin-view ' + (editMode ? 'pb-20' : '')}>
      <BackLink href="/admin/registros">Volver a registros</BackLink>

      <div className="relative overflow-hidden rounded-section p-5 md:p-7 mb-5 bg-gradient-to-br from-sidebar-from via-primary to-sidebar-to shadow-elevated">
        <div
          className="absolute -right-16 -top-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)' }}
        />
        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar name={nombre} size="lg" className="bg-white/[0.14] text-white" />
            <div className="min-w-0">
              <h1 className="text-[21px] md:text-[26px] font-semibold text-white leading-tight tracking-[-0.01em] break-words">{nombre}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium font-mono tabular-nums bg-white/[0.14] text-white">
                  CC {submission.cedula}
                </span>
                <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium bg-white/[0.14] text-white">
                  {submission.municipio}
                </span>
              </div>
              <p className="text-[12px] text-[#C3D2FF] mt-2.5">Actualizado {formatDate(submission.updatedAt, true)}</p>
            </div>
          </div>

          {!editMode && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={enterEditMode}
                className="press inline-flex items-center gap-1.5 h-10 px-4 text-[13.5px] rounded-field font-medium text-primary bg-white hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/40"
              >
                <Edit2 className="w-4 h-4" strokeWidth={1.8} />
                Editar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-5">
        <SummaryItem
          icon={submission.syncedToSheets ? CheckCircle2 : Clock}
          label="Google Sheets"
          value={submission.syncedToSheets ? 'Sincronizado' : 'Pendiente de sincronizar'}
        />
        <SummaryItem icon={MapPin} label="Municipio" value={submission.municipio} />
        <SummaryItem icon={CalendarDays} label="Fecha de registro" value={formatDate(submission.createdAt)} />
      </div>

      <div className="space-y-4 md:space-y-5">
        {FIELD_SECTIONS.map((section) => {
          const keysPresent = section.keys.filter((k) => k in submission.datos)
          if (keysPresent.length === 0) return null
          return (
            <Card key={section.title} className="overflow-hidden">
              <CardHeader title={section.title} description={section.subtitle} />
              <dl className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                {keysPresent.map((key) => {
                  const value = valueToString(submission.datos[key])
                  const editable = editMode && !READ_ONLY_KEYS.has(key)
                  return (
                    <div key={key} className="min-w-0">
                      <dt>
                        <Eyebrow className="mb-1.5">{fieldLabel(key)}</Eyebrow>
                      </dt>
                      <dd>
                        {editable ? (
                          <Input
                            value={editedDatos[key] ?? value}
                            onChange={(e) => setEditedDatos((prev) => ({ ...prev, [key]: e.target.value }))}
                            aria-label={fieldLabel(key)}
                          />
                        ) : (
                          <p className={'text-[13.5px] break-words ' + (value ? 'text-ink' : 'text-ink-faint')}>{value || 'Sin dato'}</p>
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-[12.5px] text-ink-faint">Los cambios se sincronizan con Google Sheets al guardar.</p>
        <Button variant="secondary" className="text-danger hover:bg-danger-tint" icon={<Trash2 className="w-4 h-4" strokeWidth={1.8} />} onClick={() => void handleDelete()}>
          Eliminar registro
        </Button>
      </div>

      {editMode && (
        <div className="fixed bottom-0 inset-x-0 lg:left-[248px] z-20 border-t border-border bg-white/[0.92] backdrop-blur-md">
          <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-3">
            <p className="hidden sm:flex items-center gap-1.5 text-[12.5px] text-warning">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              Editando el registro
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="secondary" className="flex-1 sm:flex-none" onClick={cancelEdit} disabled={saving} icon={<X className="w-4 h-4" strokeWidth={1.8} />}>
                Cancelar
              </Button>
              <Button className="flex-1 sm:flex-none" onClick={() => void handleSave()} loading={saving} icon={<Save className="w-4 h-4" strokeWidth={1.8} />}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
