import mongoose, { Schema, Types } from 'mongoose'

export interface IInventoryItem {
  _id: Types.ObjectId
  eventoId: Types.ObjectId
  nombre: string
  cantidad?: string
  responsableId?: Types.ObjectId
  estado: 'pendiente' | 'comprado' | 'conseguido'
  notas?: string
  createdAt: Date
  updatedAt: Date
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    eventoId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    nombre: { type: String, required: true },
    cantidad: { type: String },
    responsableId: { type: Schema.Types.ObjectId, ref: 'User' },
    estado: { type: String, enum: ['pendiente', 'comprado', 'conseguido'], default: 'pendiente' },
    notas: { type: String },
  },
  { timestamps: true }
)

const InventoryItem =
  (mongoose.models.InventoryItem as mongoose.Model<IInventoryItem>) ||
  mongoose.model<IInventoryItem>('InventoryItem', inventoryItemSchema)

export default InventoryItem
