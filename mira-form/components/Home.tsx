'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { CreditCard, ArrowRight, AlertCircle } from 'lucide-react'
import Form from './Form'
import CoordinadorLogin from './CoordinadorLogin'

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
  const cedulaValue = watch('cedula') ?? ''
  const cedulaField = register('cedula')

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

  const cedulaDigitCount = cedulaValue.length
  const isValidCedula = /^\d{7,12}$/.test(cedulaValue)
  const showLiveError = cedulaDigitCount > 0 && cedulaDigitCount < 7

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ boxSizing: 'border-box' }}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
      />

      {/* Columna izquierda — encuesta */}
      <div
        className="relative overflow-hidden flex-1 flex flex-col justify-between px-8 py-10 sm:px-12 sm:py-14"
        style={{
          background: 'linear-gradient(140deg, #0A2472, #1E56E8, #5B3FE4)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxSizing: 'border-box',
        }}
      >
        {/* Halos radiales decorativos */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-10%',
            right: '-10%',
            width: '480px',
            height: '480px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-15%',
            left: '-10%',
            width: '520px',
            height: '520px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(91,63,228,0.35), transparent 70%)',
          }}
        />

        {/* Bloque superior */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative flex items-center gap-3.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mira-badge.png"
            alt="Juventudes Mira"
            className="w-[72px] h-[72px] rounded-2xl object-cover flex-shrink-0"
          />
          <div className="leading-tight">
            <p className="text-white font-extrabold tracking-[0.12em] text-sm">SOY JOVEN MIRAÍSTA</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Partido Político Mira
            </p>
          </div>
        </motion.div>

        {/* Bloque central */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative max-w-md py-10"
        >
          <p
            className="text-xs font-extrabold tracking-[0.14em] mb-3"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            PASO 1 DE 3
          </p>
          <h1
            className="text-white font-extrabold mb-4"
            style={{ fontSize: '40px', letterSpacing: '-0.02em', lineHeight: 1.1 }}
          >
            Encuesta Juventudes MIRA
          </h1>
          <p className="mb-7" style={{ color: 'rgba(255,255,255,0.82)' }}>
            Ingresa tu número de documento para comenzar. Lo usamos solo para evitar respuestas
            duplicadas.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <label
              htmlFor="cedula"
              className="block text-sm font-semibold text-white mb-2"
            >
              Número de documento
            </label>
            <div className="relative mb-2">
              <CreditCard
                className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                strokeWidth={1.8}
              />
              <input
                id="cedula"
                type="text"
                inputMode="numeric"
                placeholder="1234567890"
                {...cedulaField}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12)
                  void cedulaField.onChange(e)
                  if (notFound) setNotFound(false)
                }}
                disabled={loading}
                className="w-full pl-12 pr-4 text-white outline-none transition-colors placeholder:text-white/40 disabled:opacity-60"
                style={{
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {notFound ? (
              <p
                className="flex items-center gap-1.5 text-sm mb-6"
                style={{ color: '#FFC2D1' }}
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
                La cédula no se encuentra registrada
              </p>
            ) : errors.cedula ? (
              <p
                className="flex items-center gap-1.5 text-sm mb-6"
                style={{ color: '#FFC2D1' }}
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
                {errors.cedula.message}
              </p>
            ) : (
              <p
                className="text-sm mb-6"
                style={{ color: showLiveError ? '#FFC2D1' : 'rgba(255,255,255,0.6)' }}
              >
                Sin puntos ni espacios.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit(onSubmit)}
                className="flex-1 flex items-center justify-center gap-2 font-semibold transition-[opacity,box-shadow] active:scale-[0.98] disabled:cursor-not-allowed"
                style={{
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  color: '#0A2472',
                  opacity: isValidCedula ? 1 : 0.55,
                  boxShadow: isValidCedula ? '0 12px 24px -10px rgba(0,0,0,0.35)' : 'none',
                  boxSizing: 'border-box',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0A2472] border-t-transparent rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Comenzar encuesta
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={loading}
                onClick={redirectToRegisterForm}
                className="flex-1 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  boxSizing: 'border-box',
                }}
              >
                Aún no estoy registrado
              </button>
            </div>
          </form>
        </motion.div>

        {/* Bloque inferior */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative flex items-center gap-4 text-sm"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <span>5 minutos</span>
          <span>·</span>
          <span>18 preguntas</span>
          <span>·</span>
          <span>Respuestas anónimas</span>
        </motion.div>
      </div>

      {/* Columna derecha — acceso interno */}
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="flex-1 flex">
        <CoordinadorLogin />
      </div>
    </div>
  )
}

export default Home;
