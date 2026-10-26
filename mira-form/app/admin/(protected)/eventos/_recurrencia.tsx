'use client'

import { useEffect, useMemo, useState } from 'react'
import { Repeat, RotateCcw, X } from 'lucide-react'
import { Input, Select } from '@/components/admin/ui'
import { cn } from '@/lib/cn'
import {
  DIAS_CORTOS,
  DIAS_LARGOS,
  MAX_FECHAS,
  describirRecurrencia,
  generarFechas,
  type Frecuencia,
  type ReglaRecurrencia,
} from '@/lib/recurrencia'

type Modo = 'no' | 'diaria' | 'habiles' | 'semanal' | 'mensual' | 'personalizado'
type FrecuenciaPersonalizada = Exclude<Frecuencia, 'habiles'>

const CHIPS_VISIBLES = 12

function formatoChip(d: Date): string {
  const dia = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
  const hora = d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  return `${dia} · ${hora}`
}

// Devuelve por onChange las fechas generadas (sin las quitadas), o null si el evento no se repite.
export function RecurrenciaEditor({ inicio, onChange }: { inicio: string; onChange: (fechas: Date[] | null) => void }) {
  const inicioDate = useMemo(() => (inicio ? new Date(inicio) : null), [inicio])
  const valido = inicioDate !== null && !Number.isNaN(inicioDate.getTime())

  const [modo, setModo] = useState<Modo>('no')
  const [frecuencia, setFrecuencia] = useState<FrecuenciaPersonalizada>('semanal')
  const [intervalo, setIntervalo] = useState(1)
  const [diasSemana, setDiasSemana] = useState<number[]>([])
  const [finTipo, setFinTipo] = useState<'veces' | 'hasta'>('veces')
  const [finVeces, setFinVeces] = useState(8)
  const [finHasta, setFinHasta] = useState('')
  const [excluidas, setExcluidas] = useState<Set<number>>(new Set())
  const [verTodas, setVerTodas] = useState(false)

  const diaInicio = valido ? inicioDate.getDay() : 1

  useEffect(() => {
    setExcluidas(new Set())
  }, [inicio])

  const regla: ReglaRecurrencia | null = useMemo(() => {
    if (modo === 'no') return null
    const fin = finTipo === 'veces' ? { tipo: 'veces' as const, n: finVeces } : { tipo: 'hasta' as const, fecha: finHasta }
    if (modo === 'personalizado') {
      return { frecuencia, intervalo, diasSemana: diasSemana.length ? diasSemana : [diaInicio], fin }
    }
    return { frecuencia: modo, intervalo: 1, diasSemana: [diaInicio], fin }
  }, [modo, frecuencia, intervalo, diasSemana, diaInicio, finTipo, finVeces, finHasta])

  const generadas = useMemo(() => (regla && valido ? generarFechas(inicioDate, regla) : []), [regla, valido, inicioDate])
  const visibles = useMemo(() => generadas.filter((d) => !excluidas.has(d.getTime())), [generadas, excluidas])

  useEffect(() => {
    onChange(regla ? visibles : null)
  }, [regla, visibles, onChange])

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo)
    setVerTodas(false)
    if (nuevo === 'personalizado' && diasSemana.length === 0) setDiasSemana([diaInicio])
  }

  function toggleDia(dia: number) {
    setDiasSemana((prev) => {
      const next = prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
      return next.length ? next : prev
    })
  }

  function quitar(d: Date) {
    setExcluidas((prev) => new Set(prev).add(d.getTime()))
  }

  const sinFinValido = finTipo === 'hasta' && !finHasta
  const enTope = generadas.length >= MAX_FECHAS
  const chips = verTodas ? visibles : visibles.slice(0, CHIPS_VISIBLES)

  return (
    <div className="mt-3">
      <label htmlFor="se-repite" className="flex items-center gap-1.5 text-[13px] font-medium text-ink mb-1.5">
        <Repeat className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
        Se repite
      </label>
      <Select id="se-repite" value={modo} onChange={(e) => cambiarModo(e.target.value as Modo)} className="sm:max-w-[340px]">
        <option value="no">No se repite</option>
        <option value="diaria">Cada día</option>
        <option value="habiles">Todos los días hábiles (lunes a viernes)</option>
        <option value="semanal">Cada semana el {DIAS_LARGOS[diaInicio]}</option>
        <option value="mensual">Cada mes el día {valido ? inicioDate.getDate() : '—'}</option>
        <option value="personalizado">Personalizado…</option>
      </Select>

      {modo !== 'no' && (
        <div className="mt-3 rounded-[14px] border border-border bg-surface-muted p-4 space-y-4">
          {!valido ? (
            <p className="text-[13px] text-ink-muted">Elige primero la fecha y hora de la primera reunión.</p>
          ) : (
            <>
              {modo === 'personalizado' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink">
                    <span>Repetir cada</span>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={intervalo}
                      onChange={(e) => setIntervalo(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                      aria-label="Intervalo"
                      className="w-20"
                    />
                    <Select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as FrecuenciaPersonalizada)} aria-label="Unidad" className="w-36">
                      <option value="diaria">{intervalo === 1 ? 'día' : 'días'}</option>
                      <option value="semanal">{intervalo === 1 ? 'semana' : 'semanas'}</option>
                      <option value="mensual">{intervalo === 1 ? 'mes' : 'meses'}</option>
                    </Select>
                  </div>
                  {frecuencia === 'semanal' && (
                    <div>
                      <p className="text-[12.5px] text-ink-muted mb-2">Se repite el</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 0].map((dia) => {
                          const activo = diasSemana.includes(dia)
                          return (
                            <button
                              key={dia}
                              type="button"
                              aria-pressed={activo}
                              aria-label={DIAS_LARGOS[dia]}
                              title={DIAS_LARGOS[dia]}
                              onClick={() => toggleDia(dia)}
                              className={cn(
                                'press w-9 h-9 rounded-full text-[12.5px] font-bold border focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
                                activo ? 'bg-primary border-primary text-white' : 'bg-white border-border-input text-ink-muted hover:border-primary/50'
                              )}
                            >
                              {DIAS_CORTOS[dia]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <fieldset>
                <legend className="text-[12.5px] text-ink-muted mb-2">Termina</legend>
                <div className="space-y-2">
                  <label className="flex flex-wrap items-center gap-2 text-[13px] text-ink cursor-pointer">
                    <input type="radio" name="fin" checked={finTipo === 'veces'} onChange={() => setFinTipo('veces')} className="accent-primary w-4 h-4" />
                    Después de
                    <Input
                      type="number"
                      min={1}
                      max={MAX_FECHAS}
                      value={finVeces}
                      onFocus={() => setFinTipo('veces')}
                      onChange={(e) => setFinVeces(Math.max(1, Math.min(MAX_FECHAS, Number(e.target.value) || 1)))}
                      aria-label="Número de veces"
                      className="w-20"
                    />
                    veces
                  </label>
                  <label className="flex flex-wrap items-center gap-2 text-[13px] text-ink cursor-pointer">
                    <input type="radio" name="fin" checked={finTipo === 'hasta'} onChange={() => setFinTipo('hasta')} className="accent-primary w-4 h-4" />
                    El
                    <Input
                      type="date"
                      value={finHasta}
                      min={inicio.slice(0, 10)}
                      onFocus={() => setFinTipo('hasta')}
                      onChange={(e) => setFinHasta(e.target.value)}
                      aria-label="Fecha final"
                      className="w-44"
                    />
                  </label>
                </div>
              </fieldset>

              {regla && !sinFinValido && (
                <div className="pt-3 border-t border-border">
                  <p className="text-[13px] font-semibold text-ink">
                    {describirRecurrencia(inicioDate, regla)}
                    <span className="font-normal text-ink-muted">
                      {' '}
                      · {visibles.length} fecha{visibles.length === 1 ? '' : 's'}
                    </span>
                  </p>
                  {enTope && <p className="text-[12px] text-warning mt-1">Se generan como máximo {MAX_FECHAS} fechas por evento.</p>}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {chips.map((d) => (
                      <span key={d.getTime()} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-white border border-border text-[12px] text-ink tabular-nums">
                        {formatoChip(d)}
                        <button
                          type="button"
                          onClick={() => quitar(d)}
                          aria-label={`Quitar ${formatoChip(d)}`}
                          className="p-0.5 rounded-full text-ink-faint hover:text-danger hover:bg-danger-tint"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                    {visibles.length > CHIPS_VISIBLES && (
                      <button type="button" onClick={() => setVerTodas((v) => !v)} className="h-7 px-2.5 text-[12px] font-semibold text-primary hover:underline">
                        {verTodas ? 'Ver menos' : `Ver todas (${visibles.length})`}
                      </button>
                    )}
                  </div>
                  {excluidas.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setExcluidas(new Set())}
                      className="inline-flex items-center gap-1 mt-2 text-[12px] font-medium text-ink-muted hover:text-primary"
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
                      Restaurar {excluidas.size} fecha{excluidas.size === 1 ? '' : 's'} quitada{excluidas.size === 1 ? '' : 's'}
                    </button>
                  )}
                </div>
              )}
              {sinFinValido && <p className="text-[12.5px] text-ink-muted">Elige hasta qué fecha se repite.</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
