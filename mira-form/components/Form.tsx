'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import QuestionField from './QuestionField'
import { questions, neighborhoodsByMunicipality } from '@/data/questions'

interface FormData {
  [key: string]: string | string[] | { [key: string]: string };
}

const schemaObj: { [key: string]: z.ZodType<any> } = {}
questions.forEach((q) => {
  if (q.type === 'group') {
    const groupSchema: { [key: string]: z.ZodType<any> } = {}
    q.fields?.forEach((f: any) => {
      if (f.required) {
        groupSchema[f.name] = z.string().min(1, `${f.label || f.name} es requerido`)
      } else {
        groupSchema[f.name] = z.string().optional()
      }
    })
    schemaObj[`group_${q.id}`] = z.object(groupSchema)
  } else if (q.type === 'radio' || q.type === 'text' || q.type === 'date' || q.type === 'select') {
    if (q.required) {
      schemaObj[`q_${q.id}`] = z.string().min(1, `${q.question} es requerido`)
    } else {
      schemaObj[`q_${q.id}`] = z.string().optional()
    }
  } else if (q.type === 'checkbox') {
    if (q.required) {
      schemaObj[`q_${q.id}`] = z.array(z.string()).min(1, `${q.question} es requerido`)
    } else {
      schemaObj[`q_${q.id}`] = z.array(z.string()).optional()
    }
  } else if (q.type === 'textarea') {
    schemaObj[`q_${q.id}`] = z.string().optional()
  }
})

const FormSchema = z.object(schemaObj)

type FormValues = z.infer<typeof FormSchema> & FormData;

export default function Form() {
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {}
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' })

  const selectedMunicipality = watch('q_8')
  const selectedNeighborhood = watch('q_8b')

  // Calcular progreso del formulario
  const formValues = watch()
  const progress = useMemo(() => {
    const totalFields = Object.keys(schemaObj).length
    const filledFields = Object.keys(formValues).filter(key => {
      const value = formValues[key]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object') return Object.keys(value).length > 0
      return value && value !== ''
    }).length
    return Math.round((filledFields / totalFields) * 100)
  }, [formValues])

  useEffect(() => {
    if (selectedMunicipality && selectedNeighborhood && neighborhoodsByMunicipality[selectedMunicipality]) {
      const comuna = neighborhoodsByMunicipality[selectedMunicipality][selectedNeighborhood]
      if (comuna) {
        setValue('q_8c', comuna)
      }
    }
  }, [selectedNeighborhood, selectedMunicipality, setValue])

  const onSubmit = async (data: any) => {
    console.log('📝 onSubmit llamado con data:', data)
    setLoading(true)
    setNotification({ show: false, type: 'success', message: '' })
    
    const payload: any = {
      q_1: '',
      q_2: '',
      q_3: '',
      q_4: '',
      q_5: '',
      tipoDocumento: '',
      numeroDocumento: '',
      q_7: '',
      q_8: '',
      q_8b: '',
      q_8c: '',
      q_9: '',
      q_10: '',
      q_11: '',
      q_12: '',
      q_13: '',
      q_14: '',
      q_15: '',
      q_16: '',
      q_17: '',
      q_18: '',
      q_19: '',
      q_20: '',
      q_21: '',
      q_22: '',
      q_23: '',
    }
    
    Object.keys(data).forEach((k) => {
      if (k.startsWith('group_')) {
        const group = data[k] || {}
        Object.keys(group).forEach((sub) => {
          payload[sub] = group[sub] || ''
        })
      } else {
        payload[k] = data[k] || ''
      }
    })
    
    try {
      console.log('📤 Enviando datos completos:', payload)
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const responseData = await res.json()
      console.log('Respuesta del servidor:', responseData)
      
      if (!res.ok) {
        throw new Error(responseData.message || 'Error al enviar el formulario')
      }
      
      if (responseData.success) {
        console.log('Formulario enviado exitosamente')
        setNotification({
          show: true,
          type: 'success',
          message: '¡Formulario enviado exitosamente! Tus respuestas han sido guardadas.'
        })
       
        setTimeout(() => {
          setSent(true)
          setLoading(false)
        }, 2000)
      } else {
        throw new Error(responseData.message || 'Error al guardar los datos')
      }
    } catch (err: any) {
      console.error('Error al enviar:', err)
      setNotification({
        show: true,
        type: 'error',
        message: err.message || 'Hubo un error al enviar el formulario. Por favor, intenta de nuevo.'
      })
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto p-10 bg-gradient-to-br from-white to-blue-50 rounded-3xl text-center shadow-2xl border border-blue-100">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-miraBlue mb-3">
            ¡Registro Exitoso!
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Tus respuestas han sido guardadas correctamente
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
          <h3 className="text-2xl font-bold text-miraBlue mb-3">
            💙 ¡Muchas Gracias por Participar!
          </h3>
          <p className="text-gray-700 leading-relaxed">
            Quedas cordialmente invitado a nuestra próxima integración de Juventudes MIRA. 
            Agradecemos tu compromiso y disposición con las respuestas.
          </p>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="btn-primary px-8 py-4 rounded-xl text-lg font-semibold inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Llenar Otro Formulario
        </button>
      </div>
    )
  }

  return (
    <div className="form-container p-8">
      {/* Indicador de progreso sticky */}
      <div className="sticky top-0 z-50 -mx-8 -mt-8 mb-8 bg-white/95 backdrop-blur-lg border-b border-blue-100 px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Progreso del formulario</span>
          <span className="text-sm font-bold text-miraBlue">{progress}%</span>
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-miraBlue via-blue-500 to-indigo-600 rounded-full shadow-lg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </motion.div>
        </div>
        {progress > 0 && progress < 100 && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-gray-500 mt-2 text-center"
          >
            ¡Vas muy bien! Sigue completando el formulario 🚀
          </motion.p>
        )}
        {progress === 100 && (
          <motion.p 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs text-green-600 font-semibold mt-2 text-center"
          >
            ✨ ¡Formulario completo! Ya puedes enviarlo
          </motion.p>
        )}
      </div>

      <div className="mb-10 text-center">
        <div className="inline-block mb-4">
          <div className="w-16 h-1 bg-gradient-to-r from-miraBlue to-blue-500 mx-auto rounded-full"></div>
        </div>
        <h1 className="text-4xl font-bold text-miraBlue mb-3 tracking-tight">
          Encuesta Juventudes MIRA
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tu opinión es muy importante para nosotros
        </p>
      </div>

      
      {notification.show && (
        <div className={`mb-8 p-5 rounded-2xl border animate-fade-in backdrop-blur-sm ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-900' 
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-900'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className="text-xl">
                {notification.type === 'success' ? '✓' : '✕'}
              </span>
            </div>
            <div className="flex-1 pt-1">
              <p className="font-bold text-lg mb-1">
                {notification.type === 'success' ? '¡Éxito!' : 'Error'}
              </p>
              <p className="text-sm leading-relaxed">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotification({ ...notification, show: false })}
              className="flex-shrink-0 text-2xl hover:opacity-70 transition-opacity p-1 hover:bg-white/50 rounded-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log(' Errores de validación:', errors)
        setNotification({
          show: true,
          type: 'error',
          message: 'Por favor completa todos los campos requeridos antes de enviar.'
        })
      })} className="space-y-6">
        {loading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm mx-4">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-miraBlue border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-miraBlue font-bold text-xl mb-2">Enviando Formulario</h3>
              <p className="text-gray-600 text-sm">Por favor espera un momento...</p>
              <div className="mt-4 flex justify-center gap-1">
                <div className="w-2 h-2 bg-miraBlue rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                <div className="w-2 h-2 bg-miraBlue rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-miraBlue rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
        {questions.map((q) => {
          if (q.type === 'group') {
            return (
              <Controller key={q.id} control={control} name={`group_${q.id}`} render={({ field }) => (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <QuestionField q={q} onChange={(k,v) => field.onChange({ ...(field.value||{}), [k]: v })} watchValue={field.value} />
                </div>
              )} />
            )
          }

          if (q.type === 'checkbox') {
            return (
              <Controller key={q.id} control={control} name={`q_${q.id}`} render={({ field }) => (
                <div className="radio-group">
                  <QuestionField q={q} onChange={(k,v) => field.onChange(v)} watchValue={field.value} />
                </div>
              )} />
            )
          }

          return (
            <Controller key={q.id} control={control} name={`q_${q.id}`} render={({ field }) => (
              <div className="radio-group">
                <QuestionField 
                  q={q} 
                  onChange={(k,v) => field.onChange(v)} 
                  watchValue={field.value}
                  municipalityValue={selectedMunicipality}
                />
              </div>
            )} />
          )
        })}

        <div className="mt-8">
          <button 
            className="btn-primary w-full py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all" 
            type="submit" 
            disabled={loading}
            onClick={() => console.log('🔘 Botón clickeado')}
          >
            {loading ? 'Enviando...' : 'Enviar respuestas'}
          </button>
        </div>
      </form>
    </div>
  )
}
