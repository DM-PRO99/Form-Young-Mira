'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Reorder } from 'framer-motion'
import { uploadPresigned } from '@vercel/blob/client'
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  ScrollText,
  Trash2,
  Upload,
} from 'lucide-react'
import { BackLink, Badge, Card, Eyebrow, IconButton, Input, Textarea, useConfirm } from '@/components/admin/ui'
import { formatBytes, lessonTypeFromFile, MAX_UPLOAD_BYTES } from '@/lib/estudio'
import { cn } from '@/lib/cn'
import { type CourseDetail, type Lesson, type Module, type Quiz } from '../../_types'
import { LessonRow, QuizEditor, RichTextEditor, Switch, lessonKey, validarCuestionario } from './_partes'

const ACCEPT = '.mp4,.webm,.mov,.pdf,.ppt,.pptx'
const UNDO_MS = 5000

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

function nuevaClave(): string {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`
}

type UploadTarget = { moduleIndex: number; lessonKey?: string }

export default function EditarCursoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const confirm = useConfirm()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState<'borrador' | 'publicado'>('borrador')
  const [desbloqueoSecuencial, setDesbloqueoSecuencial] = useState(false)
  const [portadaUrl, setPortadaUrl] = useState<string | null>(null)
  const [inicio, setInicio] = useState('')
  const [programa, setPrograma] = useState('')
  const [subiendoPortada, setSubiendoPortada] = useState(false)
  const portadaInputRef = useRef<HTMLInputElement>(null)
  const [modulos, setModulosState] = useState<Module[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<{ moduleIndex: number; fileName: string; pct: number; pending: number } | null>(null)
  const [dragOverModule, setDragOverModule] = useState<number | null>(null)
  const [leccionAbierta, setLeccionAbierta] = useState<string | null>(null)
  const [introAbierta, setIntroAbierta] = useState<Set<number>>(new Set())
  const [quizAbierto, setQuizAbierto] = useState<Set<number>>(new Set())

  const modulosRef = useRef<Module[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<UploadTarget | null>(null)
  const undoToastsRef = useRef<(string | number)[]>([])
  const leccionAbiertaRef = useRef<string | null>(null)
  leccionAbiertaRef.current = leccionAbierta

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
      setDesbloqueoSecuencial(!!json.data.desbloqueoSecuencial)
      setPortadaUrl(json.data.portadaUrl ?? null)
      setInicio(json.data.inicio ?? '')
      setPrograma(json.data.programa ?? '')
      modulosRef.current = json.data.modulos
      setModulosState(json.data.modulos)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void fetchCourse()
  }, [fetchCourse])

  // Desde Inicio o Programa se llega con #caratula o #programa: se baja hasta esa sección.
  useEffect(() => {
    if (loading || !window.location.hash) return
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading])

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

  function posicionDeLeccion(lista: Module[], key: string | null): [number, number] | null {
    if (!key) return null
    for (let mi = 0; mi < lista.length; mi++) {
      const li = lista[mi].lecciones.findIndex((l) => lessonKey(l) === key)
      if (li >= 0) return [mi, li]
    }
    return null
  }

  async function save(overrides?: { modulos?: Module[]; estado?: 'borrador' | 'publicado'; desbloqueoSecuencial?: boolean }) {
    const payload = {
      titulo,
      descripcion,
      estado: overrides?.estado ?? estado,
      desbloqueoSecuencial: overrides?.desbloqueoSecuencial ?? desbloqueoSecuencial,
      portadaUrl,
      inicio,
      programa,
      modulos: overrides?.modulos ?? modulosRef.current,
    }
    if (!payload.titulo.trim()) {
      toast.error('El curso necesita un título')
      return false
    }
    if (payload.modulos.some((m) => !m.titulo.trim() || m.lecciones.some((l) => !l.titulo.trim()))) {
      toast.error('Todos los temas y lecciones necesitan un título')
      return false
    }
    for (const m of payload.modulos) {
      const error = validarCuestionario(m.cuestionario, m.titulo)
      if (error) {
        toast.error(error)
        return false
      }
    }
    // Al guardar se borran del Blob los archivos quitados, así que ya no se puede deshacer.
    undoToastsRef.current.forEach((t) => toast.dismiss(t))
    undoToastsRef.current = []
    const abierta = posicionDeLeccion(payload.modulos, leccionAbiertaRef.current)
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
      // Las lecciones nuevas reciben su _id al guardar: se mantiene abierta la que se estaba editando.
      if (abierta) {
        const guardada = json.data.modulos[abierta[0]]?.lecciones[abierta[1]]
        setLeccionAbierta(guardada?._id ?? null)
      }
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
    const toastId = toast(message, { duration: UNDO_MS, action: { label: 'Deshacer', onClick: restore } })
    undoToastsRef.current.push(toastId)
  }

  function addModule() {
    updateModulos([...modulosRef.current, { titulo: `Tema ${modulosRef.current.length + 1}`, lecciones: [] }])
  }

  function patchModule(index: number, patch: Partial<Module>) {
    updateModulos(modulosRef.current.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  function patchLesson(moduleIndex: number, key: string, patch: Partial<Lesson>) {
    patchModule(moduleIndex, {
      lecciones: modulosRef.current[moduleIndex].lecciones.map((l) => (lessonKey(l) === key ? { ...l, ...patch } : l)),
    })
  }

  function removeModule(index: number) {
    const removed = modulosRef.current[index]
    updateModulos(modulosRef.current.filter((_, i) => i !== index))
    offerUndo(`Tema «${removed.titulo}» eliminado`, () => {
      const restored = [...modulosRef.current]
      restored.splice(Math.min(index, restored.length), 0, removed)
      updateModulos(restored)
    })
  }

  function addTheoryLesson(moduleIndex: number) {
    const lesson: Lesson = { _key: nuevaClave(), titulo: 'Nueva lección', contenido: '' }
    patchModule(moduleIndex, { lecciones: [...modulosRef.current[moduleIndex].lecciones, lesson] })
    setLeccionAbierta(lesson._key!)
  }

  function removeLesson(moduleIndex: number, key: string) {
    const modulo = modulosRef.current[moduleIndex]
    const lessonIndex = modulo.lecciones.findIndex((l) => lessonKey(l) === key)
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

  async function uploadImage(file: File): Promise<string> {
    const blob = await uploadPresigned(`estudio/${id}/img/${safeFileName(file.name)}`, file, {
      access: 'public',
      handleUploadUrl: '/api/estudio/upload',
      clientPayload: 'imagen',
    })
    setDirty(true)
    return blob.url
  }

  async function uploadPortada(file: File) {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      toast.error('La portada debe ser una imagen PNG, JPG, WEBP o GIF')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La portada no puede pasar de 10 MB')
      return
    }
    setSubiendoPortada(true)
    try {
      const url = await uploadImage(new File([file], `portada-${file.name}`, { type: file.type }))
      setPortadaUrl(url)
      setDirty(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo subir la portada')
    } finally {
      setSubiendoPortada(false)
    }
  }

  async function uploadFiles(files: File[], target: UploadTarget) {
    const { moduleIndex } = target
    // Al adjuntar a una lección existente solo se usa el primer archivo.
    const lista = target.lessonKey ? files.slice(0, 1) : files
    for (let i = 0; i < lista.length; i++) {
      const file = lista[i]
      const tipo = lessonTypeFromFile(file)
      if (!tipo) {
        toast.error(`«${file.name}»: formato no soportado. Usa MP4, WEBM, MOV, PDF, PPT o PPTX.`)
        continue
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`«${file.name}» supera el máximo de ${formatBytes(MAX_UPLOAD_BYTES)}`)
        continue
      }

      setUploading({ moduleIndex, fileName: file.name, pct: 0, pending: lista.length - i - 1 })
      try {
        const blob = await uploadPresigned(`estudio/${id}/${safeFileName(file.name)}`, file, {
          access: 'public',
          handleUploadUrl: '/api/estudio/upload',
          multipart: file.size > 50 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => {
            setUploading((prev) => (prev ? { ...prev, pct: Math.round(percentage) } : prev))
          },
        })
        const adjunto = { tipo, archivoUrl: blob.url, archivoNombre: file.name, tamano: file.size }
        const next = modulosRef.current.map((m, mi) => {
          if (mi !== moduleIndex) return m
          if (target.lessonKey) {
            return { ...m, lecciones: m.lecciones.map((l) => (lessonKey(l) === target.lessonKey ? { ...l, ...adjunto } : l)) }
          }
          return { ...m, lecciones: [...m.lecciones, { titulo: file.name.replace(/\.[^.]+$/, ''), ...adjunto }] }
        })
        setModulos(next)
        if (await save({ modulos: next })) {
          toast.success(target.lessonKey ? 'Archivo adjuntado' : `«${file.name}» agregado como lección`)
        } else {
          setDirty(true)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `No se pudo subir «${file.name}»`)
      }
    }
    setUploading(null)
  }

  function pickFile(target: UploadTarget) {
    uploadTargetRef.current = target
    if (fileInputRef.current) fileInputRef.current.multiple = !target.lessonKey
    fileInputRef.current?.click()
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const target = uploadTargetRef.current
    if (files.length === 0 || !target) return
    void uploadFiles(files, target)
  }

  function handleDrop(e: React.DragEvent, moduleIndex: number) {
    e.preventDefault()
    setDragOverModule(null)
    if (uploading || saving) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) void uploadFiles(files, { moduleIndex })
  }

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<number>>>, i: number) {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function setQuiz(moduleIndex: number, quiz: Quiz | null) {
    patchModule(moduleIndex, { cuestionario: quiz })
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
          Se eliminará <span className="font-medium text-ink">{titulo || 'este curso'}</span> con todas sus lecciones, sus archivos, los cuestionarios y el
          progreso del equipo. Esta acción no se puede deshacer.
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

  const busy = saving || uploading !== null || subiendoPortada

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
          <Card className="p-5 md:p-6 space-y-4">
            <div>
              <label htmlFor="titulo-curso" className="block text-[13px] font-medium text-ink mb-1.5">
                Título del curso
              </label>
              <Input
                id="titulo-curso"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value)
                  setDirty(true)
                }}
              />
            </div>
            <div>
              <label htmlFor="descripcion-curso" className="block text-[13px] font-medium text-ink mb-1.5">
                Descripción
              </label>
              <Textarea
                id="descripcion-curso"
                rows={2}
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value)
                  setDirty(true)
                }}
              />
            </div>
          </Card>

          <Card id="caratula" className="p-5 md:p-6 space-y-4 scroll-mt-[96px]">
            <div className="flex items-start gap-3">
              <ImagePlus className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.8} />
              <div>
                <p className="text-[14px] font-bold text-ink">Carátula del curso</p>
                <p className="text-[12.5px] text-ink-muted">Es lo primero que se ve al entrar al curso («Inicio»). La portada también aparece en la tarjeta del curso.</p>
              </div>
            </div>

            <input
              ref={portadaInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void uploadPortada(f)
              }}
            />
            {portadaUrl ? (
              <div className="relative overflow-hidden rounded-card border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={portadaUrl} alt="Portada del curso" className="w-full aspect-[16/7] object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => portadaInputRef.current?.click()}
                    className="press inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 backdrop-blur text-[12px] font-semibold text-ink shadow-card hover:bg-white disabled:opacity-60"
                  >
                    {subiendoPortada ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" strokeWidth={1.8} />}
                    Cambiar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setPortadaUrl(null)
                      setDirty(true)
                    }}
                    className="press inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 backdrop-blur text-[12px] font-semibold text-danger shadow-card hover:bg-white disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => portadaInputRef.current?.click()}
                className="w-full aspect-[16/6] flex flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-primary/40 bg-primary-tint/40 text-primary hover:bg-primary-tint transition-colors duration-150 disabled:opacity-60"
              >
                {subiendoPortada ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" strokeWidth={1.8} />}
                <span className="text-[13px] font-semibold">{subiendoPortada ? 'Subiendo portada…' : 'Subir foto de portada'}</span>
                <span className="text-[11.5px] text-ink-muted">PNG, JPG o WEBP · horizontal, idealmente 1600×700</span>
              </button>
            )}

            <div>
              <p className="block text-[13px] font-medium text-ink mb-1.5">Contenido de Inicio</p>
              <RichTextEditor
                value={inicio}
                onChange={(html) => {
                  setInicio(html)
                  setDirty(true)
                }}
                onUploadImage={uploadImage}
                placeholder="Bienvenida al curso: de qué trata, a quién va dirigido, cómo se trabaja y a quién contactar…"
                minHeight={140}
              />
            </div>
          </Card>

          <Card id="programa" className="p-5 md:p-6 space-y-3 scroll-mt-[96px]">
            <div className="flex items-start gap-3">
              <ScrollText className="w-4 h-4 text-violet mt-0.5 flex-shrink-0" strokeWidth={1.8} />
              <div>
                <p className="text-[14px] font-bold text-ink">Programa del curso</p>
                <p className="text-[12.5px] text-ink-muted">Objetivos, metodología, cronograma y forma de evaluación.</p>
              </div>
            </div>
            <RichTextEditor
              value={programa}
              onChange={(html) => {
                setPrograma(html)
                setDirty(true)
              }}
              onUploadImage={uploadImage}
              placeholder="Objetivos del curso, temas, cronograma y cómo se califica…"
              minHeight={140}
            />
          </Card>

          {modulos.map((m, mi) => {
            const isUploadingHere = uploading?.moduleIndex === mi
            const introOpen = introAbierta.has(mi)
            const quizOpen = quizAbierto.has(mi)
            const totalPreguntas = m.cuestionario?.preguntas.length ?? 0
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
                <div className="flex items-center gap-2 px-4 md:px-5 py-3.5 border-b border-border bg-surface-muted">
                  <span className="text-[11px] font-bold text-ink-faint uppercase tracking-[0.08em] flex-shrink-0">Tema {mi + 1}</span>
                  <input
                    value={m.titulo}
                    onChange={(e) => patchModule(mi, { titulo: e.target.value })}
                    aria-label={`Título del tema ${mi + 1}`}
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-[14px] font-bold text-ink bg-transparent border border-transparent rounded-[8px] outline-none hover:border-border-input focus:border-primary focus:bg-white"
                  />
                  <IconButton label="Subir tema" onClick={() => updateModulos(moveItem(modulosRef.current, mi, mi - 1))} disabled={mi === 0}>
                    <ArrowUp className="w-4 h-4" strokeWidth={1.8} />
                  </IconButton>
                  <IconButton label="Bajar tema" onClick={() => updateModulos(moveItem(modulosRef.current, mi, mi + 1))} disabled={mi === modulos.length - 1}>
                    <ArrowDown className="w-4 h-4" strokeWidth={1.8} />
                  </IconButton>
                  <IconButton label="Eliminar tema" tone="danger" onClick={() => removeModule(mi)}>
                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                  </IconButton>
                </div>

                {/* Introducción del tema */}
                <div className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => toggleSet(setIntroAbierta, mi)}
                    aria-expanded={introOpen}
                    className="w-full flex items-center gap-2 px-4 md:px-5 py-3 text-left hover:bg-surface-muted transition-colors duration-150"
                  >
                    <FileText className="w-4 h-4 text-violet flex-shrink-0" strokeWidth={1.8} />
                    <span className="flex-1 text-[13px] font-semibold text-ink">Introducción del tema</span>
                    {m.descripcion ? <Badge tone="violet">Escrita</Badge> : <span className="text-[12px] text-ink-faint">Opcional</span>}
                    <ChevronDown className={cn('w-4 h-4 text-ink-faint transition-transform duration-200', introOpen && 'rotate-180')} strokeWidth={1.8} />
                  </button>
                  {introOpen && (
                    <div className="lesson-fade px-4 md:px-5 pb-4">
                      <RichTextEditor
                        value={m.descripcion ?? ''}
                        onChange={(html) => patchModule(mi, { descripcion: html })}
                        onUploadImage={uploadImage}
                        placeholder="Presenta el tema: de qué trata, qué se va a aprender y por qué importa…"
                        minHeight={120}
                      />
                    </div>
                  )}
                </div>

                {/* Lecciones */}
                {m.lecciones.length > 0 && (
                  <Reorder.Group as="div" axis="y" values={m.lecciones.map(lessonKey)} onReorder={(keys) => reorderLessons(mi, keys)} className="divide-y divide-[#F1F2F5]">
                    {m.lecciones.map((l, li) => {
                      const key = lessonKey(l)
                      return (
                        <LessonRow
                          key={key}
                          lesson={l}
                          index={li}
                          total={m.lecciones.length}
                          expanded={leccionAbierta === key}
                          busy={busy}
                          onToggle={() => setLeccionAbierta((prev) => (prev === key ? null : key))}
                          onChange={(patch) => patchLesson(mi, key, patch)}
                          onMove={(to) => patchModule(mi, { lecciones: moveItem(modulosRef.current[mi].lecciones, li, to) })}
                          onRemove={() => removeLesson(mi, key)}
                          onAttach={() => pickFile({ moduleIndex: mi, lessonKey: key })}
                          onUploadImage={uploadImage}
                        />
                      )
                    })}
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
                      <div className="progress-fill h-full w-full bg-primary rounded-full" style={{ transform: `scaleX(${uploading.pct / 100})` }} />
                    </div>
                  </div>
                )}

                {/* Acciones del tema */}
                <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-border divide-y sm:divide-y-0 sm:divide-x divide-border">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => addTheoryLesson(mi)}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 text-[12.5px] font-semibold text-primary hover:bg-primary-tint/50 disabled:opacity-50 transition-colors duration-150"
                  >
                    <BookOpen className="w-4 h-4" strokeWidth={1.8} />
                    Nueva lección de teoría
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => pickFile({ moduleIndex: mi })}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3.5 text-[12.5px] transition-colors duration-150 disabled:opacity-50',
                      dragOverModule === mi ? 'bg-primary-tint text-primary font-semibold' : 'text-ink-muted hover:text-primary hover:bg-primary-tint/50'
                    )}
                  >
                    <Upload className="w-4 h-4" strokeWidth={1.8} />
                    {dragOverModule === mi ? 'Suelta para subir' : 'Subir archivo o arrastrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!m.cuestionario) setQuiz(mi, { preguntas: [], notaMinima: 70 })
                      toggleSet(setQuizAbierto, mi)
                    }}
                    aria-expanded={quizOpen}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 text-[12.5px] font-semibold text-success hover:bg-success-tint/60 transition-colors duration-150"
                  >
                    <ClipboardCheck className="w-4 h-4" strokeWidth={1.8} />
                    {totalPreguntas > 0 ? `Cuestionario · ${totalPreguntas} pregunta${totalPreguntas === 1 ? '' : 's'}` : 'Agregar cuestionario'}
                  </button>
                </div>

                {quizOpen && m.cuestionario && (
                  <div className="lesson-fade border-t border-border bg-surface-muted px-4 md:px-5 py-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <p className="text-[13.5px] font-bold text-ink">Cuestionario del tema</p>
                      {totalPreguntas > 0 && (
                        <button type="button" onClick={() => setQuiz(mi, null)} className="text-[12px] font-semibold text-danger hover:underline">
                          Quitar cuestionario
                        </button>
                      )}
                    </div>
                    <QuizEditor quiz={m.cuestionario} onChange={(q) => setQuiz(mi, q)} />
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={addModule}
            disabled={busy}
            className="press w-full flex items-center justify-center gap-2 py-3.5 text-[13px] font-semibold text-primary border border-dashed border-primary/40 rounded-card bg-primary-tint/40 hover:bg-primary-tint disabled:opacity-60"
          >
            <Plus className="w-4 h-4" strokeWidth={1.8} />
            Agregar tema
          </button>
        </div>

        <div className="space-y-4 lg:sticky lg:top-[88px]">
          <Card className="p-5">
            <Eyebrow className="mb-2">Estado</Eyebrow>
            <Badge tone={estado === 'publicado' ? 'success' : 'neutral'} dot>
              {estado === 'publicado' ? 'Publicado' : 'Borrador'}
            </Badge>
            <p className="text-[12.5px] text-ink-muted mt-2">
              {estado === 'publicado' ? 'Los coordinadores ya pueden ver este curso.' : 'Solo los administradores ven este curso hasta que lo publiques.'}
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.8} />
              <div className="flex-1">
                <p className="text-[13px] font-bold text-ink">Desbloquear temas en orden</p>
                <p className="text-[12px] text-ink-muted mt-0.5">
                  Cada tema se abre cuando se ven todas las lecciones del anterior y se aprueba su cuestionario.
                </p>
              </div>
              <Switch
                checked={desbloqueoSecuencial}
                label="Desbloquear temas en orden"
                onChange={(v) => {
                  setDesbloqueoSecuencial(v)
                  setDirty(true)
                }}
              />
            </div>
          </Card>

          <Link
            href={`/admin/estudio/${id}/reporte`}
            className="press flex items-center justify-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold text-primary border border-border-input rounded-field bg-white hover:bg-primary-tint"
          >
            <BarChart3 className="w-4 h-4" strokeWidth={1.8} />
            Ver reporte de avance
          </Link>

          <div className="bg-primary-tint rounded-card p-5">
            <Eyebrow className="text-primary mb-1.5">Cómo armar el curso</Eyebrow>
            <ul className="text-[12.5px] text-ink-muted space-y-1.5 list-disc pl-4">
              <li>Cada tema puede tener introducción, lecciones y un cuestionario.</li>
              <li>Una lección puede tener teoría escrita y un archivo de apoyo.</li>
              <li>Archivos: MP4, WEBM, MOV, PDF, PPT o PPTX, hasta {formatBytes(MAX_UPLOAD_BYTES)}.</li>
              <li>Arrastra las lecciones por el ícono ⋮⋮ para reordenarlas.</li>
              <li>Las tareas con entrega se crean desde la sección «Tareas» del curso.</li>
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
