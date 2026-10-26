import mongoose, { Schema, Types } from 'mongoose'

export interface ILessonProgress {
  _id: Types.ObjectId
  userId: Types.ObjectId
  courseId: Types.ObjectId
  leccionId: Types.ObjectId
  createdAt: Date
}

const lessonProgressSchema = new Schema<ILessonProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    leccionId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

lessonProgressSchema.index({ userId: 1, leccionId: 1 }, { unique: true })

const LessonProgress =
  (mongoose.models.LessonProgress as mongoose.Model<ILessonProgress>) ||
  mongoose.model<ILessonProgress>('LessonProgress', lessonProgressSchema)

export default LessonProgress
