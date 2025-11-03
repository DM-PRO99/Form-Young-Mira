'use client'
import Form from '../components/Form'

export default function Page() {
  return (
    <div className="w-full max-w-4xl">
      <div className="bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-miraBlue text-center mb-2">Encuesta Juventudes MIRA</h1>
        <p className="text-sm text-slate-600 text-center mb-6">
          ¡Queremos conocer a nuestro equipo de trabajo! Por eso, te invitamos a llenar esta encuesta para consolidar nuestro grupo.
        </p>
        <Form />
      </div>
    </div>
  )
}
