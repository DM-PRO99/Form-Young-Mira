import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { auth } from '@/auth'
import { withCors, corsPreflight } from '@/lib/cors'
import { ALLOWED_CONTENT_TYPES, MAX_UPLOAD_BYTES } from '@/lib/estudio'

export { corsPreflight as OPTIONS }

export const POST = withCors(async (req: NextRequest) => {
  let body: HandleUploadBody
  try {
    body = (await req.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth()
        if (session?.user.role !== 'admin') {
          throw new Error('Solo el administrador puede subir archivos')
        }
        if (!pathname.startsWith('estudio/')) {
          throw new Error('Ruta de archivo inválida')
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo preparar la subida'
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
