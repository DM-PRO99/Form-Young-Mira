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
} from 'lucide-react'

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
  q_1: 'Municipio',
  q_2: 'Nombre completo',
  q_3: 'Género',
  q_4: 'Fecha de nacimiento',
  q_5: 'Dirección',
  q_6: 'Barrio',
  q_7: 'Correo electrónico',
  q_8: 'Teléfono',
  q_9: 'Nivel educativo',
  q_10: 'Ocupación',
  q_11: 'Partido político',
  q_12: 'Afiliación',
  q_13: 'Cargo',
  q_14: 'Años en el cargo',
  q_15: 'Observaciones',
  cedula: 'Cédula',
  municipio: 'Municipio',
  syncedToSheets: 'Sincronizado con Sheets',
  createdAt: 'Creado',
  updatedAt: 'Actualizado',
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
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

function valueToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'string') return v
  return String(v)
}

interface DeleteModalProps {
  submission: Submission
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}

function DeleteModal({
  submission,
  onConfirm,
  onCancel,
  deleting,
}: DeleteModalProps) {
  const nombre =
    typeof submission.datos['q_2'] === 'string'
      ? submission.datos['q_2']
      : 'este registro'

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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">
            Eliminar registro
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-zinc-600 mb-6">
          ¿Eliminar el registro de{' '}
          <span className="font-medium text-zinc-900">{nombre}</span>, CC{' '}
          <span className="font-mono tabular-nums">{submission.cedula}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm border border-zinc-300 bg-white rounded-lg font-medium text-zinc-700 hover:bg-zinc-50 transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Eliminar
          </button>
        </div>
      </motion.div>
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
      const res = await fetch(`/api/admin/registros/${id}`, {
        method: 'DELETE',
      })
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
      <div className="max-w-3xl mx-auto">
        <div className="h-8 w-40 bg-zinc-100 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-zinc-500">{error ?? 'Registro no encontrado'}</p>
        <button
          onClick={() => void fetchSubmission()}
          className="text-sm text-[#1E3A9E] hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const datosEntries = Object.entries(submission.datos)

  return (
    <>
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push('/admin/registros')}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 mb-6 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20 rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a registros
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              {typeof submission.datos['q_2'] === 'string'
                ? submission.datos['q_2']
                : 'Registro'}
            </h1>
            <p className="text-sm tabular-nums text-zinc-500 mt-0.5">
              CC {submission.cedula} · {submission.municipio}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-300 bg-white rounded-lg font-medium text-zinc-700 hover:bg-zinc-50 transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] disabled:opacity-60"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#14286E] hover:bg-[#1E3A9E] text-white rounded-lg font-medium transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </>
            ) : (
              <button
                onClick={enterEditMode}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-300 bg-white rounded-lg font-medium text-zinc-700 hover:bg-zinc-50 transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms]"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-4 mb-6 text-xs text-zinc-400">
          <span>
            Creado:{' '}
            <span className="tabular-nums">
              {formatDate(submission.createdAt)}
            </span>
          </span>
          <span>
            Actualizado:{' '}
            <span className="tabular-nums">
              {formatDate(submission.updatedAt)}
            </span>
          </span>
          {submission.syncedToSheets && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sincronizado con Sheets
            </span>
          )}
        </div>

        {/* Datos grid */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {datosEntries.map(([key, value]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
                  {fieldLabel(key)}
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={editedDatos[key] ?? valueToString(value)}
                    onChange={(e) =>
                      setEditedDatos((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150"
                  />
                ) : (
                  <p className="text-sm text-zinc-800 py-2 px-3 bg-zinc-50 rounded-lg min-h-[38px] break-words">
                    {valueToString(value) || (
                      <span className="text-zinc-400">—</span>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delete zone */}
        <div className="mt-6 pt-6 border-t border-zinc-200">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar registro
          </button>
        </div>
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
    </>
  )
}
