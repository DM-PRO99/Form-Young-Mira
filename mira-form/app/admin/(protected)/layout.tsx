import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AdminShell from './_components/AdminShell'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/admin/login')
  }

  const user = {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: session.user.role,
  }

  return <AdminShell user={user}>{children}</AdminShell>
}
