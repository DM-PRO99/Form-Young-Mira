import { NextRequest, NextResponse } from 'next/server'
import { issueSignedToken } from '@vercel/blob'
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client'
import { auth } from '@/auth'
import { withCors, corsPreflight } from '@/lib/cors'
import { ALLOWED_CONTENT_TYPES, IMAGE_CONTENT_TYPES, MAX_IMAGE_BYTES, MAX_UPLOAD_BYTES } from '@/lib/estudio'

export { corsPreflight as OPTIONS }

// El store usa OIDC (BLOB_STORE_ID + identidad de Vercel), no BLOB_READ_WRITE_TOKEN: las subidas
// desde el navegador van con URLs prefirmadas que emite esta ruta solo para admins.
const UPLOAD_WINDOW_MS = 60 * 60 * 1000

export const POST = withCors(async (req: NextRequest) => {
  let body: HandleUploadPresignedBody
  try {
    body = (await req.json()) as HandleUploadPresignedBody
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const result = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname, clientPayload) => {
        const session = await auth()
        if (session?.user.role !== 'admin') {
          throw new Error('Solo el administrador puede subir archivos')
        }
        if (!pathname.startsWith('estudio/')) {
          throw new Error('Ruta de archivo inválida')
        }
        // Las imágenes de la teoría tienen su propio límite y solo aceptan formatos de imagen.
        const esImagen = clientPayload === 'imagen'
        if (esImagen && !/^estudio\/[^/]+\/img\//.test(pathname)) {
          throw new Error('Ruta de imagen inválida')
        }
        const allowedContentTypes = esImagen ? IMAGE_CONTENT_TYPES : ALLOWED_CONTENT_TYPES
        const maximumSizeInBytes = esImagen ? MAX_IMAGE_BYTES : MAX_UPLOAD_BYTES
        const validUntil = Date.now() + UPLOAD_WINDOW_MS
        const token = await issueSignedToken({
          pathname,
          operations: ['put'],
          allowedContentTypes,
          maximumSizeInBytes,
          validUntil,
        })
        return {
          token,
          urlOptions: { allowedContentTypes, maximumSizeInBytes, addRandomSuffix: true, validUntil },
        }
      },
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo preparar la subida'
    return NextResponse.json({ error: message }, { status: 400 })
  }
})
