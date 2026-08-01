import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Sidebar from './_components/Sidebar'
import Topbar from './_components/Topbar'

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
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1240px] mx-auto px-8 pt-7 pb-12">{children}</div>
        </main>
      </div>
    </div>
  )
}
