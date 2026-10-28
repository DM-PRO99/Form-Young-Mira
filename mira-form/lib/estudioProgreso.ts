import { Types } from 'mongoose'
import LessonProgress from '@/models/LessonProgress'
import QuizAttempt from '@/models/QuizAttempt'

export interface AvanceUsuario {
  completadas: Set<string>
  mejoresPuntajes: Map<string, number>
}

export async function cargarAvance(userId: string, courseId: string): Promise<AvanceUsuario> {
  const [progress, intentos] = await Promise.all([
    LessonProgress.find({ userId, courseId }).select('leccionId').lean(),
    QuizAttempt.aggregate<{ _id: Types.ObjectId; mejor: number }>([
      { $match: { userId: new Types.ObjectId(userId), courseId: new Types.ObjectId(courseId) } },
      { $group: { _id: '$moduloId', mejor: { $max: '$puntaje' } } },
    ]),
  ])
  return {
    completadas: new Set(progress.map((p) => p.leccionId.toString())),
    mejoresPuntajes: new Map(intentos.map((i) => [i._id.toString(), i.mejor])),
  }
}
