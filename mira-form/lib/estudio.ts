import type { LessonType } from '@/models/Course'

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024

export const CONTENT_TYPES_BY_LESSON: Record<LessonType, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  pdf: ['application/pdf'],
  presentacion: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
  ],
}

export const ALLOWED_CONTENT_TYPES = Object.values(CONTENT_TYPES_BY_LESSON).flat()

const EXTENSION_TO_TYPE: Record<string, LessonType> = {
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  pdf: 'pdf',
  ppt: 'presentacion',
  pptx: 'presentacion',
}

export function lessonTypeFromFile(file: File): LessonType | null {
  for (const [tipo, types] of Object.entries(CONTENT_TYPES_BY_LESSON) as [LessonType, string[]][]) {
    if (types.includes(file.type)) return tipo
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_TO_TYPE[ext] ?? null
}

export function isBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
