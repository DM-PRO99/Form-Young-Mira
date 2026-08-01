'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit2,
  Save,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  MapPin,
  CalendarDays,
} from 'lucide-react'
import { municipioColor } from '@/lib/municipioColors'

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
    keys: [
      'q_11', 'q_12', 'q_13', 'q_14', 'q_15', 'q_16', 'q_17',
      'q_18', 'q_19', 'q_20', 'q_21', 'q_22', 'q_23', 'q_24', 'q_25',
    ],
  },
]

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'string') return v
  return String(v)
}

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return nombre.slice(0, 2).toUpperCase()
}

interface DeleteModalProps {
  submission: Submission
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}

function DeleteModal({ submission, onConfirm, onCancel, deleting }: DeleteModalProps) {
  const nombre =
    typeof submission.datos['q_2'] === 'string' ? submission.datos['q_2'] : 'este registro'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        className="relative bg-surface rounded-section shadow-xl w-full max-w-md p-6 z-10"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-semibold text-ink">Eliminar registro</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-canvas transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
        <p className="text-sm text-ink-muted mb-6">
          ¿Eliminar el registro de{' '}
          <span className="font-medium text-ink">{nombre}</span>, CC{' '}
          <span className="font-mono tabular-nums">{submission.cedula}</span>? Esta acción no
          se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm border border-border-input bg-white rounded-field font-medium text-ink hover:bg-canvas transition duration-150 active:scale-[0.97] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-danger hover:brightness-110 text-white rounded-field font-medium flex items-center gap-2 transition duration-150 active:scale-[0.97] disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" strokeWidth={1.8} />
            )}
            Eliminar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string
}) {
  return (
    <div className="kpi-card bg-surface rounded-card border border-border shadow-card p-4 flex items-center gap-3.5">
      <div className="w-[34px] h-[34px] rounded-[10px] bg-primary-tint text-primary flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-0.5">
          {label}
        </p>
        <p className="text-[13.5px] font-medium text-ink truncate">{value}</p>
      </div>
    </div>
  )
}

export default function RegistroDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedDatos, setEditedDatos] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    for (const [k, v] of Object.entries(submission.datos)) {
      flat[k] = valueToString(v)
    }
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
      if (!res.ok) throw new Error('Error al guardar')
      const json = (await res.json()) as { data: Submission }
      setSubmission(json.data)
      setEditMode(false)
      setEditedDatos({})
      toast.success('Registro actualizado correctamente')
    } catch {
      toast.error('No se pudo guardar el registro')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/registros/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Registro eliminado')
      router.push('/admin/registros')
    } catch {
      toast.error('No se pudo eliminar el registro')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-view">
        <div className="h-40 bg-zinc-100 rounded-section animate-pulse mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[70px] bg-zinc-100 rounded-card animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-section border border-border p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
                <div className="h-9 bg-zinc-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="admin-view flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-ink-muted">{error ?? 'Registro no encontrado'}</p>
        <button
          onClick={() => void fetchSubmission()}
          className="text-sm text-primary hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const nombre =
    typeof submission.datos['q_2'] === 'string' && submission.datos['q_2']
      ? (submission.datos['q_2'] as string)
      : 'Registro'
  const municipioStyle = municipioColor(submission.municipio)

  return (
    <div className="admin-view">
      {/* Back link */}
      <button
        onClick={() => router.push('/admin/registros')}
        className="group flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 rounded"
      >
        <ArrowLeft
          className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-[3px]"
          strokeWidth={1.8}
        />
        Volver a registros
      </button>

      {/* Hero */}
      <div
        className="hero-tilt relative overflow-hidden rounded-section p-7 mb-5"
        style={{
          background: 'linear-gradient(135deg, #00318C, #00289F 46%, #0B1B5C)',
          boxShadow: '0 26px 50px -26px rgba(0,40,159,0.75)',
        }}
      >
        <div className="hero-sheen" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)' }}
            >
              {getInitials(nombre)}
            </div>
            <div className="min-w-0">
              <h1 className="text-[27px] font-semibold text-white leading-tight truncate">
                {nombre}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono tabular-nums bg-white/[0.14] text-white">
                  CC {submission.cedula}
                </span>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.14] text-white">
                  {submission.municipio}
                </span>
                {submission.syncedToSheets ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.14]" style={{ color: '#8FF0CC' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                    Sincronizado con Sheets
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.14] text-[#C3D2FF]">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.8} />
                    Pendiente de sincronización
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-[#C3D2FF] mt-2.5">
                Creado {formatDate(submission.createdAt)} · Actualizado{' '}
                {formatDate(submission.updatedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {editMode ? (
              <>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-field font-medium text-white bg-white/[0.14] hover:bg-white/[0.22] transition duration-150 active:scale-[0.97] disabled:opacity-60"
                >
                  <X className="w-4 h-4" strokeWidth={1.8} />
                  Cancelar
                </button>
                <button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-field font-medium text-primary bg-white hover:bg-[#EAF0FF] transition duration-150 active:scale-[0.97] disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" strokeWidth={1.8} />
                  )}
                  Guardar cambios
                </button>
              </>
            ) : (
              <button
                onClick={enterEditMode}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-field font-medium text-white bg-white/[0.14] hover:bg-white/[0.22] transition duration-150 active:scale-[0.97]"
              >
                <Edit2 className="w-4 h-4" strokeWidth={1.8} />
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="kpi-perspective grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <SummaryCard
          icon={submission.syncedToSheets ? CheckCircle2 : Clock}
          label="Estado"
          value={submission.syncedToSheets ? 'Sincronizado' : 'Pendiente de sincronización'}
        />
        <SummaryCard icon={MapPin} label="Municipio" value={submission.municipio} />
        <SummaryCard
          icon={CalendarDays}
          label="Fecha de registro"
          value={formatDateShort(submission.createdAt)}
        />
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {FIELD_SECTIONS.map((section) => {
          const keysPresent = section.keys.filter((k) => k in submission.datos)
          if (keysPresent.length === 0) return null
          return (
            <div
              key={section.title}
              className="bg-surface rounded-section border border-border shadow-card overflow-hidden"
            >
              <div
                className="flex items-stretch gap-3 px-6 py-4"
                style={{ background: 'linear-gradient(90deg, #EAF0FF, #FFFFFF)' }}
              >
                <div className="w-[6px] rounded-full bg-primary flex-shrink-0" />
                <div>
                  <h2 className="text-[14.5px] font-semibold text-ink">{section.title}</h2>
                  <p className="text-[12.5px] text-ink-muted">{section.subtitle}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {keysPresent.map((key) => (
                    <div key={key}>
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-1.5">
                        {fieldLabel(key)}
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={editedDatos[key] ?? valueToString(submission.datos[key])}
                          onChange={(e) =>
                            setEditedDatos((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 text-[13.5px] text-ink bg-white border border-[#C9D6F7] rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] focus:-translate-y-px transition-[border-color,box-shadow,transform] duration-150"
                        />
                      ) : (
                        <input
                          type="text"
                          value={valueToString(submission.datos[key]) || '—'}
                          readOnly
                          className="w-full px-3.5 py-2.5 text-[13.5px] text-ink bg-[#F5F7FC] border border-[#EDF0F8] rounded-field cursor-default"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-border flex items-center justify-between flex-wrap gap-3">
        <p className="text-[12.5px] text-ink-faint">
          Los cambios se sincronizan con Google Sheets al guardar.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-[#F2D4DC] text-danger bg-danger-tint rounded-field hover:brightness-95 transition duration-150 active:scale-[0.97] font-medium"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
          Eliminar registro
        </button>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteModal
            submission={submission}
            onConfirm={() => void handleDelete()}
            onCancel={() => setShowDeleteModal(false)}
            deleting={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
