import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AdminNav from './_components/AdminNav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const user = {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: session.user.role,
    municipios: session.user.municipios,
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav user={user} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
