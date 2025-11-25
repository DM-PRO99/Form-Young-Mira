'use client'
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import Form from './Form'

const cedulaSchema = z.object({
  cedula: z.string()
    .min(1, 'La cédula es requerida')
    .min(7, 'La cédula debe tener al menos 7 dígitos')
    .max(12, 'La cédula no puede tener más de 12 dígitos')
    .regex(/^\d+$/, 'La cédula solo debe contener números')
})

type CedulaFormValues = z.infer<typeof cedulaSchema>

const STORAGE_KEY = 'mira_form_cedula'
const STORAGE_DATA_KEY = 'mira_form_datos'

const Home = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<CedulaFormValues>({
    resolver: zodResolver(cedulaSchema)
  })

  const [loading, setLoading] = useState(false)
  const [noRegistrado, setNoRegistrado] = useState(false)
  const [cedulaIngresada, setCedulaIngresada] = useState(false)
  const [datosEncontrados, setDatosEncontrados] = useState<any>(null)
  const [notFound, setNotFound] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(true);

  // Verificar localStorage al cargar el componente
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const savedCedula = localStorage.getItem(STORAGE_KEY)
        const savedData = localStorage.getItem(STORAGE_DATA_KEY)
        
        if (savedCedula && savedData) {
          // Si hay datos guardados, cargarlos automáticamente
          const parsedData = JSON.parse(savedData)
          setDatosEncontrados(parsedData)
          setCedulaIngresada(true)
        }
      } catch (error) {
        console.error('Error al leer localStorage:', error)
        // Si hay error, limpiar el storage
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(STORAGE_DATA_KEY)
      } finally {
        setCheckingStorage(false)
      }
    }

    checkStorage()
  }, [])

  const onSubmit = async (data: CedulaFormValues) => {
    setLoading(true)

    try {
      const respuesta = await buscarPorCedula(data.cedula)
      
      // Si se encontraron datos, guardarlos en estado y localStorage
      if (respuesta.data) {
        setDatosEncontrados(respuesta.data)
        // Guardar cédula y datos en localStorage
        localStorage.setItem(STORAGE_KEY, data.cedula)
        localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(respuesta.data))
      } else {
        // Si no hay datos pero la búsqueda fue exitosa, guardar solo la cédula
        localStorage.setItem(STORAGE_KEY, data.cedula)
      }
      
      setTimeout(() => {
        setCedulaIngresada(true)
        setLoading(false)
      }, 1000)
    } catch (err) {
      setLoading(false);
      setNotFound(true);
      return
    }
  }

  const redirectToRegisterForm = () => {
    // Guardar en localStorage que es un nuevo registro
    const cedulaValue = watch('cedula')
    if (cedulaValue) {
      localStorage.setItem(STORAGE_KEY, cedulaValue)
    }
    setNoRegistrado(true);
  }

  const handleVolverAtras = () => {
    // Limpiar localStorage y volver a la pantalla de ingreso
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_DATA_KEY)
    setCedulaIngresada(false)
    setNoRegistrado(false)
    setDatosEncontrados(null)
    setNotFound(false)
  }

  const buscarPorCedula = async (cedula: string) => {
    console.log('Buscando cédula:', cedula)
    const url = `/api/cedula/${cedula}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error al buscar cédula:', errorData)
      throw new Error(errorData.error || errorData.message || 'Error al buscar cédula')
    }
    
    const data = await response.json()
    console.log('Datos de la cédula:', data)

    return data
  }

  // Mostrar loading mientras se verifica el storage
  if (checkingStorage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-miraBlue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si ya se ingresó la cédula, mostrar el formulario
  if (cedulaIngresada || noRegistrado) {
    return (
        <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-xl">
                <div className="mb-4 sm:mb-6">
                  <button
                    onClick={handleVolverAtras}
                    className="flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-miraBlue transition-colors mb-4"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    <span>Volver atrás</span>
                  </button>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-miraBlue text-center mb-2">Encuesta Juventudes MIRA</h1>
                <p className="text-xs sm:text-sm text-slate-600 text-center mb-4 sm:mb-6 px-2">
                    ¡Queremos conocer a nuestro equipo de trabajo! Por eso, te invitamos a llenar esta encuesta para consolidar nuestro grupo.
                </p>
                <Form datosPrellenados={datosEncontrados} />
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-miraBlue via-blue-600 to-indigo-600 p-5 sm:p-6 md:p-8 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-3 sm:mb-4"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3-4a2 2 0 100 4 2 2 0 000-4zm0 0a2 2 0 110-4m0 4V9m0 0V7a2 2 0 110-4"></path>
                </svg>
              </div>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 px-2">
              Encuesta Juventudes MIRA
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm px-2">
              Ingresa tu número de Documento para comenzar
            </p>
          </div>

          {/* Formulario */}
          <div className="p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="cedula" className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de Documento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <input
                    id="cedula"
                    type="text"
                    {...register('cedula')}
                    placeholder="Ej: 1234567890"
                    className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-[3px] outline-none focus:ring-2 sm:focus:ring-4 transition-all ${
                      errors.cedula || notFound
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:border-miraBlue focus:ring-blue-200'
                    }`}
                    onChange={() => {
                      if (notFound) {
                        setNotFound(false);
                      }
                    }}
                    disabled={loading}
                  />
                </div>
                  {notFound && (
                    <p className='text-red-300'>La cedula no se encuentra registrada</p>
                  )}
                {errors.cedula && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.cedula.message}</span>
                  </motion.p>
                )}
              </div>

              <div className='flex flex-col sm:flex-row gap-2 sm:gap-2'>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 sm:py-4 border-2 border-gray-300 rounded-[2px] text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={redirectToRegisterForm}
                >
                  <span>Registrarse</span>
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary py-3 sm:py-4 rounded-[2px] text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleSubmit(onSubmit)}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Continuar</span>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                      </svg>
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            {/* Información adicional */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center px-2">
                🔒 Tus datos están protegidos y serán utilizados únicamente para fines de la encuesta
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Home;