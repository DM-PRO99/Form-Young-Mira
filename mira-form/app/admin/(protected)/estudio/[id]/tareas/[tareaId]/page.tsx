'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { uploadPresigned } from '@vercel/blob/client'
import { CalendarClock, CheckCircle2, Download, FileUp, MessageSquare, Paperclip, Pencil, Send, Trash2, X } from 'lucide-react'
import { Avatar, BackLink, Badge, Button, Card, EmptyState, Eyebrow, IconButton, Input, Textarea, useConfirm } from '@/components/admin/ui'
import { formatBytes } from '@/lib/estudio'
import { cn } from '@/lib/cn'
import { formatFechaLimite, tareaVencida, type Entrega, type Tarea } from '../../../_types'
import { Teoria, useCurso } from '../../_curso'
import { TareaModal, estadoTarea } from '../_form'

const MAX_ENTREGA_BYTES = 50 * 1024 * 1024
const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.mp4,.zip'

function safeFileName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-')
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function esTardia(e: Pick<Entrega, 'entregadaEn'>, t: Tarea): boolean {
  return !!t.fechaLimite && new Date(e.entregadaEn).getTime() > new Date(t.fechaLimite).getTime()
}

function persona(e: Entrega): { nombre: string; email: string } {
  return typeof e.userId === 'object' ? { nombre: e.userId.nombre ?? 'Sin nombre', email: e.userId.email ?? '' } : { nombre: 'Usuario', email: '' }
}

function ArchivoEntregado({ e }: { e: Entrega }) {
  if (!e.archivoUrl) return null
  return (
    <a
      href={`${e.archivoUrl}?download=1`}
      className="press inline-flex items-center gap-2 max-w-full px-3 py-2 rounded-[10px] border border-border-input bg-white text-[12.5px] text-ink hover:border-primary/40"
    >
      <Paperclip className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.8} />
      <span className="truncate font-medium">{e.archivoNombre ?? 'Archivo'}</span>
      {e.tamano !== undefined && <span className="text-ink-faint flex-shrink-0">{formatBytes(e.tamano)}</span>}
      <Download className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" strokeWidth={1.8} />
    </a>
  )
}

// ─── Entrega de quien hace la tarea ─────────────────────────────────────────

function MiEntrega({ tarea, courseId, userId, onCambio }: { tarea: Tarea; courseId: string; userId: string | null; onCambio: () => void }) {
  const [entrega, setEntrega] = useState<Entrega | null>(null)
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [archivo, setArchivo] = useState<{ url: string; nombre: string; tamano: number } | null>(null)
  const [subiendo, setSubiendo] = useState<number | null>(null)
  const [enviando, setEnviando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/estudio/cursos/${courseId}/tareas/${tarea._id}/entregas`)
    const json = (await res.json().catch(() => ({}))) as { data?: { miEntrega: Entrega | null } }
    const mia = json.data?.miEntrega ?? null
    setEntrega(mia)
    setEditando(!mia)
    setTexto(mia?.texto ?? '')
    setArchivo(mia?.archivoUrl ? { url: mia.archivoUrl, nombre: mia.archivoNombre ?? 'Archivo', tamano: mia.tamano ?? 0 } : null)
    setCargando(false)
  }, [courseId, tarea._id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function subir(file: File) {
    if (!userId) return
    if (file.size > MAX_ENTREGA_BYTES) {
      toast.error(`El archivo supera el máximo de ${formatBytes(MAX_ENTREGA_BYTES)}`)
      return
    }
    setSubiendo(0)
    try {
      const blob = await uploadPresigned(`estudio/${courseId}/entregas/${userId}/${safeFileName(file.name)}`, file, {
        access: 'public',
        handleUploadUrl: '/api/estudio/upload',
        clientPayload: 'entrega',
        onUploadProgress: ({ percentage }) => setSubiendo(Math.round(percentage)),
      })
      setArchivo({ url: blob.url, nombre: file.name, tamano: file.size })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo subir el archivo')
    } finally {
      setSubiendo(null)
    }
  }

  async function enviar() {
    if (!texto.trim() && !archivo) {
      toast.error('Escribe tu respuesta o adjunta un archivo')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch(`/api/estudio/cursos/${courseId}/tareas/${tarea._id}/entregas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto: tarea.entregaTexto ? texto : undefined,
          archivoUrl: tarea.entregaArchivo ? archivo?.url ?? null : null,
          archivoNombre: archivo?.nombre,
          tamano: archivo?.tamano,
        }),
      })
      const json = (await res.json()) as { data?: Entrega; error?: string }
      if (!res.ok || !json.data) throw new Error(json.error ?? 'No se pudo enviar la entrega')
      toast.success(entrega ? 'Entrega actualizada' : '¡Tarea entregada!')
      setEntrega(json.data)
      setEditando(false)
      onCambio()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar la entrega')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <Card className="h-[180px] animate-pulse" />

  const calificada = entrega?.calificacion !== undefined && entrega?.calificacion !== null

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <Eyebrow>Tu entrega</Eyebrow>
        {entrega && !editando && !calificada && (
          <Button variant="secondary" size="sm" icon={<Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />} onClick={() => setEditando(true)}>
            Volver a entregar
          </Button>
        )}
      </div>

      {calificada && entrega && (
        <div className="celebrate-in mb-4 rounded-card bg-success-tint border border-success/20 p-4 flex flex-wrap items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-success text-white flex flex-col items-center justify-center leading-none">
            <span className="text-[17px] font-extrabold">{entrega.calificacion}</span>
            <span className="text-[10px] opacity-80">/{tarea.puntajeMaximo}</span>
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-[14.5px] font-bold text-ink">Tarea calificada</p>
            {entrega.comentario ? (
              <p className="text-[13px] text-ink mt-1 whitespace-pre-line">
                <MessageSquare className="inline w-3.5 h-3.5 mr-1 text-success" strokeWidth={1.8} />
                {entrega.comentario}
              </p>
            ) : (
              <p className="text-[13px] text-ink-muted">Sin comentarios del administrador.</p>
            )}
          </div>
        </div>
      )}

      {entrega && !editando ? (
        <div className="space-y-3">
          <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-muted">
            <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={1.8} />
            Entregada el {formatFecha(entrega.entregadaEn)}
            {esTardia(entrega, tarea) && <Badge tone="warning">Tardía</Badge>}
          </p>
          {entrega.texto && <p className="text-[13.5px] text-ink whitespace-pre-line rounded-[12px] bg-surface-muted border border-border p-3.5">{entrega.texto}</p>}
          <ArchivoEntregado e={entrega} />
        </div>
      ) : (
        <div className="space-y-4">
          {tareaVencida(tarea) && (
            <p className="text-[12.5px] text-warning bg-warning-tint rounded-[10px] px-3 py-2">La fecha límite ya pasó: tu entrega quedará marcada como tardía.</p>
          )}
          {tarea.entregaTexto && (
            <div>
              <label htmlFor="texto-entrega" className="block text-[13px] font-medium text-ink mb-1.5">
                Tu respuesta
              </label>
              <Textarea id="texto-entrega" rows={6} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={20000} placeholder="Escribe aquí tu respuesta…" />
            </div>
          )}
          {tarea.entregaArchivo && (
            <div>
              <p className="block text-[13px] font-medium text-ink mb-1.5">Archivo</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) void subir(f)
                }}
              />
              {archivo ? (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] border border-border-input bg-white">
                  <Paperclip className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.8} />
                  <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-ink">{archivo.nombre}</span>
                  <span className="text-[12px] text-ink-faint">{formatBytes(archivo.tamano)}</span>
                  <IconButton label="Quitar archivo" onClick={() => setArchivo(null)}>
                    <X className="w-4 h-4" strokeWidth={1.8} />
                  </IconButton>
                </div>
              ) : subiendo !== null ? (
                <div className="px-3.5 py-3 rounded-[12px] border border-border-input bg-white">
                  <div className="flex justify-between text-[12.5px] text-ink-muted mb-1.5">
                    <span>Subiendo archivo…</span>
                    <span className="font-mono tabular-nums">{subiendo}%</span>
                  </div>
                  <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
                    <div className="progress-fill h-full w-full bg-primary rounded-full" style={{ transform: `scaleX(${subiendo / 100})` }} />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-1.5 py-6 rounded-[12px] border border-dashed border-primary/40 bg-primary-tint/40 text-primary hover:bg-primary-tint transition-colors duration-150"
                >
                  <FileUp className="w-5 h-5" strokeWidth={1.8} />
                  <span className="text-[13px] font-semibold">Seleccionar archivo</span>
                  <span className="text-[11.5px] text-ink-muted">PDF, Word, PowerPoint, Excel, imagen, MP4 o ZIP · hasta {formatBytes(MAX_ENTREGA_BYTES)}</span>
                </button>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button loading={enviando} disabled={subiendo !== null} icon={<Send className="w-4 h-4" strokeWidth={1.8} />} onClick={() => void enviar()}>
              {entrega ? 'Enviar de nuevo' : 'Entregar tarea'}
            </Button>
            {entrega && (
              <Button variant="ghost" onClick={() => void cargar()}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Entregas del equipo (admin) ────────────────────────────────────────────

function CalificarEntrega({ e, tarea, courseId, onGuardada }: { e: Entrega; tarea: Tarea; courseId: string; onGuardada: (e: Entrega) => void }) {
  const [nota, setNota] = useState(e.calificacion !== undefined && e.calificacion !== null ? String(e.calificacion) : '')
  const [comentario, setComentario] = useState(e.comentario ?? '')
  const [guardando, setGuardando] = useState(false)
  const [abierta, setAbierta] = useState(false)
  const { nombre, email } = persona(e)
  const calificada = e.calificacion !== undefined && e.calificacion !== null

  async function guardar(quitar = false) {
    const valor = quitar || nota.trim() === '' ? null : Number(nota)
    if (valor !== null && (Number.isNaN(valor) || valor < 0 || valor > tarea.puntajeMaximo)) {
      toast.error(`La nota debe estar entre 0 y ${tarea.puntajeMaximo}`)
      return
    }
    setGuardando(true)
    try {
      const res = await fetch(`/api/estudio/cursos/${courseId}/tareas/${tarea._id}/entregas/${e._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calificacion: valor, comentario }),
      })
      const json = (await res.json()) as { data?: Entrega; error?: string }
      if (!res.ok || !json.data) throw new Error(json.error ?? 'No se pudo guardar la nota')
      toast.success(valor === null ? 'Nota quitada: la persona puede volver a entregar' : 'Nota guardada')
      if (valor === null) setNota('')
      onGuardada(json.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la nota')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={nombre} />
        <div className="flex-1 min-w-[160px]">
          <p className="text-[13.5px] font-semibold text-ink">{nombre}</p>
          <p className="text-[12px] text-ink-muted flex flex-wrap items-center gap-x-2">
            {email && <span>{email}</span>}
            <span>· {formatFecha(e.entregadaEn)}</span>
            {esTardia(e, tarea) && <Badge tone="warning">Tardía</Badge>}
          </p>
        </div>
        {calificada ? (
          <Badge tone="success">
            {e.calificacion}/{tarea.puntajeMaximo}
          </Badge>
        ) : (
          <Badge tone="warning">Por calificar</Badge>
        )}
        <Button variant="secondary" size="sm" onClick={() => setAbierta((v) => !v)}>
          {abierta ? 'Cerrar' : calificada ? 'Ver / editar' : 'Revisar'}
        </Button>
      </div>

      {abierta && (
        <div className="lesson-fade mt-4 space-y-3 sm:pl-12">
          {e.texto && <p className="text-[13.5px] text-ink whitespace-pre-line rounded-[12px] bg-surface-muted border border-border p-3.5">{e.texto}</p>}
          <ArchivoEntregado e={e} />
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 pt-1">
            <div>
              <label htmlFor={`nota-${e._id}`} className="block text-[12.5px] font-medium text-ink mb-1">
                Nota (de {tarea.puntajeMaximo})
              </label>
              <Input id={`nota-${e._id}`} type="number" min={0} max={tarea.puntajeMaximo} step="any" value={nota} onChange={(ev) => setNota(ev.target.value)} />
            </div>
            <div>
              <label htmlFor={`com-${e._id}`} className="block text-[12.5px] font-medium text-ink mb-1">
                Comentario
              </label>
              <Textarea id={`com-${e._id}`} rows={2} maxLength={5000} value={comentario} onChange={(ev) => setComentario(ev.target.value)} placeholder="Retroalimentación para la persona…" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={guardando} onClick={() => void guardar()}>
              Guardar nota
            </Button>
            {calificada && (
              <Button size="sm" variant="ghost" disabled={guardando} onClick={() => void guardar(true)}>
                Quitar nota y reabrir
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

function EntregasEquipo({ tarea, courseId, onCambio }: { tarea: Tarea; courseId: string; onCambio: () => void }) {
  const [datos, setDatos] = useState<{ entregas: Entrega[]; pendientes: { _id: string; nombre?: string; email?: string }[] } | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/estudio/cursos/${courseId}/tareas/${tarea._id}/entregas`)
      const json = (await res.json().catch(() => ({}))) as { data?: typeof datos }
      setDatos(json.data ?? { entregas: [], pendientes: [] })
    })()
  }, [courseId, tarea._id])

  if (!datos) return <Card className="h-[200px] animate-pulse" />

  const sinCalificar = datos.entregas.filter((e) => e.calificacion === undefined || e.calificacion === null).length

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-border bg-surface-muted">
          <Eyebrow>Entregas · {datos.entregas.length}</Eyebrow>
          {sinCalificar > 0 && <Badge tone="warning">{sinCalificar} por calificar</Badge>}
        </div>
        {datos.entregas.length === 0 ? (
          <EmptyState icon={FileUp} className="py-10" title="Nadie ha entregado todavía" description="Cuando los coordinadores entreguen, aparecerán aquí para calificar." />
        ) : (
          <ul className="divide-y divide-[#F1F2F5]">
            {datos.entregas.map((e) => (
              <CalificarEntrega
                key={e._id}
                e={e}
                tarea={tarea}
                courseId={courseId}
                onGuardada={(nueva) => {
                  setDatos((prev) => prev && { ...prev, entregas: prev.entregas.map((x) => (x._id === nueva._id ? nueva : x)) })
                  onCambio()
                }}
              />
            ))}
          </ul>
        )}
      </Card>

      {datos.pendientes.length > 0 && (
        <Card className="p-5">
          <Eyebrow className="mb-3">Sin entregar · {datos.pendientes.length}</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {datos.pendientes.map((p) => (
              <span key={p._id} title={p.email} className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-canvas border border-border text-[12.5px] text-ink">
                <Avatar name={p.nombre ?? p.email ?? '?'} size="sm" />
                {p.nombre ?? p.email}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Página ─────────────────────────────────────────────────────────────────

export default function TareaPage() {
  const { tareaId } = useParams<{ tareaId: string }>()
  const router = useRouter()
  const confirm = useConfirm()
  const { course, esAdmin, userId, refetch } = useCurso()
  const [editando, setEditando] = useState(false)
  const lista = `/admin/estudio/${course._id}/tareas`

  const tarea = course.tareas.find((t) => t._id === tareaId)
  if (!tarea) {
    return (
      <div>
        <BackLink href={lista}>Volver a tareas</BackLink>
        <Card className="py-14 text-center text-[13.5px] text-ink-muted">Esta tarea no existe o todavía no está publicada.</Card>
      </div>
    )
  }

  const estado = estadoTarea(tarea, esAdmin)

  async function eliminar() {
    if (!tarea) return
    const ok = await confirm({
      title: 'Eliminar tarea',
      description: (
        <>
          Se eliminará <span className="font-medium text-ink">{tarea.titulo}</span> con todas sus entregas y notas. Esta acción no se puede deshacer.
        </>
      ),
      confirmLabel: 'Eliminar tarea',
    })
    if (!ok) return
    const res = await fetch(`/api/estudio/cursos/${course._id}/tareas/${tarea._id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('No se pudo eliminar la tarea')
      return
    }
    toast.success('Tarea eliminada')
    await refetch()
    router.push(lista)
  }

  return (
    <div className="space-y-4">
      <BackLink href={lista}>Volver a tareas</BackLink>

      <Card className="p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Eyebrow>Tarea</Eyebrow>
              <Badge tone={estado.tone}>{estado.label}</Badge>
            </div>
            <h3 className="text-[21px] font-extrabold text-ink leading-tight tracking-[-0.01em]">{tarea.titulo}</h3>
          </div>
          {esAdmin && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" icon={<Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />} onClick={() => setEditando(true)}>
                Editar
              </Button>
              <IconButton label="Eliminar tarea" tone="danger" onClick={() => void eliminar()}>
                <Trash2 className="w-4 h-4" strokeWidth={1.8} />
              </IconButton>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className={cn('rounded-[12px] border p-3', tareaVencida(tarea) ? 'border-danger/20 bg-danger-tint' : 'border-border bg-surface-muted')}>
            <dt className="text-[11px] font-bold text-ink-faint uppercase tracking-[0.08em] mb-0.5">Fecha límite</dt>
            <dd className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <CalendarClock className="w-4 h-4 text-primary" strokeWidth={1.8} />
              {tarea.fechaLimite ? formatFechaLimite(tarea.fechaLimite) : 'Sin fecha'}
            </dd>
          </div>
          <div className="rounded-[12px] border border-border bg-surface-muted p-3">
            <dt className="text-[11px] font-bold text-ink-faint uppercase tracking-[0.08em] mb-0.5">Puntaje</dt>
            <dd className="text-[13px] font-semibold text-ink">{tarea.puntajeMaximo} puntos</dd>
          </div>
          <div className="rounded-[12px] border border-border bg-surface-muted p-3">
            <dt className="text-[11px] font-bold text-ink-faint uppercase tracking-[0.08em] mb-0.5">Se entrega</dt>
            <dd className="text-[13px] font-semibold text-ink">
              {[tarea.entregaArchivo && 'Archivo', tarea.entregaTexto && 'Texto'].filter(Boolean).join(' o ')}
            </dd>
          </div>
        </dl>

        {tarea.instrucciones ? <Teoria html={tarea.instrucciones} /> : <p className="text-[13.5px] text-ink-muted">Esta tarea no tiene instrucciones adicionales.</p>}
      </Card>

      {esAdmin ? (
        <EntregasEquipo tarea={tarea} courseId={course._id} onCambio={() => void refetch()} />
      ) : (
        <MiEntrega tarea={tarea} courseId={course._id} userId={userId} onCambio={() => void refetch()} />
      )}

      {esAdmin && (
        <TareaModal
          key={editando ? `editar-${tarea._id}` : 'cerrado'}
          open={editando}
          onClose={() => setEditando(false)}
          courseId={course._id}
          tarea={tarea}
          onSaved={() => {
            setEditando(false)
            void refetch()
          }}
        />
      )}
    </div>
  )
}

