import mongoose, { Schema, Types } from 'mongoose'

export interface ISyncFailure {
  _id: Types.ObjectId
  cedula: string
  datos: Record<string, unknown>
  error: string
  retries: number
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const syncFailureSchema = new Schema<ISyncFailure>(
  {
    cedula: { type: String, required: true, index: true },
    datos: { type: Schema.Types.Mixed, required: true },
    error: { type: String, required: true },
    retries: { type: Number, default: 0 },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const SyncFailure =
  (mongoose.models.SyncFailure as mongoose.Model<ISyncFailure>) ||
  mongoose.model<ISyncFailure>('SyncFailure', syncFailureSchema)

export default SyncFailure
