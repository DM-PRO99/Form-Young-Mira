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

export interface ResumenFechas {
  proxima: string
  futuras: number
  total: number
  finalizado: boolean
}

// Para eventos que se repiten: la fecha a mostrar es la próxima; si todas pasaron, la última.
export function resumenFechas(fechas: string[], now = Date.now()): ResumenFechas {
  const ordenadas = [...fechas].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  const futuras = ordenadas.filter((f) => new Date(f).getTime() >= now)
  return {
    proxima: futuras[0] ?? ordenadas[ordenadas.length - 1],
    futuras: futuras.length,
    total: ordenadas.length,
    finalizado: ordenadas.length > 0 && futuras.length === 0,
  }
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
