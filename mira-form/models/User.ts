import mongoose, { Schema, Types } from 'mongoose'

// La colección users se comparte con otros proyectos del mismo cluster; filtrar siempre por estos roles.
export const MIRA_ROLES = ['admin', 'coordinador'] as const

export interface IUser {
  _id: Types.ObjectId
  email: string
  passwordHash: string
  nombre: string
  role: 'admin' | 'coordinador'
  municipios: string[]
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    nombre: { type: String, required: true },
    role: { type: String, enum: ['admin', 'coordinador'], required: true },
    municipios: { type: [String], default: [] },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', userSchema)

export default User
