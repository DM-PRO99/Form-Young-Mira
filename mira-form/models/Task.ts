import mongoose, { Schema, Types } from 'mongoose'

export interface ITask {
  _id: Types.ObjectId
  eventoId: Types.ObjectId
  titulo: string
  responsableId?: Types.ObjectId
  fechaLimite?: Date
  completada: boolean
  createdAt: Date
  updatedAt: Date
}

const taskSchema = new Schema<ITask>(
  {
    eventoId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    titulo: { type: String, required: true },
    responsableId: { type: Schema.Types.ObjectId, ref: 'User' },
    fechaLimite: { type: Date },
    completada: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const Task =
  (mongoose.models.Task as mongoose.Model<ITask>) ||
  mongoose.model<ITask>('Task', taskSchema)

export default Task
