export type Frecuencia = 'diaria' | 'habiles' | 'semanal' | 'mensual'

export type FinRecurrencia = { tipo: 'veces'; n: number } | { tipo: 'hasta'; fecha: string }

export interface ReglaRecurrencia {
  frecuencia: Frecuencia
  intervalo: number
  // 0 = domingo … 6 = sábado (como Date.getDay()); solo aplica a la frecuencia semanal.
  diasSemana: number[]
  fin: FinRecurrencia
}

export const MAX_FECHAS = 100

const MAX_ITERACIONES = 5000

export const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DIAS_PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados']
export const DIAS_CORTOS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

function sumarDias(base: Date, dias: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + dias)
  return d
}

function finDelDia(fechaIso: string): number {
  const [y, m, d] = fechaIso.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
}

// Genera las fechas de una serie conservando la hora de `inicio`. Se cuenta la primera ocurrencia en "veces".
export function generarFechas(inicio: Date, regla: ReglaRecurrencia): Date[] {
  if (Number.isNaN(inicio.getTime())) return []
  const intervalo = Math.max(1, Math.floor(regla.intervalo) || 1)
  const limite = regla.fin.tipo === 'veces' ? Math.min(Math.max(1, Math.floor(regla.fin.n) || 1), MAX_FECHAS) : MAX_FECHAS
  const hasta = regla.fin.tipo === 'hasta' && regla.fin.fecha ? finDelDia(regla.fin.fecha) : Infinity
  const fechas: Date[] = []

  function agregar(d: Date): boolean {
    if (d.getTime() < inicio.getTime()) return true
    if (d.getTime() > hasta || fechas.length >= limite) return false
    fechas.push(d)
    return fechas.length < limite
  }

  if (regla.frecuencia === 'diaria') {
    for (let i = 0; i < MAX_ITERACIONES; i++) {
      if (!agregar(sumarDias(inicio, i * intervalo))) break
    }
  } else if (regla.frecuencia === 'habiles') {
    for (let i = 0; i < MAX_ITERACIONES; i++) {
      const d = sumarDias(inicio, i)
      const dia = d.getDay()
      if (dia === 0 || dia === 6) {
        if (d.getTime() > hasta) break
        continue
      }
      if (!agregar(d)) break
    }
  } else if (regla.frecuencia === 'semanal') {
    const dias = (regla.diasSemana.length > 0 ? [...new Set(regla.diasSemana)] : [inicio.getDay()]).sort((a, b) => a - b)
    const inicioSemana = sumarDias(inicio, -inicio.getDay())
    let seguir = true
    for (let semana = 0; seguir && semana < MAX_ITERACIONES; semana += intervalo) {
      for (const dia of dias) {
        if (!agregar(sumarDias(inicioSemana, semana * 7 + dia))) {
          seguir = false
          break
        }
      }
    }
  } else {
    const dia = inicio.getDate()
    for (let k = 0; k < MAX_ITERACIONES; k++) {
      const d = new Date(inicio.getFullYear(), inicio.getMonth() + k * intervalo, dia, inicio.getHours(), inicio.getMinutes())
      // Si el mes no tiene ese día (p. ej. 31 de abril) se omite ese mes, como en Google Calendar.
      if (d.getDate() !== dia) {
        if (d.getTime() > hasta) break
        continue
      }
      if (!agregar(d)) break
    }
  }

  return fechas
}

function unirConY(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

export function describirRecurrencia(inicio: Date, regla: ReglaRecurrencia): string {
  const n = Math.max(1, Math.floor(regla.intervalo) || 1)
  let base: string
  switch (regla.frecuencia) {
    case 'diaria':
      base = n === 1 ? 'Cada día' : `Cada ${n} días`
      break
    case 'habiles':
      base = 'Todos los días hábiles (lunes a viernes)'
      break
    case 'semanal': {
      const dias = (regla.diasSemana.length > 0 ? [...new Set(regla.diasSemana)] : [inicio.getDay()]).sort((a, b) => a - b)
      base = `${n === 1 ? 'Cada semana' : `Cada ${n} semanas`} los ${unirConY(dias.map((d) => DIAS_PLURAL[d]))}`
      break
    }
    case 'mensual':
      base = `${n === 1 ? 'Cada mes' : `Cada ${n} meses`} el día ${inicio.getDate()}`
      break
  }
  if (regla.fin.tipo === 'veces') return `${base}, ${regla.fin.n} ${regla.fin.n === 1 ? 'vez' : 'veces'}`
  if (!regla.fin.fecha) return base
  const [y, m, d] = regla.fin.fecha.split('-').map(Number)
  const hasta = new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${base}, hasta el ${hasta}`
}
