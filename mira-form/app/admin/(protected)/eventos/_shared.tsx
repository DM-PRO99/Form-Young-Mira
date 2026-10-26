import { Badge, type BadgeTone } from '@/components/admin/ui'

export type EventEstado = 'borrador' | 'publicado' | 'cerrado'

const ESTADO: Record<EventEstado, { tone: BadgeTone; label: string }> = {
  publicado: { tone: 'success', label: 'Publicado' },
  borrador: { tone: 'neutral', label: 'Borrador' },
  cerrado: { tone: 'danger', label: 'Cerrado' },
}

export function EventEstadoBadge({ estado }: { estado: EventEstado }) {
  const s = ESTADO[estado]
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  )
}

export function formatEventDate(iso: string, withTime = false): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export function DateTile({ iso }: { iso: string }) {
  const d = new Date(iso)
  return (
    <div className="w-12 flex-shrink-0 rounded-[10px] border border-border bg-surface overflow-hidden text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white bg-primary py-0.5">
        {d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}
      </p>
      <p className="text-[18px] font-semibold text-ink leading-none py-1.5 tabular-nums">{d.getDate()}</p>
    </div>
  )
}
