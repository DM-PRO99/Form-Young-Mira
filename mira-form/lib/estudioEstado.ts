// Única fuente de verdad sobre qué tema está completo o bloqueado; la usan la API y la vista del curso.

interface CursoMinimo {
  desbloqueoSecuencial?: boolean
  modulos: {
    _id: { toString(): string } | string
    lecciones: { _id?: { toString(): string } | string }[]
    cuestionario?: { preguntas: unknown[]; notaMinima: number } | null
  }[]
}

export interface EstadoModulo {
  moduloId: string
  leccionesVistas: number
  totalLecciones: number
  tieneCuestionario: boolean
  mejorPuntaje: number | null
  aprobado: boolean
  completo: boolean
  bloqueado: boolean
}

export function tieneCuestionario(cuestionario?: { preguntas: unknown[] } | null): boolean {
  return !!cuestionario && cuestionario.preguntas.length > 0
}

export function estadoDelCurso(curso: CursoMinimo, completadas: Set<string>, mejoresPuntajes: Map<string, number>): EstadoModulo[] {
  let anteriorCompleto = true
  return curso.modulos.map((m) => {
    const moduloId = m._id.toString()
    const ids = m.lecciones.map((l) => l._id?.toString()).filter((id): id is string => !!id)
    const leccionesVistas = ids.filter((id) => completadas.has(id)).length
    const conCuestionario = tieneCuestionario(m.cuestionario)
    const mejorPuntaje = mejoresPuntajes.has(moduloId) ? mejoresPuntajes.get(moduloId)! : null
    const aprobado = !conCuestionario || (mejorPuntaje !== null && mejorPuntaje >= (m.cuestionario?.notaMinima ?? 70))
    const completo = leccionesVistas === ids.length && aprobado
    const bloqueado = !!curso.desbloqueoSecuencial && !anteriorCompleto
    anteriorCompleto = anteriorCompleto && completo
    return {
      moduloId,
      leccionesVistas,
      totalLecciones: ids.length,
      tieneCuestionario: conCuestionario,
      mejorPuntaje,
      aprobado: conCuestionario ? aprobado : false,
      completo,
      bloqueado,
    }
  })
}
