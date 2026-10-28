import mongoose, { Schema, Types } from 'mongoose'

export type LessonType = 'video' | 'pdf' | 'presentacion'

// Una lección tiene teoría (HTML ya sanitizado), un archivo adjunto, o ambos.
// Las lecciones creadas antes de la teoría solo tienen adjunto y siguen siendo válidas.
export interface ILesson {
  _id: Types.ObjectId
  titulo: string
  contenido?: string
  tipo?: LessonType
  archivoUrl?: string
  archivoNombre?: string
  tamano?: number
}

export interface IQuestion {
  _id: Types.ObjectId
  enunciado: string
  opciones: string[]
  correcta: number
}

export interface IQuiz {
  preguntas: IQuestion[]
  notaMinima: number
}

export interface IModule {
  _id: Types.ObjectId
  titulo: string
  descripcion?: string
  lecciones: ILesson[]
  cuestionario?: IQuiz
}

export interface ICourse {
  _id: Types.ObjectId
  titulo: string
  descripcion?: string
  estado: 'borrador' | 'publicado'
  desbloqueoSecuencial: boolean
  creadoPor: Types.ObjectId
  modulos: IModule[]
  createdAt: Date
  updatedAt: Date
}

const lessonSchema = new Schema<ILesson>({
  titulo: { type: String, required: true },
  contenido: { type: String },
  tipo: { type: String, enum: ['video', 'pdf', 'presentacion'] },
  archivoUrl: { type: String },
  archivoNombre: { type: String },
  tamano: { type: Number },
})

const questionSchema = new Schema<IQuestion>({
  enunciado: { type: String, required: true },
  opciones: { type: [String], required: true },
  correcta: { type: Number, required: true },
})

const quizSchema = new Schema<IQuiz>(
  {
    preguntas: { type: [questionSchema], default: [] },
    notaMinima: { type: Number, default: 70 },
  },
  { _id: false }
)

const moduleSchema = new Schema<IModule>({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  lecciones: { type: [lessonSchema], default: [] },
  cuestionario: { type: quizSchema },
})

const courseSchema = new Schema<ICourse>(
  {
    titulo: { type: String, required: true },
    descripcion: { type: String },
    estado: { type: String, enum: ['borrador', 'publicado'], default: 'borrador' },
    desbloqueoSecuencial: { type: Boolean, default: false },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    modulos: { type: [moduleSchema], default: [] },
  },
  { timestamps: true }
)

const Course =
  (mongoose.models.Course as mongoose.Model<ICourse>) || mongoose.model<ICourse>('Course', courseSchema)

export default Course
