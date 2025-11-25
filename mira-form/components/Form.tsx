'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import QuestionField from './QuestionField'
import { questions, neighborhoodsByMunicipality } from '@/data/questions'

interface FormData {
  [key: string]: string | string[] | { [key: string]: string };
}

// Funciones de validación personalizadas
const validateName = (value: string) => {
  if (!value) return true // La validación de requerido se maneja por separado
  const hasNumbers = /\d/.test(value)
  return !hasNumbers
}

const validatePhone = (value: string) => {
  if (!value) return true
  return /^\d+$/.test(value.replace(/\s/g, ''))
}

const validateDocumentNumber = (value: string) => {
  if (!value) return true
  return /^\d+$/.test(value)
}

const validateDate = (value: string) => {
  if (!value) return true
  const date = new Date(value)
  return !isNaN(date.getTime())
}

const schemaObj: { [key: string]: z.ZodType<any> } = {}
questions.forEach((q) => {
  if (q.type === 'group') {
    const groupSchema: { [key: string]: z.ZodType<any> } = {}
    q.fields?.forEach((f: any) => {
      if (f.name === 'numeroDocumento') {
        // Validación especial para número de documento
        if (f.required) {
          groupSchema[f.name] = z.string()
            .min(1, `Este campo requerido`)
            .refine(validateDocumentNumber, {
              message: 'El número de documento solo puede contener números'
            })
        } else {
          groupSchema[f.name] = z.string()
            .optional()
            .refine((val) => !val || validateDocumentNumber(val), {
              message: 'El número de documento solo puede contener números'
            })
        }
      } else {
        if (f.required) {
          groupSchema[f.name] = z.string().min(1, `Este campo requerido`)
        } else {
          groupSchema[f.name] = z.string().optional()
        }
      }
    })
    schemaObj[`group_${q.id}`] = z.object(groupSchema)
  } else if (q.id === 2) {
    // Nombre completo - no debe contener números
    if (q.required) {
      schemaObj[`q_${q.id}`] = z.string()
        .min(1, `${q.question} es requerido`)
        .refine(validateName, {
          message: 'El nombre no puede contener números'
        })
    } else {
      schemaObj[`q_${q.id}`] = z.string()
        .optional()
        .refine((val) => !val || validateName(val), {
          message: 'El nombre no puede contener números'
        })
    }
  } else if (q.id === 5) {
    // Número de celular - solo números
    if (q.required) {
      schemaObj[`q_${q.id}`] = z.string()
        .min(1, `${q.question} es requerido`)
        .refine(validatePhone, {
          message: 'El número de celular solo puede contener números'
        })
    } else {
      schemaObj[`q_${q.id}`] = z.string()
        .optional()
        .refine((val) => !val || validatePhone(val), {
          message: 'El número de celular solo puede contener números'
        })
    }
  } else if (q.id === 4) {
    // Fecha de nacimiento - validar formato
    if (q.required) {
      schemaObj[`q_${q.id}`] = z.string()
        .min(1, `${q.question} es requerido`)
        .refine(validateDate, {
          message: 'Por favor ingresa una fecha válida'
        })
    } else {
      schemaObj[`q_${q.id}`] = z.string()
        .optional()
        .refine((val) => !val || validateDate(val), {
          message: 'Por favor ingresa una fecha válida'
        })
    }
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

interface FormProps {
  datosPrellenados?: Record<string, string> | null;
}

// Función para mapear los headers de Google Sheets a los campos del formulario
const mapearDatosAPrellenar = (datos: Record<string, string>): Partial<FormValues> => {
  const mapeo: Record<string, string> = {
    "Aceptación Política de Datos": "q_1",
    "Nombre Completo": "q_2",
    "Género": "q_3",
    "Fecha de Nacimiento": "q_4",
    "Número de Celular": "q_5",
    "Tipo de Documento": "tipoDocumento",
    "Número de Documento": "numeroDocumento",
    "Grupo Poblacional": "q_7",
    "Municipio": "q_8",
    "Barrio": "q_8b",
    "Comuna": "q_8c",
    "Dirección": "q_9",
    "Libreta Militar": "q_10",
    "¿Estás Estudiando?": "q_11",
    "¿En que institucion estudias?": "q_12",
    "Qué Te Gustaría Estudiar": "q_13",
    "Qué Estás Estudiando": "q_14",
    "Actividades Deportivas": "q_15",
    "Actividades Políticas": "q_16",
    "Actividades Sociales/Cívicas": "q_17",
    "Idiomas": "q_18",
    "Redes Sociales": "q_19",
    "Conocimientos Tecnológicos": "q_20",
    "¿Tienes Emprendimiento?": "q_21",
    "Cuál Emprendimiento": "q_22",
    "Tiempo Conociendo la Iglesia": "q_23",
    "Horario de Culto Preferido": "q_24",
  };

  const datosPrellenados: Partial<FormValues> = {};

  Object.keys(datos).forEach((header) => {
    const campo = mapeo[header];
    if (campo) {
      const valor = datos[header];
      
      // Si el campo es un grupo (tipoDocumento o numeroDocumento)
      if (campo === "tipoDocumento" || campo === "numeroDocumento") {
        if (!datosPrellenados["group_6"]) {
          datosPrellenados["group_6"] = {};
        }
        (datosPrellenados["group_6"] as any)[campo] = valor || "";
      }
      // Si el campo es un checkbox (arrays separados por comas)
      else if (campo === "q_15" || campo === "q_16" || campo === "q_17" || campo === "q_19" || campo === "q_20") {
        if (valor && valor.trim()) {
          datosPrellenados[campo] = valor.split(",").map((v) => v.trim()).filter((v) => v);
        } else {
          datosPrellenados[campo] = [];
        }
      }
      // Campos normales
      else {
        datosPrellenados[campo] = valor || "";
      }
    }
  });

  return datosPrellenados;
};

export default function Form({ datosPrellenados = null }: FormProps) {
  const { control, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange', // Validar en tiempo real mientras el usuario escribe
    defaultValues: {
      q_12: '',
      q_13: '',
      q_17: '',
      q_18: [],
      q_19: [],
      q_21: '',
    }
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [showHabeasDataModal, setShowHabeasDataModal] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null)
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

  // Prellenar formulario cuando hay datos encontrados
  useEffect(() => {
    if (datosPrellenados) {
      const datosMapeados = mapearDatosAPrellenar(datosPrellenados);
      console.log('📝 Prellenando formulario con datos:', datosMapeados);
      
      // Prellenar campos individuales
      Object.keys(datosMapeados).forEach((key) => {
        const valor = datosMapeados[key];
        
        if (key === "group_6" && typeof valor === "object") {
          // Manejar grupo de documento - pasar el objeto completo
          setValue("group_6" as any, valor as any);
        } else if (Array.isArray(valor)) {
          // Manejar arrays (checkboxes)
          setValue(key as any, valor);
        } else {
          // Campos normales
          setValue(key as any, valor);
        }
      });
    }
  }, [datosPrellenados, setValue]);

  useEffect(() => {
    if (selectedMunicipality && selectedNeighborhood && neighborhoodsByMunicipality[selectedMunicipality]) {
      const comuna = neighborhoodsByMunicipality[selectedMunicipality][selectedNeighborhood]
      if (comuna) {
        setValue('q_8c', comuna)
      }
    }
  }, [selectedNeighborhood, selectedMunicipality, setValue])

  const handleFormSubmit = (data: any) => {
    // Guardar los datos y mostrar el modal de confirmación
    setPendingSubmitData(data)
    setShowHabeasDataModal(true)
  }

  const confirmSubmit = async () => {
    if (!pendingSubmitData) return
    
    setShowHabeasDataModal(false)
    await onSubmit(pendingSubmitData)
  }

  const cancelSubmit = () => {
    setShowHabeasDataModal(false)
    setPendingSubmitData(null)
  }

  const onSubmit = async (data: any) => {
    console.log('📝 onSubmit llamado con data:', data)
    console.log('📋 Claves recibidas:', Object.keys(data))
    setLoading(true)
    setNotification({ show: false, type: 'success', message: '' })
    
    // Inicializar con TODOS los campos vacíos
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
      q_24: '',
    }
    
    Object.keys(data).forEach((k) => {
      if (k.startsWith('group_')) {
        const group = data[k] || {}
        Object.keys(group).forEach((sub) => {
          payload[sub] = group[sub] || ''
        })
      } else {
        const value = data[k]
        // Manejar arrays vacíos y valores undefined/null
        if (Array.isArray(value)) {
          payload[k] = value.length > 0 ? value.join(', ') : ''
        } else {
          payload[k] = value || ''
        }
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
        // Limpiar localStorage después de enviar exitosamente
        localStorage.removeItem('mira_form_cedula')
        localStorage.removeItem('mira_form_datos')
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
      
      {/* Modal de confirmación Ley 1581 */}
      <AnimatePresence>
        {showHabeasDataModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={cancelSubmit}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-miraBlue to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-miraBlue mb-2">
                  Política de Tratamiento de Datos Personales
                </h2>
                <p className="text-sm text-gray-500">
                  Ley 1581 de 2012 - Habeas Data
                </p>
              </div>

              {/* Contenido */}
              <div className="bg-blue-50 rounded-2xl p-6 mb-6 border border-blue-100">
                <p className="text-gray-700 leading-relaxed mb-4">
                  En cumplimiento a la <strong>Ley 1581 de 2012</strong> de Protección de Datos Personales (Habeas Data), 
                  informamos que los datos suministrados en este formulario serán tratados conforme a las disposiciones legales.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Al enviar este formulario, <strong>autorizas de manera expresa</strong> el manejo de tu información dentro de 
                  una base de datos privada y protegida, para los fines relacionados con la Encuesta Juventudes MIRA.
                </p>
                <div className="bg-white rounded-xl p-4 border-l-4 border-miraBlue">
                  <p className="text-sm text-gray-600">
                    <strong>Derechos que tienes:</strong> Conocer, actualizar, rectificar y suprimir tu información personal, 
                    así como revocar la autorización otorgada para el tratamiento de tus datos.
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={cancelSubmit}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmSubmit}
                  className="flex-1 btn-primary px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  Aceptar y Enviar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(handleFormSubmit, (errors) => {
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
            const fieldName = `group_${String(q.id)}` as keyof FormValues
            const fieldError = errors[fieldName]
            return (
              <Controller key={String(q.id)} control={control} name={fieldName as any} render={({ field }) => (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <QuestionField 
                    q={q} 
                    onChange={(k,v) => {
                      field.onChange({ ...(field.value||{}), [k]: v })
                      // Validar el campo después de cambiar
                      setTimeout(() => trigger(fieldName as any), 0)
                    }} 
                    watchValue={field.value}
                    error={fieldError as any}
                    fieldName={String(fieldName)}
                  />
                </div>
              )} />
            )
          }

          if (q.type === 'checkbox') {
            const fieldName = `q_${String(q.id)}` as keyof FormValues
            const fieldError = errors[fieldName]
            return (
              <Controller key={String(q.id)} control={control} name={fieldName as any} render={({ field }) => (
                <div className="radio-group">
                  <QuestionField 
                    q={q} 
                    onChange={(k,v) => {
                      field.onChange(v)
                      setTimeout(() => trigger(fieldName as any), 0)
                    }} 
                    watchValue={field.value}
                    error={fieldError as any}
                    fieldName={String(fieldName)}
                  />
                </div>
              )} />
            )
          }

          const fieldName = `q_${String(q.id)}` as keyof FormValues
          const fieldError = errors[fieldName]
          return (
            <Controller key={String(q.id)} control={control} name={fieldName as any} render={({ field }) => (
              <div className="radio-group">
                <QuestionField 
                  q={q} 
                  onChange={(k,v) => {
                    field.onChange(v)
                    setTimeout(() => trigger(fieldName as any), 0)
                  }} 
                  watchValue={field.value}
                  municipalityValue={selectedMunicipality}
                  error={fieldError as any}
                  fieldName={String(fieldName)}
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
