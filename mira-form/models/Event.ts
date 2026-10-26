import mongoose, { Schema, Types } from 'mongoose'

export interface IEvent {
  _id: Types.ObjectId
  nombre: string
  descripcionPublica?: string
  fechas: Date[]
  lugar: string
  capacidadMaxima?: number
  estado: 'borrador' | 'publicado' | 'cerrado'
  creadoPor: Types.ObjectId
  coordinadoresAsignados: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const eventSchema = new Schema<IEvent>(
  {
    nombre: { type: String, required: true },
    descripcionPublica: { type: String },
    fechas: {
      type: [Date],
      required: true,
      validate: { validator: (v: Date[]) => v.length > 0, message: 'Agrega al menos una fecha' },
    },
    lugar: { type: String, required: true },
    capacidadMaxima: { type: Number },
    estado: { type: String, enum: ['borrador', 'publicado', 'cerrado'], default: 'borrador' },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coordinadoresAsignados: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
  },
  { timestamps: true }
)

const Event =
  (mongoose.models.Event as mongoose.Model<IEvent>) ||
  mongoose.model<IEvent>('Event', eventSchema)

export default Event
