'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Download,
  FileText,
  Lock,
  PlayCircle,
  Presentation,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Card, Eyebrow } from '@/components/admin/ui'
import { formatBytes } from '@/lib/estudio'
import { cn } from '@/lib/cn'
import {
  LESSON_LABEL,
  tieneAdjunto,
  type CourseDetail,
  type EstadoModulo,
  type Lesson,
  type LessonType,
  type Module,
} from '../../_types'
import { Teoria, useCurso } from '../_curso'

const ADJUNTO_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  pdf: FileText,
  presentacion: Presentation,
}

type Paso = { tipo: 'intro'; mi: number } | { tipo: 'leccion'; mi: number; leccionId: string } | { tipo: 'quiz'; mi: number }

const pasoKey = (p: Paso) => (p.tipo === 'leccion' ? `l:${p.leccionId}` : `${p.tipo}:${p.mi}`)

function construirPasos(modulos: Module[]): Paso[] {
  const pasos: Paso[] = []
  modulos.forEach((m, mi) => {
    if (m.descripcion) pasos.push({ tipo: 'intro', mi })
    m.lecciones.forEach((l) => l._id && pasos.push({ tipo: 'leccion', mi, leccionId: l._id }))
    if ((m.cuestionario?.totalPreguntas ?? m.cuestionario?.preguntas.length ?? 0) > 0) pasos.push({ tipo: 'quiz', mi })
  })
  return pasos
}

function Adjunto({ lesson }: { lesson: Lesson }) {
  if (!tieneAdjunto(lesson)) return null
  if (lesson.tipo === 'video') {
    return <video key={lesson.archivoUrl} src={lesson.archivoUrl} controls className="w-full aspect-video bg-black rounded-field" />
  }
  const src =
    lesson.tipo === 'pdf' ? lesson.archivoUrl : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.archivoUrl)}`
  return <iframe key={src} src={src} title={lesson.titulo} className="w-full h-[70vh] rounded-field border border-border bg-canvas" />
}

// ─── Cuestionario ───────────────────────────────────────────────────────────

interface ResultadoQuiz {
  puntaje: number
  aprobado: boolean
  notaMinima: number
  mejorPuntaje: number
  aciertos: boolean[]
  estadoModulos: EstadoModulo[]
}

function CuestionarioView({
  courseId,
  modulo,
  estado,
  onResultado,
  onContinuar,
  hayMas,
}: {
  courseId: string
  modulo: Module
  estado: EstadoModulo
  onResultado: (r: ResultadoQuiz) => void
  onContinuar: () => void
  hayMas: boolean
}) {
  const preguntas = modulo.cuestionario?.preguntas ?? []
  const [respuestas, setRespuestas] = useState<(number | null)[]>(() => preguntas.map(() => null))
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoQuiz | null>(null)

  const completas = respuestas.every((r) => r !== null)

  async function enviar() {
    if (!completas) {
      toast.error('Responde todas las preguntas antes de enviar.')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch(`/api/estudio/cursos/${courseId}/cuestionario/${modulo._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuestas }),
      })
      const json = (await res.json()) as { data?: ResultadoQuiz; error?: string }
      if (!res.ok || !json.data) throw new Error(json.error ?? 'No se pudo enviar el cuestionario')
      setResultado(json.data)
      onResultado(json.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el cuestionario')
    } finally {
      setEnviando(false)
    }
  }

  function reintentar() {
    setResultado(null)
    setRespuestas(preguntas.map(() => null))
  }

  return (
    <div>
      <Eyebrow className="mb-1">Cuestionario del tema</Eyebrow>
      <h3 className="text-[19px] font-extrabold text-ink leading-tight">{modulo.titulo}</h3>
      <p className="text-[13px] text-ink-muted mt-1">
        {preguntas.length} pregunta{preguntas.length === 1 ? '' : 's'} · necesitas {modulo.cuestionario?.notaMinima ?? 70}% para aprobar
        {estado.mejorPuntaje !== null && ` · tu mejor resultado: ${estado.mejorPuntaje}%`}
      </p>

      {resultado && (
        <div
          className={cn(
            'celebrate-in mt-5 rounded-card border p-5 flex flex-wrap items-center gap-4',
            resultado.aprobado ? 'bg-success-tint border-success/20' : 'bg-warning-tint border-warning/20'
          )}
        >
          <div className={cn('w-14 h-14 rounded-full flex items-center justify-center text-white text-[17px] font-extrabold', resultado.aprobado ? 'bg-success' : 'bg-warning')}>
            {resultado.puntaje}
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-[15px] font-bold text-ink">{resultado.aprobado ? '¡Aprobaste el cuestionario!' : 'Aún no alcanzas la nota mínima'}</p>
            <p className="text-[13px] text-ink-muted">
              Acertaste {resultado.aciertos.filter(Boolean).length} de {resultado.aciertos.length}. {resultado.aprobado ? 'Ya puedes seguir.' : `Necesitas ${resultado.notaMinima}%. Repasa las lecciones e inténtalo de nuevo.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<RotateCcw className="w-4 h-4" strokeWidth={1.8} />} onClick={reintentar}>
              Intentar de nuevo
            </Button>
            {resultado.aprobado && hayMas && (
              <Button onClick={onContinuar}>
                Continuar
                <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {preguntas.map((p, i) => {
          const acierto = resultado?.aciertos[i]
          return (
            <fieldset key={p._id ?? i} className="rounded-card border border-border bg-white p-4 md:p-5">
              <legend className="sr-only">Pregunta {i + 1}</legend>
              <div className="flex items-start gap-2.5 mb-3">
                <span className="text-[12px] font-bold text-ink-faint tabular-nums mt-0.5">{i + 1}.</span>
                <p className="flex-1 text-[14px] font-semibold text-ink whitespace-pre-line">{p.enunciado}</p>
                {resultado &&
                  (acierto ? (
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" strokeWidth={2} aria-label="Correcta" />
                  ) : (
                    <XCircle className="w-5 h-5 text-danger flex-shrink-0" strokeWidth={2} aria-label="Incorrecta" />
                  ))}
              </div>
              <div className="space-y-2 pl-6">
                {p.opciones.map((op, o) => {
                  const elegida = respuestas[i] === o
                  return (
                    <label
                      key={o}
                      className={cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] border cursor-pointer transition-colors duration-150',
                        elegida ? 'border-primary bg-primary-tint' : 'border-border-input hover:border-primary/40',
                        resultado && 'cursor-default'
                      )}
                    >
                      <input
                        type="radio"
                        name={`pregunta-${i}`}
                        checked={elegida}
                        disabled={!!resultado}
                        onChange={() => setRespuestas((prev) => prev.map((r, k) => (k === i ? o : r)))}
                        className="accent-primary w-4 h-4"
                      />
                      <span className="text-[13.5px] text-ink">{op}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )
        })}
      </div>

      {!resultado && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button loading={enviando} disabled={!completas} onClick={() => void enviar()} icon={<ClipboardCheck className="w-4 h-4" strokeWidth={1.8} />}>
            Enviar respuestas
          </Button>
          {!completas && <span className="text-[12.5px] text-ink-muted">Responde todas las preguntas para enviar.</span>}
        </div>
      )}
    </div>
  )
}

// ─── Página ─────────────────────────────────────────────────────────────────

// Primer paso pendiente de un tema desbloqueado; con ?paso=quiz:2 (desde Evaluaciones) se abre ese paso.
function pasoInicial(data: CourseDetail, pedido: string | null): string {
  const todos = construirPasos(data.modulos)
  if (pedido && todos.some((p) => pasoKey(p) === pedido)) return pedido
  const done = new Set(data.completadas)
  const pendiente = todos.find((p) => {
    const est = data.estadoModulos[p.mi]
    if (est?.bloqueado) return false
    if (p.tipo === 'leccion') return !done.has(p.leccionId)
    if (p.tipo === 'quiz') return !est?.aprobado
    return false
  })
  const inicio: Paso = { tipo: 'intro', mi: 0 }
  return pasoKey(pendiente ?? todos[0] ?? inicio)
}

export default function ModulosPage() {
  const { course, setCourse, refetch, role } = useCurso()
  const pedido = useSearchParams().get('paso')
  const [actual, setActual] = useState<string>(() => pasoInicial(course, pedido))
  const [saving, setSaving] = useState(false)

  const pasos = useMemo(() => construirPasos(course.modulos), [course])
  const completadas = useMemo(() => new Set(course.completadas ?? []), [course])
  const estados = course.estadoModulos ?? []

  const indiceActual = pasos.findIndex((p) => pasoKey(p) === actual)
  const paso = indiceActual >= 0 ? pasos[indiceActual] : null
  const modulo = paso ? course.modulos[paso.mi] : null
  const estadoModulo = paso ? estados[paso.mi] : null
  const leccion = paso?.tipo === 'leccion' ? modulo?.lecciones.find((l) => l._id === paso.leccionId) ?? null : null
  const siguiente = indiceActual >= 0 ? pasos.slice(indiceActual + 1).find((p) => !estados[p.mi]?.bloqueado) ?? null : null
  const siguienteBloqueado = indiceActual >= 0 && !siguiente && indiceActual < pasos.length - 1

  const cursoCompleto = course.modulos.length > 0 && estados.length > 0 && estados.every((e) => e.completo)
  const leccionVista = leccion?._id ? completadas.has(leccion._id) : false

  // Si un tema se acaba de desbloquear, su contenido todavía no llegó (la API lo oculta): se vuelve a pedir el curso.
  function aplicarEstado(nuevo: EstadoModulo[], completadasNuevas?: string[]) {
    const seDesbloqueo = nuevo.some((e, i) => estados[i]?.bloqueado && !e.bloqueado)
    setCourse((prev) => prev && { ...prev, estadoModulos: nuevo, completadas: completadasNuevas ?? prev.completadas })
    if (seDesbloqueo) void refetch()
  }

  async function setCompletada(lesson: Lesson, completada: boolean): Promise<boolean> {
    if (!lesson._id) return false
    setSaving(true)
    const res = await fetch('/api/estudio/progreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course._id, leccionId: lesson._id, completada }),
    })
    setSaving(false)
    const json = (await res.json().catch(() => ({}))) as { estadoModulos?: EstadoModulo[]; error?: string }
    if (!res.ok || !json.estadoModulos) {
      toast.error(json.error ?? 'No se pudo guardar tu progreso')
      return false
    }
    const lessonId = lesson._id
    const nuevas = completada ? Array.from(new Set([...course.completadas, lessonId])) : course.completadas.filter((c) => c !== lessonId)
    aplicarEstado(json.estadoModulos, nuevas)
    return true
  }

  async function marcarYContinuar() {
    if (!leccion) return
    if (!leccionVista && !(await setCompletada(leccion, true))) return
    if (siguiente) setActual(pasoKey(siguiente))
  }

  function irA(p: Paso) {
    if (estados[p.mi]?.bloqueado && role !== 'admin') return
    setActual(pasoKey(p))
  }

  return (
    <div>
      {pasos.length === 0 ? (
        <Card className="px-[22px] py-14 text-center">
          <p className="text-[15px] font-semibold text-ink mb-1">Este curso todavía no tiene contenido</p>
          <p className="text-[13px] text-ink-muted">{role === 'admin' ? 'Entra a «Editar» para agregar temas, lecciones y cuestionarios.' : 'Vuelve pronto.'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
          <aside className="order-2 lg:order-1 bg-surface rounded-card border border-border shadow-card p-3 lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
            {course.modulos.map((m, mi) => {
              const est = estados[mi]
              const bloqueado = !!est?.bloqueado && role !== 'admin'
              const pasosTema = pasos.filter((p) => p.mi === mi)
              return (
                <div key={m._id ?? mi} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between gap-2 px-2.5 pt-2 pb-1.5">
                    <p className="text-[11px] font-bold text-ink-faint uppercase tracking-[0.08em] truncate">
                      Tema {mi + 1} · {m.titulo}
                    </p>
                    {bloqueado ? (
                      <Lock className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" strokeWidth={2} />
                    ) : (
                      est && (
                        <span className={cn('text-[11px] font-mono tabular-nums flex-shrink-0', est.completo ? 'text-success' : 'text-ink-faint')}>
                          {est.leccionesVistas}/{est.totalLecciones}
                        </span>
                      )
                    )}
                  </div>
                  {bloqueado && <p className="px-2.5 pb-1.5 text-[11.5px] text-ink-faint">Completa el tema anterior para abrirlo.</p>}
                  {pasosTema.map((p) => {
                    const activo = pasoKey(p) === actual
                    let Icon = BookOpen
                    let titulo = 'Introducción'
                    let hecho = false
                    let extra: React.ReactNode = null
                    if (p.tipo === 'leccion') {
                      const l = m.lecciones.find((x) => x._id === p.leccionId)!
                      titulo = l.titulo
                      hecho = completadas.has(p.leccionId)
                      Icon = tieneAdjunto(l) && !l.contenido ? ADJUNTO_ICON[l.tipo!] : BookOpen
                    } else if (p.tipo === 'quiz') {
                      titulo = 'Cuestionario'
                      Icon = ClipboardCheck
                      hecho = !!est?.aprobado
                      if (est?.mejorPuntaje !== null && est?.mejorPuntaje !== undefined) {
                        extra = <Badge tone={est.aprobado ? 'success' : 'warning'}>{est.mejorPuntaje}%</Badge>
                      }
                    } else {
                      Icon = FileText
                    }
                    return (
                      <button
                        key={pasoKey(p)}
                        onClick={() => irA(p)}
                        disabled={bloqueado}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-left transition-colors duration-150 disabled:cursor-not-allowed',
                          activo ? 'bg-primary-tint' : bloqueado ? 'opacity-50' : 'hover:bg-canvas'
                        )}
                      >
                        {hecho ? (
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.8} />
                        ) : (
                          <Icon className={cn('w-4 h-4 flex-shrink-0', activo ? 'text-primary' : 'text-ink-faint')} strokeWidth={1.8} />
                        )}
                        <span className={cn('flex-1 min-w-0 text-[13px] truncate', activo ? 'text-primary font-semibold' : hecho ? 'text-ink-muted' : 'text-ink')}>{titulo}</span>
                        {extra}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </aside>

          <div className="order-1 lg:order-2 min-w-0">
            {cursoCompleto && (
              <div className="celebrate-in relative overflow-hidden bg-success-tint rounded-card border border-success/20 px-6 py-5 mb-5 flex flex-wrap items-center gap-4">
                <div className="relative flex-shrink-0">
                  <span className="celebrate-ring absolute inset-0 rounded-full bg-success/40" />
                  <div className="relative w-11 h-11 rounded-full bg-success flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" strokeWidth={1.8} />
                  </div>
                </div>
                <div className="flex-1 min-w-[180px]">
                  <p className="text-[15px] font-bold text-ink">¡Curso completado!</p>
                  <p className="text-[13px] text-ink-muted">Viste todas las lecciones y aprobaste los cuestionarios de «{course.titulo}».</p>
                </div>
                <Button variant="secondary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />} onClick={() => pasos[0] && setActual(pasoKey(pasos[0]))}>
                  Repasar desde el inicio
                </Button>
              </div>
            )}

            {paso && modulo && estadoModulo && (
              <Card className="p-5 md:p-7">
                <div key={actual ?? ''} className="lesson-fade">
                  {paso.tipo === 'intro' && (
                    <div>
                      <Eyebrow className="mb-1">Tema {paso.mi + 1}</Eyebrow>
                      <h3 className="text-[22px] font-extrabold text-ink leading-tight tracking-[-0.01em] mb-4">{modulo.titulo}</h3>
                      {modulo.descripcion && <Teoria html={modulo.descripcion} />}
                      {modulo.lecciones.length > 0 && (
                        <div className="mt-6 rounded-card border border-border bg-surface-muted p-4">
                          <p className="text-[13px] font-bold text-ink mb-2">En este tema</p>
                          <ol className="space-y-1.5 text-[13.5px] text-ink-muted list-decimal pl-5">
                            {modulo.lecciones.map((l) => (
                              <li key={l._id}>{l.titulo}</li>
                            ))}
                            {estadoModulo.tieneCuestionario && <li>Cuestionario final</li>}
                          </ol>
                        </div>
                      )}
                      {siguiente && (
                        <div className="mt-6">
                          <Button onClick={() => setActual(pasoKey(siguiente))}>
                            Empezar
                            <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {paso.tipo === 'leccion' && leccion && (
                    <div>
                      <Eyebrow className="mb-1">
                        Tema {paso.mi + 1} · Lección {modulo.lecciones.findIndex((l) => l._id === leccion._id) + 1} de {modulo.lecciones.length}
                      </Eyebrow>
                      <h3 className="text-[22px] font-extrabold text-ink leading-tight tracking-[-0.01em] mb-5">{leccion.titulo}</h3>

                      {leccion.contenido && <Teoria html={leccion.contenido} />}

                      {tieneAdjunto(leccion) && (
                        <div className={cn(leccion.contenido && 'mt-7 pt-6 border-t border-border')}>
                          {leccion.contenido && <p className="text-[13px] font-bold text-ink mb-3">Material de apoyo</p>}
                          <Adjunto lesson={leccion} />
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                            <p className="text-[12px] text-ink-muted">
                              {LESSON_LABEL[leccion.tipo]} · {leccion.archivoNombre} · {formatBytes(leccion.tamano)}
                            </p>
                            <a
                              href={`${leccion.archivoUrl}?download=1`}
                              className="press inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline"
                            >
                              <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
                              Descargar
                            </a>
                          </div>
                        </div>
                      )}

                      {!leccion.contenido && !tieneAdjunto(leccion) && <p className="text-[13.5px] text-ink-muted">Esta lección todavía no tiene contenido.</p>}

                      <div className="flex flex-wrap items-center justify-end gap-2.5 mt-7 pt-5 border-t border-border">
                        <button
                          disabled={saving}
                          onClick={() => void setCompletada(leccion, !leccionVista)}
                          className={cn(
                            'press flex items-center gap-1.5 h-10 px-4 text-[13px] font-medium rounded-field border disabled:opacity-60',
                            leccionVista ? 'bg-success-tint text-success border-transparent' : 'bg-white text-ink border-border-input hover:bg-canvas'
                          )}
                        >
                          {leccionVista ? <CheckCircle2 className="w-4 h-4" strokeWidth={1.8} /> : <Circle className="w-4 h-4" strokeWidth={1.8} />}
                          {leccionVista ? 'Vista' : 'Marcar como vista'}
                        </button>
                        {(siguiente || !leccionVista) && (
                          <Button loading={saving} onClick={() => void marcarYContinuar()}>
                            {siguiente ? (leccionVista ? 'Siguiente' : 'Marcar y continuar') : 'Marcar y terminar'}
                            <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
                          </Button>
                        )}
                      </div>
                      {siguienteBloqueado && leccionVista && (
                        <p className="text-[12.5px] text-ink-muted text-right mt-2">El siguiente tema se abre cuando completes este (lecciones y cuestionario).</p>
                      )}
                    </div>
                  )}

                  {paso.tipo === 'quiz' && (
                    <CuestionarioView
                      key={`${modulo._id}-${modulo.cuestionario?.preguntas.length}`}
                      courseId={course._id}
                      modulo={modulo}
                      estado={estadoModulo}
                      hayMas={!!siguiente || estados.some((e, i) => i > paso.mi && e.bloqueado)}
                      onResultado={(r) => aplicarEstado(r.estadoModulos)}
                      onContinuar={() => {
                        const proximo = pasos.slice(indiceActual + 1)[0]
                        if (proximo) setActual(pasoKey(proximo))
                      }}
                    />
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
