import mongoose, { Schema, Types } from 'mongoose'

export interface IQuizAttempt {
  _id: Types.ObjectId
  userId: Types.ObjectId
  courseId: Types.ObjectId
  moduloId: Types.ObjectId
  respuestas: number[]
  puntaje: number
  aprobado: boolean
  createdAt: Date
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    moduloId: { type: Schema.Types.ObjectId, required: true },
    respuestas: { type: [Number], default: [] },
    puntaje: { type: Number, required: true },
    aprobado: { type: Boolean, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

quizAttemptSchema.index({ courseId: 1, userId: 1, moduloId: 1 })

const QuizAttempt =
  (mongoose.models.QuizAttempt as mongoose.Model<IQuizAttempt>) ||
  mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema)

export default QuizAttempt
