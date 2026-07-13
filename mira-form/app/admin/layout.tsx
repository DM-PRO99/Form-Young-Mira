import { Toaster } from 'sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {children}
      <Toaster position="top-right" richColors />
    </div>
  )
}
