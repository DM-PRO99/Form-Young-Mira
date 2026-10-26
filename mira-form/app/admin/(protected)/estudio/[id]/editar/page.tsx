'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Reorder, useDragControls } from 'framer-motion'
import { uploadPresigned } from '@vercel/blob/client'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  FileText,
  GripVertical,
  Loader2,
  PlayCircle,
  Plus,
  Presentation,
  Trash2,
  Upload,
} from 'lucide-react'
import { formatBytes, lessonTypeFromFile, MAX_UPLOAD_BYTES } from '@/lib/estudio'
import { BackLink, useConfirm } from '@/components/admin/ui'
import { LESSON_LABEL, type CourseDetail, type Lesson, type LessonType, type Module } from '../../_types'

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150'

const INLINE_INPUT_CLASS =
  'flex-1 min-w-0 px-2.5 py-1.5 text-[13.5px] text-ink bg-transparent border border-transparent rounded-[8px] outline-none hover:border-border-input focus:border-primary focus:bg-white transition-[border-color,background-color] duration-150'

const ICON_BUTTON_CLASS = 'press p-1 rounded-[6px] text-ink-faint hover:text-ink hover:bg-canvas disabled:opacity-30 disabled:pointer-events-none'

const LESSON_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  pdf: FileText,
  presentacion: Presentation,
}

const ACCEPT = '.mp4,.webm,.mov,.pdf,.ppt,.pptx'
const UNDO_MS = 5000

const lessonKey = (l: Lesson) => l._id ?? l.archivoUrl

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

interface LessonRowProps {
  lesson: Lesson
  index: number
  total: number
  onRename: (titulo: string) => void
  onMove: (to: number) => void
  onRemove: () => void
}

function LessonRow({ lesson, index, total, onRename, onMove, onRemove }: LessonRowProps) {
  const controls = useDragControls()
  const Icon = LESSON_ICON[lesson.tipo]
  return (
    <Reorder.Item
      as="div"
      value={lessonKey(lesson)}
      dragListener={false}
      dragControls={controls}
      className="relative flex items-center gap-2.5 px-3 py-2.5 bg-surface"
      whileDrag={{ boxShadow: '0 12px 28px -12px rgba(16,19,26,0.28)', zIndex: 10 }}
    >
      <button
        type="button"
        aria-label="Arrastrar para reordenar"
        onPointerDown={(e) => controls.start(e)}
        className="p-1 rounded-[6px] text-ink-faint hover:text-ink hover:bg-canvas cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4" strokeWidth={1.8} />
      </button>
      <Icon className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.8} />
      <input value={lesson.titulo} onChange={(e) => onRename(e.target.value)} className={INLINE_INPUT_CLASS} />
      <span className="hidden sm:inline text-[11.5px] text-ink-faint font-mono flex-shrink-0">
        {LESSON_LABEL[lesson.tipo]} · {formatBytes(lesson.tamano)}
      </span>
      <button type="button" aria-label="Subir" onClick={() => onMove(index - 1)} disabled={index === 0} className={'hidden sm:inline-flex ' + ICON_BUTTON_CLASS}>
        <ArrowUp className="w-4 h-4" strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Bajar"
        onClick={() => onMove(index + 1)}
        disabled={index === total - 1}
        className={'hidden sm:inline-flex ' + ICON_BUTTON_CLASS}
      >
        <ArrowDown className="w-4 h-4" strokeWidth={1.8} />
      </button>
      <button
        type="button"
        aria-label="Eliminar lección"
        onClick={onRemove}
        className="press p-1 rounded-[6px] text-ink-faint hover:text-danger hover:bg-danger-tint"
      >
        <Trash2 className="w-4 h-4" strokeWidth={1.8} />
      </button>
    </Reorder.Item>
  )
}

export default function EditarCursoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const confirm = useConfirm()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState<'borrador' | 'publicado'>('borrador')
  const [modulos, setModulosState] = useState<Module[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<{ moduleIndex: number; fileName: string; pct: number; pending: number } | null>(
    null
  )
  const [dragOverModule, setDragOverModule] = useState<number | null>(null)

  const modulosRef = useRef<Module[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<number | null>(null)
  const undoToastsRef = useRef<(string | number)[]>([])

  // El ref mantiene la versión más reciente para las subidas encadenadas y los "Deshacer".
  function setModulos(next: Module[]) {
    modulosRef.current = next
    setModulosState(next)
  }

  const fetchCourse = useCallback(async () => {
    const res = await fetch(`/api/estudio/cursos/${id}`)
    if (res.ok) {
      const json = (await res.json()) as { data: CourseDetail }
      setTitulo(json.data.titulo)
      setDescripcion(json.data.descripcion ?? '')
      setEstado(json.data.estado)
      modulosRef.current = json.data.modulos
      setModulosState(json.data.modulos)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void fetchCourse()
  }, [fetchCourse])

  useEffect(() => {
    if (!dirty) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  function updateModulos(next: Module[]) {
    setModulos(next)
    setDirty(true)
  }

  async function save(overrides?: { modulos?: Module[]; estado?: 'borrador' | 'publicado' }) {
    const payload = {
      titulo,
      descripcion,
      estado: overrides?.estado ?? estado,
      modulos: overrides?.modulos ?? modulosRef.current,
    }
    if (!payload.titulo.trim()) {
      toast.error('El curso necesita un título')
      return false
    }
    if (payload.modulos.some((m) => !m.titulo.trim() || m.lecciones.some((l) => !l.titulo.trim()))) {
      toast.error('Todos los módulos y lecciones necesitan un título')
      return false
    }
    // Al guardar se borran del Blob los archivos quitados, así que ya no se puede deshacer.
    undoToastsRef.current.forEach((t) => toast.dismiss(t))
    undoToastsRef.current = []
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

  function offerUndo(message: string, restore: () => void) {
    const toastId = toast(message, {
      duration: UNDO_MS,
      action: { label: 'Deshacer', onClick: restore },
    })
    undoToastsRef.current.push(toastId)
  }

  function addModule() {
    updateModulos([...modulosRef.current, { titulo: `Módulo ${modulosRef.current.length + 1}`, lecciones: [] }])
  }

  function patchModule(index: number, patch: Partial<Module>) {
    updateModulos(modulosRef.current.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  function removeModule(index: number) {
    const removed = modulosRef.current[index]
    updateModulos(modulosRef.current.filter((_, i) => i !== index))
    offerUndo(`Módulo «${removed.titulo}» eliminado`, () => {
      const restored = [...modulosRef.current]
      restored.splice(Math.min(index, restored.length), 0, removed)
      updateModulos(restored)
    })
  }

  function removeLesson(moduleIndex: number, lessonIndex: number) {
    const modulo = modulosRef.current[moduleIndex]
    const removed = modulo.lecciones[lessonIndex]
    const moduleRef = modulo._id
    patchModule(moduleIndex, { lecciones: modulo.lecciones.filter((_, i) => i !== lessonIndex) })
    offerUndo(`Lección «${removed.titulo}» eliminada`, () => {
      const target = modulosRef.current.findIndex((m, i) => (moduleRef ? m._id === moduleRef : i === moduleIndex))
      if (target === -1) return
      const lecciones = [...modulosRef.current[target].lecciones]
      lecciones.splice(Math.min(lessonIndex, lecciones.length), 0, removed)
      patchModule(target, { lecciones })
    })
  }

  function reorderLessons(moduleIndex: number, keys: string[]) {
    const byKey = new Map(modulosRef.current[moduleIndex].lecciones.map((l) => [lessonKey(l), l]))
    patchModule(moduleIndex, { lecciones: keys.map((k) => byKey.get(k)!).filter(Boolean) })
  }

  async function uploadFiles(files: File[], moduleIndex: number) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const tipo = lessonTypeFromFile(file)
      if (!tipo) {
        toast.error(`«${file.name}»: formato no soportado. Usa MP4, WEBM, MOV, PDF, PPT o PPTX.`)
        continue
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`«${file.name}» supera el máximo de ${formatBytes(MAX_UPLOAD_BYTES)}`)
        continue
      }

      setUploading({ moduleIndex, fileName: file.name, pct: 0, pending: files.length - i - 1 })
      try {
        const blob = await uploadPresigned(`estudio/${id}/${safeFileName(file.name)}`, file, {
          access: 'public',
          handleUploadUrl: '/api/estudio/upload',
          multipart: file.size > 50 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            setUploading((prev) => (prev ? { ...prev, pct: Math.round(percentage) } : prev))
          },
        })
        const lesson: Lesson = {
          titulo: file.name.replace(/\.[^.]+$/, ''),
          tipo,
          archivoUrl: blob.url,
          archivoNombre: file.name,
          tamano: file.size,
        }
        const next = modulosRef.current.map((m, mi) =>
          mi === moduleIndex ? { ...m, lecciones: [...m.lecciones, lesson] } : m
        )
        setModulos(next)
        if (await save({ modulos: next })) {
          toast.success(`«${lesson.titulo}» agregada`)
        } else {
          setDirty(true)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `No se pudo subir «${file.name}»`)
      }
    }
    setUploading(null)
  }

  function pickFile(moduleIndex: number) {
    uploadTargetRef.current = moduleIndex
    fileInputRef.current?.click()
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const moduleIndex = uploadTargetRef.current
    if (files.length === 0 || moduleIndex === null) return
    void uploadFiles(files, moduleIndex)
  }

  function handleDrop(e: React.DragEvent, moduleIndex: number) {
    e.preventDefault()
    setDragOverModule(null)
    if (uploading || saving) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) void uploadFiles(files, moduleIndex)
  }

  async function togglePublish() {
    const next = estado === 'publicado' ? 'borrador' : 'publicado'
    if (await save({ estado: next })) {
      toast.success(next === 'publicado' ? 'Curso publicado' : 'Curso pasado a borrador')
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminar curso',
      description: (
        <>
          Se eliminará <span className="font-medium text-ink">{titulo || 'este curso'}</span> con todas sus lecciones, sus archivos y el progreso del
          equipo. Esta acción no se puede deshacer.
        </>
      ),
      confirmLabel: 'Eliminar curso',
    })
    if (!ok) return
    const res = await fetch(`/api/estudio/cursos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDirty(false)
      toast.success('Curso eliminado')
      router.push('/admin/estudio')
    } else {
      toast.error('No se pudo eliminar el curso')
    }
  }

  if (loading) {
    return (
      <div className="admin-view">
        <div className="h-9 w-full bg-zinc-100 rounded-field animate-pulse mb-5" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-5">
            <div className="h-[150px] bg-surface rounded-card border border-border animate-pulse" />
            <div className="h-[200px] bg-surface rounded-card border border-border animate-pulse" />
          </div>
          <div className="h-[220px] bg-surface rounded-card border border-border animate-pulse" />
        </div>
      </div>
    )
  }

  const busy = saving || uploading !== null

  return (
    <div className="admin-view">
      <input ref={fileInputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={handleFileSelected} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <BackLink href={`/admin/estudio/${id}`}>Volver al curso</BackLink>
        <div className="flex flex-wrap items-center gap-2.5">
          {dirty && (
            <span className="flex items-center gap-1.5 text-[12.5px] text-warning mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              Cambios sin guardar
            </span>
          )}
          <Link
            href={`/admin/estudio/${id}`}
            className="press flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
            Vista previa
          </Link>
          <button
            disabled={busy}
            onClick={() => void togglePublish()}
            className="press px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas disabled:opacity-60"
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 lg:gap-6 items-start">
        <div className="space-y-5 min-w-0">
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

          {modulos.map((m, mi) => {
            const isUploadingHere = uploading?.moduleIndex === mi
            return (
              <div
                key={m._id ?? `nuevo-${mi}`}
                data-active={dragOverModule === mi}
                onDragOver={(e) => {
                  if (!e.dataTransfer.types.includes('Files')) return
                  e.preventDefault()
                  if (dragOverModule !== mi) setDragOverModule(mi)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOverModule(null)
                }}
                onDrop={(e) => handleDrop(e, mi)}
                className="dropzone bg-surface rounded-card border border-border shadow-card overflow-hidden"
              >
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-[#FAFBFC]">
                  <span className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] flex-shrink-0">
                    Módulo {mi + 1}
                  </span>
                  <input
                    value={m.titulo}
                    onChange={(e) => patchModule(mi, { titulo: e.target.value })}
                    className={INLINE_INPUT_CLASS + ' font-medium'}
                  />
                  <span className="text-[11.5px] text-ink-faint flex-shrink-0 mr-1">
                    {m.lecciones.length} lección{m.lecciones.length === 1 ? '' : 'es'}
                  </span>
                  <button
                    aria-label="Subir módulo"
                    onClick={() => updateModulos(moveItem(modulosRef.current, mi, mi - 1))}
                    disabled={mi === 0}
                    className={ICON_BUTTON_CLASS}
                  >
                    <ArrowUp className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                  <button
                    aria-label="Bajar módulo"
                    onClick={() => updateModulos(moveItem(modulosRef.current, mi, mi + 1))}
                    disabled={mi === modulos.length - 1}
                    className={ICON_BUTTON_CLASS}
                  >
                    <ArrowDown className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                  <button
                    aria-label="Eliminar módulo"
                    onClick={() => removeModule(mi)}
                    className="press p-1 rounded-[6px] text-ink-faint hover:text-danger hover:bg-danger-tint"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>

                {m.lecciones.length > 0 && (
                  <Reorder.Group
                    as="div"
                    axis="y"
                    values={m.lecciones.map(lessonKey)}
                    onReorder={(keys) => reorderLessons(mi, keys)}
                    className="divide-y divide-[#F1F2F5]"
                  >
                    {m.lecciones.map((l, li) => (
                      <LessonRow
                        key={lessonKey(l)}
                        lesson={l}
                        index={li}
                        total={m.lecciones.length}
                        onRename={(nuevo) =>
                          patchModule(mi, {
                            lecciones: modulosRef.current[mi].lecciones.map((x, i) => (i === li ? { ...x, titulo: nuevo } : x)),
                          })
                        }
                        onMove={(to) => patchModule(mi, { lecciones: moveItem(modulosRef.current[mi].lecciones, li, to) })}
                        onRemove={() => removeLesson(mi, li)}
                      />
                    ))}
                  </Reorder.Group>
                )}

                {isUploadingHere && uploading && (
                  <div className="px-5 py-3 border-t border-[#F1F2F5]">
                    <div className="flex items-center justify-between text-[12.5px] text-ink-muted mb-1.5">
                      <span className="truncate">
                        Subiendo {uploading.fileName}
                        {uploading.pending > 0 && ` · ${uploading.pending} en espera`}
                      </span>
                      <span className="font-mono tabular-nums">{uploading.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
                      <div
                        className="progress-fill h-full w-full bg-primary rounded-full"
                        style={{ transform: `scaleX(${uploading.pct / 100})` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => pickFile(mi)}
                  className={
                    'w-full flex items-center justify-center gap-2 px-5 py-4 text-[12.5px] border-t border-dashed transition-colors duration-150 disabled:opacity-50 ' +
                    (dragOverModule === mi
                      ? 'border-primary text-primary bg-primary-tint/60'
                      : 'border-border text-ink-muted hover:text-primary hover:bg-[#F7F9FE]')
                  }
                >
                  <Upload className="w-4 h-4" strokeWidth={1.8} />
                  {dragOverModule === mi ? (
                    <span className="font-medium">Suelta para subir a este módulo</span>
                  ) : (
                    <span>
                      <span className="font-medium text-primary">Sube archivos</span> o arrástralos aquí · video, PDF o presentación
                    </span>
                  )}
                </button>
              </div>
            )
          })}

          <button
            onClick={addModule}
            disabled={busy}
            className="press w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-medium text-primary border border-dashed border-primary/40 rounded-card bg-primary-tint/40 hover:bg-primary-tint disabled:opacity-60"
          >
            <Plus className="w-4 h-4" strokeWidth={1.8} />
            Agregar módulo
          </button>
        </div>

        <div className="space-y-4 lg:sticky lg:top-[88px]">
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
              <li>Arrastra las lecciones por el ícono ⋮⋮ para reordenarlas.</li>
            </ul>
          </div>
          <button
            onClick={() => void handleDelete()}
            disabled={busy}
            className="press w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium text-danger border border-border-input rounded-field bg-white hover:bg-danger-tint disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
            Eliminar curso
          </button>
        </div>
      </div>
    </div>
  )
}
