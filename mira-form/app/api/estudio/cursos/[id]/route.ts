import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { del } from '@vercel/blob'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Course, { type ICourse } from '@/models/Course'
import LessonProgress from '@/models/LessonProgress'
import QuizAttempt from '@/models/QuizAttempt'
import Entrega from '@/models/Entrega'
import { withCors, corsPreflight } from '@/lib/cors'
import { isBlobUrl } from '@/lib/estudio'
import { sanitizarHtml, urlsDelCurso } from '@/lib/estudioContenido'
import { estadoDelCurso } from '@/lib/estudioEstado'
import { cargarAvance } from '@/lib/estudioProgreso'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

const MAX_HTML = 200_000

async function deleteBlobs(urls: string[]) {
  if (urls.length === 0) return
  try {
    await del(urls)
  } catch (err) {
    console.error('Error al borrar archivos de Blob (no fatal):', err)
  }
}

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  await connectToMongoDB()

  const course = await Course.findById(id).lean<ICourse>()
  const esAdmin = session.user.role === 'admin'
  if (!course || (course.estado !== 'publicado' && !esAdmin)) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  const avance = await cargarAvance(session.user.id, id)
  const estado = estadoDelCurso(course, avance.completadas, avance.mejoresPuntajes)

  // El admin ve el curso completo (es quien lo arma). Los demás nunca reciben la respuesta correcta
  // ni el contenido de un tema que todavía no han desbloqueado.
  const modulos = course.modulos.map((m, i) => {
    const bloqueado = !esAdmin && estado[i].bloqueado
    const cuestionario = m.cuestionario
      ? {
          notaMinima: m.cuestionario.notaMinima,
          totalPreguntas: m.cuestionario.preguntas.length,
          preguntas: bloqueado
            ? []
            : m.cuestionario.preguntas.map((p) => ({
                _id: p._id,
                enunciado: p.enunciado,
                opciones: p.opciones,
                ...(esAdmin ? { correcta: p.correcta } : {}),
              })),
        }
      : undefined
    if (bloqueado) {
      return { _id: m._id, titulo: m.titulo, lecciones: m.lecciones.map((l) => ({ _id: l._id, titulo: l.titulo })), cuestionario }
    }
    return { ...m, cuestionario }
  })

  // Tareas: el coordinador solo ve las publicadas y el estado de sus entregas; el admin ve todas con sus conteos.
  const tareas = (course.tareas ?? []).filter((t) => esAdmin || t.publicada)
  const entregas = await Entrega.find(esAdmin ? { courseId: id } : { courseId: id, userId: session.user.id })
    .select('tareaId userId entregadaEn calificacion')
    .lean()
  const resumenTareas = tareas.map((t) => {
    const deLaTarea = entregas.filter((e) => e.tareaId.toString() === t._id.toString())
    if (esAdmin) {
      return { ...t, totalEntregas: deLaTarea.length, sinCalificar: deLaTarea.filter((e) => e.calificacion === undefined || e.calificacion === null).length }
    }
    const mia = deLaTarea[0]
    return {
      ...t,
      miEntrega: mia ? { entregadaEn: mia.entregadaEn, calificacion: mia.calificacion ?? null } : null,
    }
  })

  return NextResponse.json({
    data: {
      ...course,
      modulos,
      tareas: resumenTareas,
      completadas: [...avance.completadas],
      estadoModulos: estado,
    },
  })
})

const lessonSchema = z
  .object({
    _id: z.string().optional(),
    titulo: z.string().trim().min(1, 'Cada lección necesita un título').max(200),
    contenido: z.string().max(MAX_HTML, 'La teoría de una lección es demasiado larga').optional(),
    tipo: z.enum(['video', 'pdf', 'presentacion']).optional(),
    archivoUrl: z.string().refine(isBlobUrl, 'Archivo inválido').optional(),
    archivoNombre: z.string().max(300).optional(),
    tamano: z.number().nonnegative().optional(),
  })
  .refine((l) => !l.archivoUrl || (l.tipo && l.archivoNombre && l.tamano !== undefined), 'Adjunto incompleto')

const questionSchema = z
  .object({
    _id: z.string().optional(),
    enunciado: z.string().trim().min(1, 'Cada pregunta necesita un enunciado').max(1000),
    opciones: z.array(z.string().trim().min(1, 'Las opciones no pueden estar vacías').max(300)).min(2, 'Cada pregunta necesita al menos 2 opciones').max(6),
    correcta: z.number().int().min(0),
  })
  .refine((p) => p.correcta < p.opciones.length, 'Marca la opción correcta de cada pregunta')

const moduleSchema = z.object({
  _id: z.string().optional(),
  titulo: z.string().trim().min(1, 'Cada módulo necesita un título').max(200),
  descripcion: z.string().max(MAX_HTML, 'La introducción del tema es demasiado larga').optional(),
  lecciones: z.array(lessonSchema).max(200),
  cuestionario: z
    .object({
      preguntas: z.array(questionSchema).max(50),
      notaMinima: z.number().int().min(0).max(100),
    })
    .nullable()
    .optional(),
})

const updateSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido').optional(),
  descripcion: z.string().optional(),
  estado: z.enum(['borrador', 'publicado']).optional(),
  desbloqueoSecuencial: z.boolean().optional(),
  portadaUrl: z.string().refine(isBlobUrl, 'Imagen de portada inválida').nullable().optional(),
  inicio: z.string().max(MAX_HTML, 'El contenido de Inicio es demasiado largo').optional(),
  programa: z.string().max(MAX_HTML, 'El programa del curso es demasiado largo').optional(),
  modulos: z.array(moduleSchema).max(100).optional(),
})

export const PATCH = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el administrador puede editar cursos' }, { status: 403 })
  }

  const { id } = await params
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  await connectToMongoDB()

  const course = await Course.findById(id)
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  if (parsed.data.titulo !== undefined) course.titulo = parsed.data.titulo
  if (parsed.data.descripcion !== undefined) course.descripcion = parsed.data.descripcion
  if (parsed.data.estado !== undefined) course.estado = parsed.data.estado
  if (parsed.data.desbloqueoSecuencial !== undefined) course.desbloqueoSecuencial = parsed.data.desbloqueoSecuencial

  const urlsAntes = urlsDelCurso(course.toObject())
  let removedLessonIds: string[] = []
  let removedModuleIds: string[] = []

  if (parsed.data.portadaUrl !== undefined) course.portadaUrl = parsed.data.portadaUrl ?? undefined
  if (parsed.data.inicio !== undefined) course.inicio = sanitizarHtml(parsed.data.inicio)
  if (parsed.data.programa !== undefined) course.programa = sanitizarHtml(parsed.data.programa)

  if (parsed.data.modulos !== undefined) {
    const modulos = parsed.data.modulos.map((m) => ({
      ...m,
      descripcion: sanitizarHtml(m.descripcion),
      cuestionario: m.cuestionario && m.cuestionario.preguntas.length > 0 ? m.cuestionario : undefined,
      lecciones: m.lecciones.map((l) => ({ ...l, contenido: sanitizarHtml(l.contenido) })),
    }))

    const newLessonIds = new Set(modulos.flatMap((m) => m.lecciones.map((l) => l._id)).filter(Boolean))
    removedLessonIds = course.modulos.flatMap((m) => m.lecciones.map((l) => l._id.toString())).filter((lid) => !newLessonIds.has(lid))

    const newModuleIds = new Set(modulos.map((m) => m._id).filter(Boolean))
    removedModuleIds = course.modulos.map((m) => m._id.toString()).filter((mid) => !newModuleIds.has(mid))

    course.set('modulos', modulos)
  }

  const urlsDespues = urlsDelCurso(course.toObject())
  const removedUrls = [...urlsAntes].filter((u) => !urlsDespues.has(u))

  await course.save()

  if (removedLessonIds.length > 0) {
    await LessonProgress.deleteMany({ courseId: id, leccionId: { $in: removedLessonIds } })
  }
  if (removedModuleIds.length > 0) {
    await QuizAttempt.deleteMany({ courseId: id, moduloId: { $in: removedModuleIds } })
  }
  await deleteBlobs(removedUrls)

  return NextResponse.json({ data: course })
})

export const DELETE = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el administrador puede eliminar cursos' }, { status: 403 })
  }

  const { id } = await params
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  await connectToMongoDB()

  const course = await Course.findById(id)
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const entregas = await Entrega.find({ courseId: id }).select('archivoUrl').lean()
  const urls = [...urlsDelCurso(course.toObject()), ...entregas.map((e) => e.archivoUrl).filter((u): u is string => !!u)]

  await Promise.all([
    LessonProgress.deleteMany({ courseId: id }),
    QuizAttempt.deleteMany({ courseId: id }),
    Entrega.deleteMany({ courseId: id }),
  ])
  await Course.deleteOne({ _id: id })
  await deleteBlobs(urls)

  return NextResponse.json({ success: true })
})
