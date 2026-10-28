import sanitizeHtml from 'sanitize-html'
import { isBlobUrl } from '@/lib/estudio'

// Lista blanca de lo que el editor de teoría puede producir; todo lo demás (scripts, estilos, eventos) se elimina.
const OPCIONES: sanitizeHtml.IOptions = {
  allowedTags: ['h2', 'h3', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'code', 'pre'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
  },
  allowedSchemes: ['https', 'mailto'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer nofollow' }),
  },
  // Las imágenes solo pueden venir del propio Blob store del proyecto.
  exclusiveFilter: (frame) => frame.tag === 'img' && !isBlobUrl(frame.attribs.src ?? ''),
}

export function sanitizarHtml(html: string | undefined | null): string | undefined {
  if (!html) return undefined
  const limpio = sanitizeHtml(html, OPCIONES).trim()
  return htmlTieneContenido(limpio) ? limpio : undefined
}

export function htmlTieneContenido(html: string | undefined | null): boolean {
  if (!html) return false
  if (/<img\b/i.test(html)) return true
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0
}

// Todos los archivos del Blob que usa un curso: adjuntos de lecciones e imágenes de la teoría.
export function urlsDelCurso(
  modulos: { descripcion?: string | null; lecciones: { contenido?: string | null; archivoUrl?: string | null }[] }[]
): Set<string> {
  const urls = new Set<string>()
  for (const m of modulos) {
    urlsDeBlobEnHtml(m.descripcion).forEach((u) => urls.add(u))
    for (const l of m.lecciones) {
      if (l.archivoUrl) urls.add(l.archivoUrl)
      urlsDeBlobEnHtml(l.contenido).forEach((u) => urls.add(u))
    }
  }
  return urls
}

export function urlsDeBlobEnHtml(html: string | undefined | null): string[] {
  if (!html) return []
  const urls = new Set<string>()
  for (const match of html.matchAll(/\bsrc="([^"]+)"/g)) {
    const url = match[1].replace(/&amp;/g, '&')
    if (isBlobUrl(url)) urls.add(url)
  }
  return [...urls]
}
