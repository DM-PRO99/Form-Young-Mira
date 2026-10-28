'use client'

import dynamic from 'next/dynamic'
import { Reorder, useDragControls } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  GripVertical,
  Paperclip,
  PlayCircle,
  Plus,
  Presentation,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { Badge, IconButton, Input, Textarea } from '@/components/admin/ui'
import { formatBytes } from '@/lib/estudio'
import { cn } from '@/lib/cn'
import { LESSON_LABEL, tieneAdjunto, type Lesson, type LessonType, type Question, type Quiz } from '../../_types'

// El editor de teoría (TipTap) solo se carga en esta página y nunca en el servidor.
export const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-[220px] rounded-field border border-border-input bg-white animate-pulse" />,
})

export const LESSON_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  pdf: FileText,
  presentacion: Presentation,
}

export const lessonKey = (l: Lesson): string => l._id ?? l._key ?? l.archivoUrl ?? ''

const INLINE_INPUT_CLASS =
  'flex-1 min-w-0 px-2.5 py-1.5 text-[13.5px] text-ink bg-transparent border border-transparent rounded-[8px] outline-none hover:border-border-input focus:border-primary focus:bg-white transition-[border-color,background-color] duration-150'

// ─── Lección ────────────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: Lesson
  index: number
  total: number
  expanded: boolean
  busy: boolean
  onToggle: () => void
  onChange: (patch: Partial<Lesson>) => void
  onMove: (to: number) => void
  onRemove: () => void
  onAttach: () => void
  onUploadImage: (file: File) => Promise<string>
}

export function LessonRow({ lesson, index, total, expanded, busy, onToggle, onChange, onMove, onRemove, onAttach, onUploadImage }: LessonRowProps) {
  const controls = useDragControls()
  const adjunto = tieneAdjunto(lesson)
  const Icon = adjunto && !lesson.contenido ? LESSON_ICON[lesson.tipo!] : BookOpen
  return (
    <Reorder.Item
      as="div"
      value={lessonKey(lesson)}
      dragListener={false}
      dragControls={controls}
      className="relative bg-surface"
      whileDrag={{ boxShadow: '0 12px 28px -12px rgba(10,36,114,0.28)', zIndex: 10 }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          aria-label="Arrastrar para reordenar"
          onPointerDown={(e) => controls.start(e)}
          className="p-1 rounded-[6px] text-ink-faint hover:text-ink hover:bg-canvas cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <Icon className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.8} />
        <input value={lesson.titulo} onChange={(e) => onChange({ titulo: e.target.value })} aria-label="Título de la lección" className={INLINE_INPUT_CLASS} />
        <span className="hidden sm:flex items-center gap-1 flex-shrink-0">
          {lesson.contenido && <Badge tone="primary">Teoría</Badge>}
          {adjunto && <Badge tone="neutral">{LESSON_LABEL[lesson.tipo!]}</Badge>}
          {!lesson.contenido && !adjunto && <Badge tone="warning">Vacía</Badge>}
        </span>
        <IconButton label="Subir" onClick={() => onMove(index - 1)} disabled={index === 0} className="hidden sm:inline-flex">
          <ArrowUp className="w-4 h-4" strokeWidth={1.8} />
        </IconButton>
        <IconButton label="Bajar" onClick={() => onMove(index + 1)} disabled={index === total - 1} className="hidden sm:inline-flex">
          <ArrowDown className="w-4 h-4" strokeWidth={1.8} />
        </IconButton>
        <IconButton label="Eliminar lección" tone="danger" onClick={onRemove}>
          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
        </IconButton>
        <IconButton label={expanded ? 'Cerrar lección' : 'Editar lección'} aria-expanded={expanded} onClick={onToggle}>
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', expanded && 'rotate-180')} strokeWidth={1.8} />
        </IconButton>
      </div>

      {expanded && (
        <div className="lesson-fade px-3 sm:px-11 pb-4 space-y-4">
          <div>
            <p className="text-[12.5px] font-medium text-ink mb-1.5">Teoría</p>
            <RichTextEditor
              value={lesson.contenido ?? ''}
              onChange={(html) => onChange({ contenido: html })}
              onUploadImage={onUploadImage}
              placeholder="Escribe la teoría de esta lección: conceptos, ejemplos, imágenes…"
            />
          </div>
          <div>
            <p className="text-[12.5px] font-medium text-ink mb-1.5">Archivo de apoyo (opcional)</p>
            {adjunto ? (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-field border border-border bg-surface-muted">
                {(() => {
                  const AdjIcon = LESSON_ICON[lesson.tipo!]
                  return <AdjIcon className="w-5 h-5 text-primary flex-shrink-0" strokeWidth={1.8} />
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ink truncate">{lesson.archivoNombre}</p>
                  <p className="text-[12px] text-ink-muted">
                    {LESSON_LABEL[lesson.tipo!]} · {formatBytes(lesson.tamano ?? 0)}
                  </p>
                </div>
                <button type="button" disabled={busy} onClick={onAttach} className="press inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary disabled:opacity-50">
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.8} />
                  Reemplazar
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ tipo: undefined, archivoUrl: undefined, archivoNombre: undefined, tamano: undefined })}
                  className="press inline-flex items-center gap-1 text-[12.5px] font-semibold text-danger"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                  Quitar
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={onAttach}
                className="press w-full flex items-center justify-center gap-2 px-4 py-3 rounded-field border border-dashed border-border-input text-[12.5px] text-ink-muted hover:text-primary hover:border-primary/50 disabled:opacity-50"
              >
                <Paperclip className="w-4 h-4" strokeWidth={1.8} />
                Adjuntar un video, PDF o presentación debajo de la teoría
              </button>
            )}
          </div>
        </div>
      )}
    </Reorder.Item>
  )
}

// ─── Cuestionario ───────────────────────────────────────────────────────────

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

export function QuizEditor({ quiz, onChange }: { quiz: Quiz; onChange: (quiz: Quiz) => void }) {
  function patchPregunta(i: number, patch: Partial<Question>) {
    onChange({ ...quiz, preguntas: quiz.preguntas.map((p, j) => (j === i ? { ...p, ...patch } : p)) })
  }

  function agregarPregunta() {
    onChange({ ...quiz, preguntas: [...quiz.preguntas, { enunciado: '', opciones: ['', ''], correcta: 0 }] })
  }

  function quitarOpcion(i: number, o: number) {
    const p = quiz.preguntas[i]
    const opciones = p.opciones.filter((_, k) => k !== o)
    const correcta = p.correcta === undefined ? 0 : p.correcta === o ? 0 : p.correcta > o ? p.correcta - 1 : p.correcta
    patchPregunta(i, { opciones, correcta })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink">
        <span>Nota mínima para aprobar</span>
        <Input
          type="number"
          min={0}
          max={100}
          value={quiz.notaMinima}
          onChange={(e) => onChange({ ...quiz, notaMinima: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
          aria-label="Nota mínima"
          className="w-20"
        />
        <span className="text-ink-muted">/ 100</span>
      </div>

      {quiz.preguntas.map((p, i) => (
        <div key={p._id ?? i} className="rounded-[14px] border border-border bg-white p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="mt-2 text-[12px] font-bold text-ink-faint tabular-nums w-6 flex-shrink-0">{i + 1}.</span>
            <Textarea
              rows={2}
              value={p.enunciado}
              onChange={(e) => patchPregunta(i, { enunciado: e.target.value })}
              placeholder="Escribe la pregunta…"
              aria-label={`Pregunta ${i + 1}`}
              className="flex-1"
            />
            <IconButton label={`Eliminar pregunta ${i + 1}`} tone="danger" onClick={() => onChange({ ...quiz, preguntas: quiz.preguntas.filter((_, j) => j !== i) })}>
              <Trash2 className="w-4 h-4" strokeWidth={1.8} />
            </IconButton>
          </div>
          <div className="pl-8 space-y-2">
            {p.opciones.map((op, o) => {
              const correcta = p.correcta === o
              return (
                <div key={o} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => patchPregunta(i, { correcta: o })}
                    aria-pressed={correcta}
                    title={correcta ? 'Respuesta correcta' : 'Marcar como correcta'}
                    className={cn(
                      'press w-8 h-8 flex-shrink-0 rounded-full border text-[12px] font-bold flex items-center justify-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
                      correcta ? 'bg-success border-success text-white' : 'bg-white border-border-input text-ink-muted hover:border-success/60'
                    )}
                  >
                    {correcta ? <Check className="w-4 h-4" strokeWidth={2.4} /> : LETRAS[o]}
                  </button>
                  <Input
                    value={op}
                    onChange={(e) => patchPregunta(i, { opciones: p.opciones.map((x, k) => (k === o ? e.target.value : x)) })}
                    placeholder={`Opción ${LETRAS[o]}`}
                    aria-label={`Opción ${LETRAS[o]} de la pregunta ${i + 1}`}
                    className="flex-1"
                  />
                  {p.opciones.length > 2 && (
                    <IconButton label={`Quitar opción ${LETRAS[o]}`} onClick={() => quitarOpcion(i, o)}>
                      <X className="w-4 h-4" strokeWidth={1.8} />
                    </IconButton>
                  )}
                </div>
              )
            })}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {p.opciones.length < 6 ? (
                <button type="button" onClick={() => patchPregunta(i, { opciones: [...p.opciones, ''] })} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary">
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  Agregar opción
                </button>
              ) : (
                <span />
              )}
              <span className="text-[11.5px] text-ink-faint">Toca la letra para marcar la respuesta correcta</span>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={agregarPregunta}
        className="press w-full flex items-center justify-center gap-2 py-3 rounded-[14px] border border-dashed border-primary/40 bg-primary-tint/40 text-[13px] font-semibold text-primary hover:bg-primary-tint"
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        Agregar pregunta
      </button>
    </div>
  )
}

export function validarCuestionario(quiz: Quiz | null | undefined, tema: string): string | null {
  if (!quiz || quiz.preguntas.length === 0) return null
  for (const [i, p] of quiz.preguntas.entries()) {
    if (!p.enunciado.trim()) return `En «${tema}», la pregunta ${i + 1} no tiene enunciado`
    if (p.opciones.some((o) => !o.trim())) return `En «${tema}», la pregunta ${i + 1} tiene opciones vacías`
    if (p.correcta === undefined || p.correcta >= p.opciones.length) return `En «${tema}», marca la respuesta correcta de la pregunta ${i + 1}`
  }
  return null
}

// ─── Interruptor ────────────────────────────────────────────────────────────

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
        checked ? 'bg-primary' : 'bg-border-input'
      )}
    >
      <span
        className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200', checked && 'translate-x-5')}
      />
    </button>
  )
}
