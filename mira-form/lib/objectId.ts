import { NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'

// Un id malformado haría que findById lance CastError (500); se responde 404 directamente.
export function invalidIdResponse(...ids: string[]): NextResponse | null {
  return ids.every((id) => isValidObjectId(id)) ? null : NextResponse.json({ error: 'No encontrado' }, { status: 404 })
}
