import Home from '../components/Home'

export default function Page() {
  return (
    <div className="min-h-screen bg-miraBlue/90 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl">
        <Home />
      </div>
    </div>
  )
}
