import mongoose, { Schema, Types } from 'mongoose'

export interface IRegistration {
  _id: Types.ObjectId
  eventoId: Types.ObjectId
  nombreCompleto: string
  cedula: string
  telefono: string
  correo?: string
  edad?: number
  acudiente?: { nombre?: string; telefono?: string }
  estado: 'pendiente' | 'confirmado' | 'cancelado'
  createdAt: Date
  updatedAt: Date
}

const registrationSchema = new Schema<IRegistration>(
  {
    eventoId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    nombreCompleto: { type: String, required: true },
    cedula: { type: String, required: true },
    telefono: { type: String, required: true },
    correo: { type: String },
    edad: { type: Number },
    acudiente: {
      nombre: { type: String },
      telefono: { type: String },
    },
    estado: { type: String, enum: ['pendiente', 'confirmado', 'cancelado'], default: 'confirmado' },
  },
  { timestamps: true }
)

registrationSchema.index({ eventoId: 1, cedula: 1 }, { unique: true })

const Registration =
  (mongoose.models.Registration as mongoose.Model<IRegistration>) ||
  mongoose.model<IRegistration>('Registration', registrationSchema)

export default Registration
