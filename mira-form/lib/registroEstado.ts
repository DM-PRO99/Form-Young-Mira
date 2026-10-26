// Un registro está "Completo" si tiene todos estos datos; si le falta alguno queda "Pendiente de revisión".
export const CAMPOS_CLAVE = ['q_2', 'q_4', 'q_5', 'q_8', 'q_8b', 'q_9'] as const

export const CAMPO_CLAVE_LABEL: Record<(typeof CAMPOS_CLAVE)[number], string> = {
  q_2: 'nombre',
  q_4: 'fecha de nacimiento',
  q_5: 'celular',
  q_8: 'municipio',
  q_8b: 'barrio',
  q_9: 'dirección',
}

export function camposFaltantes(datos: Record<string, unknown>): string[] {
  return CAMPOS_CLAVE.filter((k) => {
    const v = datos[k]
    return typeof v !== 'string' || v.trim() === ''
  }).map((k) => CAMPO_CLAVE_LABEL[k])
}

export function esRegistroCompleto(datos: Record<string, unknown>): boolean {
  return camposFaltantes(datos).length === 0
}

// Filtros de Mongo equivalentes a camposFaltantes(): null atrapa campos ausentes y la regex los que solo tienen espacios.
const VACIO = [null, /^\s*$/]

export const FILTRO_INCOMPLETO = {
  $or: CAMPOS_CLAVE.map((k) => ({ [`datos.${k}`]: { $in: VACIO } })),
}

export const FILTRO_COMPLETO = {
  $and: CAMPOS_CLAVE.map((k) => ({ [`datos.${k}`]: { $nin: VACIO } })),
}
