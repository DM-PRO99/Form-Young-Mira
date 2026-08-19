import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserMunicipios } from '@/lib/rbac'
import { withCors, corsPreflight } from '@/lib/cors'

export { corsPreflight as OPTIONS }

export const GET = withCors(async (_req: NextRequest) => {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const municipios =
    session.user.role !== 'admin' ? await getUserMunicipios(session.user.id) : []

  return NextResponse.json({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    municipios,
  })
})
