'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { uploadPresigned } from '@vercel/blob/client'
import { ArrowDown, ArrowLeft, ArrowUp, Eye, FileText, Loader2, PlayCircle, Plus, Presentation, Trash2, Upload } from 'lucide-react'
import { formatBytes, lessonTypeFromFile, MAX_UPLOAD_BYTES } from '@/lib/estudio'
import { LESSON_LABEL, type CourseDetail, type LessonType, type Module } from '../../_types'

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150'

const LESSON_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  pdf: FileText,
  presentacion: Presentation,
}

const ACCEPT = '.mp4,.webm,.mov,.pdf,.ppt,.pptx'

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function safeFileName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-')
}

export default function EditarCursoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState<'borrador' | 'publicado'>('borrador')
  const [modulos, setModulos] = useState<Module[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<{ moduleIndex: number; fileName: string; pct: number } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<number | null>(null)

  const fetchCourse = useCallback(async () => {
    const res = await fetch(`/api/estudio/cursos/${id}`)
    if (res.ok) {
      const json = (await res.json()) as { data: CourseDetail }
      setTitulo(json.data.titulo)
      setDescripcion(json.data.descripcion ?? '')
      setEstado(json.data.estado)
      setModulos(json.data.modulos)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void fetchCourse()
  }, [fetchCourse])

  function updateModulos(next: Module[]) {
    setModulos(next)
    setDirty(true)
  }

  async function save(overrides?: { modulos?: Module[]; estado?: 'borrador' | 'publicado' }) {
    const payload = {
      titulo,
      descripcion,
      estado: overrides?.estado ?? estado,
      modulos: overrides?.modulos ?? modulos,
    }
    if (!payload.titulo.trim()) {
      toast.error('El curso necesita un título')
      return false
    }
    if (payload.modulos.some((m) => !m.titulo.trim() || m.lecciones.some((l) => !l.titulo.trim()))) {
      toast.error('Todos los módulos y lecciones necesitan un título')
      return false
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/estudio/cursos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { data?: CourseDetail; error?: string }
      if (!res.ok || !json.data) throw new Error(json.error ?? 'No se pudo guardar')
      setModulos(json.data.modulos)
      setEstado(json.data.estado)
      setDirty(false)
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar')
      return false
    } finally {
      setSaving(false)
    }
  }

  function addModule() {
    updateModulos([...modulos, { titulo: `Módulo ${modulos.length + 1}`, lecciones: [] }])
  }

  function patchModule(index: number, patch: Partial<Module>) {
    updateModulos(modulos.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  function removeModule(index: number) {
    const m = modulos[index]
    if (m.lecciones.length > 0 && !window.confirm(`¿Eliminar "${m.titulo}" y sus ${m.lecciones.length} lecciones? Los archivos se borrarán al guardar.`)) {
      return
    }
    updateModulos(modulos.filter((_, i) => i !== index))
  }

  function pickFile(moduleIndex: number) {
    uploadTargetRef.current = moduleIndex
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    const moduleIndex = uploadTargetRef.current
    if (!file || moduleIndex === null) return

    const tipo = lessonTypeFromFile(file)
    if (!tipo) {
      toast.error('Formato no soportado. Usa MP4, WEBM, MOV, PDF, PPT o PPTX.')
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`El archivo supera el máximo de ${formatBytes(MAX_UPLOAD_BYTES)}`)
      return
    }

    setUploading({ moduleIndex, fileName: file.name, pct: 0 })
    try {
      const blob = await uploadPresigned(`estudio/${id}/${safeFileName(file.name)}`, file, {
        access: 'public',
        handleUploadUrl: '/api/estudio/upload',
        multipart: file.size > 50 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => {
          setUploading((prev) => (prev ? { ...prev, pct: Math.round(percentage) } : prev))
        },
      })
      const next = modulos.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              lecciones: [
                ...m.lecciones,
                {
                  titulo: file.name.replace(/\.[^.]+$/, ''),
                  tipo,
                  archivoUrl: blob.url,
                  archivoNombre: file.name,
                  tamano: file.size,
                },
              ],
            }
          : m
      )
      setModulos(next)
      if (await save({ modulos: next })) {
        toast.success('Lección agregada')
      } else {
        setDirty(true)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo subir el archivo')
    } finally {
      setUploading(null)
    }
  }

  function patchLesson(moduleIndex: number, lessonIndex: number, titulo: string) {
    patchModule(moduleIndex, {
      lecciones: modulos[moduleIndex].lecciones.map((l, i) => (i === lessonIndex ? { ...l, titulo } : l)),
    })
  }

  function moveLesson(moduleIndex: number, from: number, to: number) {
    patchModule(moduleIndex, { lecciones: moveItem(modulos[moduleIndex].lecciones, from, to) })
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    patchModule(moduleIndex, { lecciones: modulos[moduleIndex].lecciones.filter((_, i) => i !== lessonIndex) })
  }

  async function togglePublish() {
    const next = estado === 'publicado' ? 'borrador' : 'publicado'
    if (await save({ estado: next })) {
      toast.success(next === 'publicado' ? 'Curso publicado' : 'Curso pasado a borrador')
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar este curso? Se borrarán todas sus lecciones, archivos y el progreso del equipo. Esta acción no se puede deshacer.')) {
      return
    }
    const res = await fetch(`/api/estudio/cursos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Curso eliminado')
      router.push('/admin/estudio')
    } else {
      toast.error('No se pudo eliminar el curso')
    }
  }

  if (loading) {
    return <div className="admin-view py-16 text-center text-ink-muted text-sm">Cargando curso...</div>
  }

  const busy = saving || uploading !== null

  return (
    <div className="admin-view">
      <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => void handleFileSelected(e)} />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <Link
          href={`/admin/estudio/${id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-primary transition-transform duration-150 hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
          Volver al curso
        </Link>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/admin/estudio/${id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas transition-colors duration-150"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
            Vista previa
          </Link>
          <button
            disabled={busy}
            onClick={() => void togglePublish()}
            className="px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas transition-colors duration-150 disabled:opacity-60"
          >
            {estado === 'publicado' ? 'Pasar a borrador' : 'Publicar'}
          </button>
          <button
            disabled={busy || !dirty}
            onClick={() => void save().then((ok) => ok && toast.success('Cambios guardados'))}
            className="btn-primary-3d flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white rounded-field disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {dirty ? 'Guardar cambios' : 'Guardado'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-5">
          <div className="bg-surface rounded-card border border-border shadow-card p-6 space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Título del curso</label>
              <input
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value)
                  setDirty(true)
                }}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-ink mb-1.5">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value)
                  setDirty(true)
                }}
                rows={2}
                className={INPUT_CLASS + ' resize-none'}
              />
            </div>
          </div>

          {modulos.map((m, mi) => (
            <div key={m._id ?? `nuevo-${mi}`} className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-[#FAFBFC]">
                <span className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] flex-shrink-0">
                  Módulo {mi + 1}
                </span>
                <input
                  value={m.titulo}
                  onChange={(e) => patchModule(mi, { titulo: e.target.value })}
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-[13.5px] font-medium text-ink bg-transparent border border-transparent rounded-[8px] outline-none hover:border-border-input focus:border-primary focus:bg-white"
                />
                <button onClick={() => updateModulos(moveItem(modulos, mi, mi - 1))} disabled={mi === 0} className="p-1 text-ink-faint hover:text-ink disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" strokeWidth={1.8} />
                </button>
                <button
                  onClick={() => updateModulos(moveItem(modulos, mi, mi + 1))}
                  disabled={mi === modulos.length - 1}
                  className="p-1 text-ink-faint hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" strokeWidth={1.8} />
                </button>
                <button onClick={() => removeModule(mi)} className="p-1 text-ink-faint hover:text-danger transition-colors duration-150">
                  <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                </button>
              </div>

              <div className="divide-y divide-[#F1F2F5]">
                {m.lecciones.length === 0 && (
                  <p className="px-5 py-4 text-[12.5px] text-ink-faint">Sin lecciones. Sube un video, PDF o presentación.</p>
                )}
                {m.lecciones.map((l, li) => {
                  const Icon = LESSON_ICON[l.tipo]
                  return (
                    <div key={l._id ?? l.archivoUrl} className="flex items-center gap-3 px-5 py-3">
                      <Icon className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.8} />
                      <input
                        value={l.titulo}
                        onChange={(e) => patchLesson(mi, li, e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-[13.5px] text-ink bg-transparent border border-transparent rounded-[8px] outline-none hover:border-border-input focus:border-primary focus:bg-white"
                      />
                      <span className="text-[11.5px] text-ink-faint font-mono flex-shrink-0">
                        {LESSON_LABEL[l.tipo]} · {formatBytes(l.tamano)}
                      </span>
                      <button onClick={() => moveLesson(mi, li, li - 1)} disabled={li === 0} className="p-1 text-ink-faint hover:text-ink disabled:opacity-30">
                        <ArrowUp className="w-4 h-4" strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={() => moveLesson(mi, li, li + 1)}
                        disabled={li === m.lecciones.length - 1}
                        className="p-1 text-ink-faint hover:text-ink disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" strokeWidth={1.8} />
                      </button>
                      <button onClick={() => removeLesson(mi, li)} className="p-1 text-ink-faint hover:text-danger transition-colors duration-150">
                        <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  )
                })}

                {uploading?.moduleIndex === mi && (
                  <div className="px-5 py-3">
                    <div className="flex items-center justify-between text-[12.5px] text-ink-muted mb-1.5">
                      <span className="truncate">Subiendo {uploading.fileName}</span>
                      <span className="font-mono tabular-nums">{uploading.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-[width] duration-200" style={{ width: `${uploading.pct}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-border">
                <button
                  disabled={busy}
                  onClick={() => pickFile(mi)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" strokeWidth={1.8} />
                  Subir lección
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addModule}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-medium text-primary border border-dashed border-primary/40 rounded-card bg-primary-tint/40 hover:bg-primary-tint transition-colors duration-150 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" strokeWidth={1.8} />
            Agregar módulo
          </button>
        </div>

        <div className="space-y-4 sticky top-[88px]">
          <div className="bg-surface rounded-card border border-border shadow-card p-5">
            <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-2">Estado</p>
            <span
              className={
                'inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ' +
                (estado === 'publicado' ? 'bg-success-tint text-success' : 'bg-canvas text-ink-faint')
              }
            >
              {estado === 'publicado' ? 'Publicado' : 'Borrador'}
            </span>
            <p className="text-[12.5px] text-ink-muted mt-2">
              {estado === 'publicado'
                ? 'Los coordinadores ya pueden ver este curso.'
                : 'Solo los administradores ven este curso hasta que lo publiques.'}
            </p>
          </div>
          <div className="bg-primary-tint rounded-card p-5">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.08em] mb-1.5">Archivos</p>
            <ul className="text-[12.5px] text-primary space-y-1 list-disc pl-4">
              <li>Videos: MP4, WEBM o MOV.</li>
              <li>Documentos: PDF.</li>
              <li>Presentaciones: PPT o PPTX.</li>
              <li>Máximo {formatBytes(MAX_UPLOAD_BYTES)} por archivo.</li>
            </ul>
          </div>
          <button
            onClick={() => void handleDelete()}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium text-danger border border-border-input rounded-field bg-white hover:bg-danger-tint transition-colors duration-150 disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
            Eliminar curso
          </button>
        </div>
      </div>
    </div>
  )
}
