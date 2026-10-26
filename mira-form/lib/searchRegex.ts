export const QUERY_MAX_TIME_MS = 5000

// Convierte el texto de búsqueda en un patrón literal para que no se pueda inyectar una regex costosa (ReDoS).
export function searchPattern(q: string): string {
  return q.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
