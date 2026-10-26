import { Toaster } from 'sonner'
import { fontVariables } from '@/lib/fonts'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fontVariables} font-sans min-h-screen bg-canvas text-ink antialiased`}>
      {children}
      <Toaster position="top-right" richColors />
    </div>
  )
}
