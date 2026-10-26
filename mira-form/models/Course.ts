import mongoose, { Schema, Types } from 'mongoose'

export type LessonType = 'video' | 'pdf' | 'presentacion'

export interface ILesson {
  _id: Types.ObjectId
  titulo: string
  tipo: LessonType
  archivoUrl: string
  archivoNombre: string
  tamano: number
}

export interface IModule {
  _id: Types.ObjectId
  titulo: string
  lecciones: ILesson[]
}

export interface ICourse {
  _id: Types.ObjectId
  titulo: string
  descripcion?: string
  estado: 'borrador' | 'publicado'
  creadoPor: Types.ObjectId
  modulos: IModule[]
  createdAt: Date
  updatedAt: Date
}

const lessonSchema = new Schema<ILesson>({
  titulo: { type: String, required: true },
  tipo: { type: String, enum: ['video', 'pdf', 'presentacion'], required: true },
  archivoUrl: { type: String, required: true },
  archivoNombre: { type: String, required: true },
  tamano: { type: Number, required: true },
})

const moduleSchema = new Schema<IModule>({
  titulo: { type: String, required: true },
  lecciones: { type: [lessonSchema], default: [] },
})

const courseSchema = new Schema<ICourse>(
  {
    titulo: { type: String, required: true },
    descripcion: { type: String },
    estado: { type: String, enum: ['borrador', 'publicado'], default: 'borrador' },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    modulos: { type: [moduleSchema], default: [] },
  },
  { timestamps: true }
)

const Course =
  (mongoose.models.Course as mongoose.Model<ICourse>) || mongoose.model<ICourse>('Course', courseSchema)

export default Course
