import { Toaster } from 'sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans min-h-screen bg-canvas text-ink">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
      />
      {children}
      <Toaster position="top-right" richColors />
    </div>
  )
}
