import mongoose, { Schema, Types } from 'mongoose'

export interface ISubmission {
  _id: Types.ObjectId
  cedula: string
  municipio: string
  datos: Record<string, unknown>
  syncedToSheets: boolean
  createdAt: Date
  updatedAt: Date
}

const submissionSchema = new Schema<ISubmission>(
  {
    cedula: { type: String, required: true, unique: true, index: true },
    municipio: { type: String, required: true, index: true },
    datos: { type: Schema.Types.Mixed, default: {} },
    syncedToSheets: { type: Boolean, default: false },
  },
  { timestamps: true }
)

submissionSchema.index({ createdAt: -1 })

const Submission =
  (mongoose.models.Submission as mongoose.Model<ISubmission>) ||
  mongoose.model<ISubmission>('Submission', submissionSchema)

export default Submission
