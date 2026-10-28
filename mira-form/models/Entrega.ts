import mongoose, { Schema, Types } from 'mongoose'

// Entrega de una tarea del curso: una por persona y tarea; se puede reenviar mientras no esté calificada.
export interface IEntrega {
  _id: Types.ObjectId
  userId: Types.ObjectId
  courseId: Types.ObjectId
  tareaId: Types.ObjectId
  texto?: string
  archivoUrl?: string
  archivoNombre?: string
  tamano?: number
  entregadaEn: Date
  calificacion?: number
  comentario?: string
  calificadaPor?: Types.ObjectId
  calificadaEn?: Date
  createdAt: Date
  updatedAt: Date
}

const entregaSchema = new Schema<IEntrega>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    tareaId: { type: Schema.Types.ObjectId, required: true },
    texto: { type: String },
    archivoUrl: { type: String },
    archivoNombre: { type: String },
    tamano: { type: Number },
    entregadaEn: { type: Date, required: true },
    calificacion: { type: Number },
    comentario: { type: String },
    calificadaPor: { type: Schema.Types.ObjectId, ref: 'User' },
    calificadaEn: { type: Date },
  },
  { timestamps: true }
)

entregaSchema.index({ tareaId: 1, userId: 1 }, { unique: true })

const Entrega = (mongoose.models.Entrega as mongoose.Model<IEntrega>) || mongoose.model<IEntrega>('Entrega', entregaSchema)

export default Entrega
