'use client'
import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react'
import { questions, neighborhoodsByMunicipality } from '@/data/questions'
import { formScreens, getTitleSize, type FormScreen } from '@/data/formScreens'
import { OpcionesCard, CampoField } from './QuestionCard'

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

const calculateAge = (dateString: string) => {
  const birthDate = new Date(dateString)
  if (isNaN(birthDate.getTime())) return NaN
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

const AUTORIZACION_ACUDIENTE_SI = 'Sí, cuento con autorización de mi acudiente.'
const AUTORIZACION_ACUDIENTE_NO = 'No cuento con autorización de mi acudiente.'
const AUTORIZACION_MAYOR_EDAD = 'Soy mayor de edad.'

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
    if (typeof q.required === 'function') {
      // Si required es una función, usamos superRefine para poder usar ctx y añadir issues personalizados
      schemaObj[`q_${q.id}`] = z.string().superRefine((val, ctx) => {
        const formValues = (ctx as any).parent;
        const isRequired = q.required ? (q.required as (values: any) => boolean)(formValues) : false;
        if (!isRequired || (val && (val as string).trim() !== '')) {
          return;
        }
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${q.question} es requerido`
        });
      });
    } else if (q.required) {
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
  onVolverAtras?: () => void;
}

// Función para mapear los headers de Google Sheets a los campos del formulario
const mapearDatosAPrellenar = (datos: Record<string, string>): Partial<FormValues> => {
  const mapeo: Record<string, string> = {
    "Autorización acudiente o mayor de edad (Ley 1581)": "q_autorizacion_menor",
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
    "¿En cual de estas áreas has trabajado o tienes conocimiento?": "q_25",
  };

  const datosPrellenados: Partial<FormValues> = {};

  Object.keys(datos).forEach((header) => {
    const campo = mapeo[header];
    if (campo) {
      const valor = datos[header];

      if (campo === "tipoDocumento" || campo === "numeroDocumento") {
        if (!datosPrellenados["group_6"]) {
          datosPrellenados["group_6"] = {};
        }
        (datosPrellenados["group_6"] as any)[campo] = valor || "";
      } else if (campo === "q_15" || campo === "q_16" || campo === "q_17" || campo === "q_19" || campo === "q_20" || campo === "q_25") {
        if (valor && valor.trim()) {
          datosPrellenados[campo] = valor.split(",").map((v) => v.trim()).filter((v) => v);
        } else {
          datosPrellenados[campo] = [];
        }
      } else {
        datosPrellenados[campo] = valor || "";
      }
    }
  });

  return datosPrellenados;
};

// ─── Resolución de metadata de cada pregunta (opciones/placeholder) ────────

function findQuestion(id: string | number) {
  return questions.find((q) => String(q.id) === String(id))
}

function resolveCampoMeta(questionId: string | number): { options?: string[]; placeholder?: string } {
  if (questionId === 'tipoDocumento' || questionId === 'numeroDocumento') {
    const group = questions.find((q) => q.id === 6)
    const field = group?.fields?.find((f) => f.name === questionId)
    return { options: field?.options, placeholder: field?.placeholder }
  }
  const q = findQuestion(questionId)
  return { placeholder: q?.placeholder }
}

function screenFieldNames(screen: FormScreen): string[] {
  if (screen.id === 'group_6') return ['group_6']
  if (screen.content.kind === 'opciones') return [`q_${screen.content.questionId}`]
  return screen.content.items.map((item) =>
    item.questionId === 'tipoDocumento' || item.questionId === 'numeroDocumento' ? 'group_6' : `q_${item.questionId}`
  ).filter((v, i, arr) => arr.indexOf(v) === i)
}

export default function Form({ datosPrellenados = null, onVolverAtras }: FormProps) {
  const { control, handleSubmit, formState: { errors }, watch, setValue, trigger, getValues } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
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
  const [screenIndex, setScreenIndex] = useState(0)
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' })

  const selectedMunicipality = watch('q_8')
  const selectedNeighborhood = watch('q_8b')
  const formValues = watch()

  const visibleIndices = useMemo(
    () => formScreens.map((_, i) => i).filter((i) => !formScreens[i].skip?.(formValues)),
    [formValues]
  )
  const totalVisible = visibleIndices.length
  const currentPosition = Math.max(1, visibleIndices.indexOf(screenIndex) + 1)
  const screen = formScreens[screenIndex]
  const isLastVisible = visibleIndices[visibleIndices.length - 1] === screenIndex
  const progressPct = Math.round((currentPosition / totalVisible) * 100)

  // Prellenar formulario cuando hay datos encontrados
  useEffect(() => {
    if (datosPrellenados) {
      const datosMapeados = mapearDatosAPrellenar(datosPrellenados);
      Object.keys(datosMapeados).forEach((key) => {
        const valor = datosMapeados[key];
        setValue(key as any, valor as any);
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

  function goToIndex(target: number) {
    setScreenIndex(Math.max(0, Math.min(formScreens.length - 1, target)))
  }

  async function handleNext() {
    const fields = screenFieldNames(screen)
    const valid = await trigger(fields as any)
    if (!valid) return
    let next = screenIndex + 1
    while (next < formScreens.length && formScreens[next].skip?.(getValues())) {
      next++
    }
    if (next < formScreens.length) {
      goToIndex(next)
    } else {
      void handleSubmit(handleFormSubmit, onValidationError)()
    }
  }

  function handlePrev() {
    let prev = screenIndex - 1
    while (prev > 0 && formScreens[prev].skip?.(getValues())) {
      prev--
    }
    goToIndex(Math.max(0, prev))
  }

  function onValidationError() {
    setNotification({
      show: true,
      type: 'error',
      message: 'Por favor completa todos los campos requeridos antes de enviar.'
    })
  }

  const handleFormSubmit = (data: any) => {
    const birthDate = data['q_4'] as string | undefined
    if (birthDate) {
      const age = calculateAge(birthDate)
      if (!isNaN(age) && age > 28) {
        setNotification({
          show: true,
          type: 'error',
          message: 'Este formulario está dirigido a personas de hasta 28 años. No es posible registrar una fecha de nacimiento mayor a 28 años.'
        })
        return
      }
    }

    const autorizacionMenor = data['q_autorizacion_menor'] as string | undefined
    if (autorizacionMenor === AUTORIZACION_ACUDIENTE_NO) {
      setNotification({
        show: true,
        type: 'error',
        message:
          'No es posible continuar sin la autorización del padre, madre o acudiente para el tratamiento de datos personales. Si es mayor de edad, seleccione la opción «Soy mayor de edad».',
      })
      return
    }
    if (birthDate) {
      const age = calculateAge(birthDate)
      if (!isNaN(age)) {
        if (age < 18 && autorizacionMenor === AUTORIZACION_MAYOR_EDAD) {
          setNotification({
            show: true,
            type: 'error',
            message:
              'Según la fecha de nacimiento usted es menor de edad. Indique si cuenta con la autorización de su acudiente.',
          })
          return
        }
        if (
          age >= 18 &&
          (autorizacionMenor === AUTORIZACION_ACUDIENTE_SI ||
            autorizacionMenor === AUTORIZACION_ACUDIENTE_NO)
        ) {
          setNotification({
            show: true,
            type: 'error',
            message: 'Si es mayor de edad, seleccione la opción «Soy mayor de edad».',
          })
          return
        }
      }
    }

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
    setLoading(true)
    setNotification({ show: false, type: 'success', message: '' })

    const payload: any = {
      q_autorizacion_menor: '', q_1: 'Sí', q_2: '', q_3: '', q_4: '', q_5: '',
      tipoDocumento: '', numeroDocumento: '', q_7: '', q_8: '', q_8b: '', q_8c: '',
      q_9: '', q_10: '', q_11: '', q_12: '', q_13: '', q_14: '', q_15: '', q_16: '',
      q_17: '', q_18: '', q_19: '', q_20: '', q_21: '', q_22: '', q_23: '', q_24: '', q_25: '',
    }

    Object.keys(data).forEach((k) => {
      if (k.startsWith('group_')) {
        const group = data[k] || {}
        Object.keys(group).forEach((sub) => {
          payload[sub] = group[sub] || ''
        })
      } else {
        const value = data[k]
        if (Array.isArray(value)) {
          payload[k] = value.length > 0 ? value.join(', ') : ''
        } else {
          payload[k] = value || ''
        }
      }
    })

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message || 'Error al enviar el formulario')
      }

      if (responseData.success) {
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
        }, 1500)
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

  // ─── Pantalla de éxito ────────────────────────────────────────────────
  if (sent) {
    return (
      <WizardShell>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto text-center"
          style={{
            maxWidth: '560px',
            backgroundColor: '#FFFFFF',
            borderRadius: '22px',
            padding: '48px 40px',
            boxShadow: '0 24px 60px rgba(4,16,54,0.32)',
          }}
        >
          <div
            className="mx-auto mb-6 flex items-center justify-center"
            style={{ width: '72px', height: '72px', borderRadius: '9999px', backgroundColor: '#EEF2FE' }}
          >
            <CheckCircle2 className="w-9 h-9" style={{ color: '#1E56E8' }} strokeWidth={1.8} />
          </div>
          <h2 className="font-extrabold mb-3" style={{ color: '#0A2472', fontSize: '28px' }}>
            ¡Registro exitoso!
          </h2>
          <p className="mb-6" style={{ color: '#5C6784' }}>
            Quedas cordialmente invitado a nuestra próxima integración de Juventudes MIRA. Agradecemos
            tu compromiso y disposición con las respuestas.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="wizard-btn-primary text-white font-bold inline-flex items-center gap-2"
            style={{
              height: '52px',
              padding: '0 28px',
              borderRadius: '12px',
              background: 'linear-gradient(120deg, #0A2472, #1E56E8)',
              boxShadow: '0 10px 24px rgba(30,86,232,0.3)',
            }}
          >
            Llenar otro formulario
          </button>
        </motion.div>
      </WizardShell>
    )
  }

  return (
    <WizardShell onVolverAtras={onVolverAtras}>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(10,36,114,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="text-center" style={{ backgroundColor: '#FFFFFF', borderRadius: '22px', padding: '40px 48px', boxShadow: '0 24px 60px rgba(4,16,54,0.32)' }}>
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: '#1E56E8' }} />
            <p className="font-bold" style={{ color: '#0A2472' }}>Enviando formulario...</p>
            <p className="text-sm mt-1" style={{ color: '#7A85A3' }}>Por favor espera un momento</p>
          </div>
        </div>
      )}

      {notification.show && notification.type === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mb-4 flex items-start gap-3"
          style={{ maxWidth: '760px', backgroundColor: '#FFFFFF', border: '1.5px solid #F3D3DB', borderRadius: '14px', padding: '16px 18px' }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D9455F' }} strokeWidth={1.8} />
          <div className="flex-1">
            <p className="text-sm" style={{ color: '#22304F' }}>{notification.message}</p>
          </div>
          <button onClick={() => setNotification({ ...notification, show: false })} className="text-lg flex-shrink-0" style={{ color: '#A9B6D8' }}>
            ×
          </button>
        </motion.div>
      )}

      {/* Barra de progreso */}
      <div className="mx-auto flex items-center gap-4 mb-[18px]" style={{ maxWidth: '760px' }}>
        <div className="flex-1 rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <div
            className="wizard-progress-fill h-full rounded-full"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #7FA6FF, #FFFFFF)' }}
          />
        </div>
        <span className="flex-shrink-0 text-white" style={{ fontSize: '13px', fontWeight: 700, opacity: 0.85 }}>
          Pregunta {currentPosition} de {totalVisible}
        </span>
      </div>

      {/* Tarjeta de la pregunta */}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto"
          style={{
            maxWidth: '760px',
            backgroundColor: '#FFFFFF',
            borderRadius: '22px',
            padding: '40px',
            boxShadow: '0 24px 60px rgba(4,16,54,0.32)',
            boxSizing: 'border-box',
          }}
        >
          <p
            className="uppercase mb-3"
            style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.16em', color: '#1E56E8' }}
          >
            {screen.section}
          </p>
          <h2
            className="font-bold mb-2"
            style={{
              color: '#0A2472',
              fontSize: `${getTitleSize(screen.title)}px`,
              lineHeight: 1.28,
              letterSpacing: '-0.01em',
            }}
          >
            {screen.title}
          </h2>
          {screen.help && (
            <p className="mb-6" style={{ fontSize: '15px', color: '#7A85A3' }}>
              {screen.help}
            </p>
          )}
          {!screen.help && <div className="mb-4" />}

          <ScreenBody
            screen={screen}
            control={control}
            trigger={trigger}
            errors={errors}
            selectedMunicipality={selectedMunicipality}
          />

          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid #F0F3FB' }}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={visibleIndices.indexOf(screenIndex) === 0}
              className="wizard-btn-secondary font-semibold"
              style={{
                height: '48px',
                padding: '0 22px',
                borderRadius: '12px',
                backgroundColor: 'transparent',
                border: '1.5px solid #E4E9F7',
                color: visibleIndices.indexOf(screenIndex) === 0 ? '#A9B6D8' : '#0A2472',
              }}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => void handleNext()}
              className="wizard-btn-primary flex items-center gap-2 text-white font-bold"
              style={{
                height: '52px',
                padding: '0 26px',
                borderRadius: '12px',
                background: 'linear-gradient(120deg, #0A2472, #1E56E8)',
                boxShadow: '0 10px 24px rgba(30,86,232,0.3)',
              }}
            >
              {isLastVisible ? 'Finalizar' : 'Continuar'}
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Puntos de navegación */}
      <div className="flex items-center justify-center gap-1.5 mt-6">
        {visibleIndices.map((idx) => {
          const isCurrent = idx === screenIndex
          const posInVisible = visibleIndices.indexOf(idx)
          const isAnswered = posInVisible < currentPosition - 1
          return (
            <button
              key={idx}
              type="button"
              onClick={() => goToIndex(idx)}
              aria-label={`Ir a la pregunta ${posInVisible + 1}`}
              className="wizard-dot rounded-full"
              style={{
                height: '6px',
                width: isCurrent ? '28px' : '6px',
                backgroundColor: isCurrent ? '#FFFFFF' : isAnswered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
              }}
            />
          )
        })}
      </div>

      <p className="text-center mt-6" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
        Tus respuestas se guardan automáticamente.
      </p>

      {/* Modal Ley 1581 */}
      <AnimatePresence>
        {showHabeasDataModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(10,36,114,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={cancelSubmit}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full overflow-y-auto"
              style={{
                maxWidth: '640px',
                maxHeight: '90vh',
                backgroundColor: '#FFFFFF',
                borderRadius: '22px',
                boxShadow: '0 24px 60px rgba(4,16,54,0.32)',
              }}
            >
              <div className="p-8">
                <div className="text-center mb-6">
                  <div
                    className="mx-auto mb-4 flex items-center justify-center"
                    style={{ width: '64px', height: '64px', borderRadius: '9999px', backgroundColor: '#EEF2FE' }}
                  >
                    <ShieldCheck className="w-8 h-8" style={{ color: '#1E56E8' }} strokeWidth={1.8} />
                  </div>
                  <h2 className="font-extrabold mb-1" style={{ color: '#0A2472', fontSize: '22px' }}>
                    Política de tratamiento de datos personales
                  </h2>
                  <p className="text-sm" style={{ color: '#7A85A3' }}>Ley 1581 de 2012 · Habeas Data</p>
                </div>

                <div className="mb-6" style={{ backgroundColor: '#F4F6FC', borderRadius: '14px', padding: '20px' }}>
                  <p className="mb-3" style={{ color: '#37456B', lineHeight: 1.6 }}>
                    En cumplimiento a la <strong>Ley 1581 de 2012</strong> de Protección de Datos Personales
                    (Habeas Data), informamos que los datos suministrados en este formulario serán tratados
                    conforme a las disposiciones legales.
                  </p>
                  <p className="mb-3" style={{ color: '#37456B', lineHeight: 1.6 }}>
                    Al enviar este formulario, <strong>autorizas de manera expresa</strong> el manejo de tu
                    información dentro de una base de datos privada y protegida, para los fines relacionados
                    con la Encuesta Juventudes MIRA.
                  </p>
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '14px', borderLeft: '4px solid #1E56E8' }}>
                    <p className="text-sm" style={{ color: '#5C6784' }}>
                      <strong>Derechos que tienes:</strong> conocer, actualizar, rectificar y suprimir tu
                      información personal, así como revocar la autorización otorgada.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={cancelSubmit}
                    className="wizard-btn-secondary flex-1 font-semibold"
                    style={{ height: '52px', borderRadius: '12px', border: '1.5px solid #E4E9F7', color: '#0A2472' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmSubmit}
                    className="wizard-btn-primary flex-1 text-white font-bold"
                    style={{
                      height: '52px',
                      borderRadius: '12px',
                      background: 'linear-gradient(120deg, #0A2472, #1E56E8)',
                      boxShadow: '0 10px 24px rgba(30,86,232,0.3)',
                    }}
                  >
                    Aceptar y enviar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </WizardShell>
  )
}

// ─── Cáscara visual (fondo, header, halo) ──────────────────────────────────

function WizardShell({ children, onVolverAtras }: { children: React.ReactNode; onVolverAtras?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0A2472, #12307F, #1E56E8)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxSizing: 'border-box',
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%',
          right: '-15%',
          width: '1200px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(91,63,228,0.55), transparent 70%)',
        }}
      />

      <header className="relative flex items-center justify-between px-6 sm:px-10 py-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mira-badge.png"
            alt="Juventudes Mira"
            className="w-[68px] h-[68px] rounded-2xl object-cover flex-shrink-0"
          />
          <div className="leading-tight">
            <p
              className="uppercase text-white"
              style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.16em', opacity: 0.78 }}
            >
              Encuesta Juventudes MIRA
            </p>
            <p className="text-white" style={{ fontSize: '12.5px', opacity: 0.58 }}>
              Partido Político Mira
            </p>
          </div>
        </div>
        {onVolverAtras && (
          <button
            onClick={onVolverAtras}
            className="landing-toggle flex items-center gap-2 text-white"
            style={{ opacity: 0.78 }}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
            Volver atrás
          </button>
        )}
      </header>

      <main className="relative px-6 sm:px-10 pb-16">{children}</main>
    </motion.div>
  )
}

// ─── Cuerpo de la pantalla (opciones o campos) ─────────────────────────────

function ScreenBody({
  screen,
  control,
  trigger,
  errors,
  selectedMunicipality,
}: {
  screen: FormScreen
  control: any
  trigger: (name: any) => void
  errors: any
  selectedMunicipality?: string
}) {
  if (screen.content.kind === 'opciones') {
    const question = findQuestion(screen.content.questionId)
    const fieldName = `q_${screen.content.questionId}`
    return (
      <Controller
        control={control}
        name={fieldName as any}
        render={({ field }) => (
          <OpcionesCard
            options={question?.options ?? []}
            multi={screen.content.kind === 'opciones' ? screen.content.multi : false}
            value={field.value}
            onChange={(v) => {
              field.onChange(v)
              setTimeout(() => trigger(fieldName as any), 0)
            }}
          />
        )}
      />
    )
  }

  // campos
  if (screen.id === 'group_6') {
    return (
      <Controller
        control={control}
        name="group_6"
        render={({ field }) => (
          <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {screen.content.kind === 'campos' &&
              screen.content.items.map((item) => {
                const meta = resolveCampoMeta(item.questionId)
                const value = (field.value && field.value[item.questionId]) || ''
                return (
                  <CampoField
                    key={String(item.questionId)}
                    label={item.label}
                    type={item.type}
                    value={value}
                    placeholder={item.placeholder ?? meta.placeholder}
                    options={meta.options}
                    error={errors?.group_6?.[item.questionId]?.message}
                    onChange={(v) => {
                      field.onChange({ ...(field.value || {}), [item.questionId]: v })
                      setTimeout(() => trigger('group_6' as any), 0)
                    }}
                  />
                )
              })}
          </div>
        )}
      />
    )
  }

  return (
    <div className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {screen.content.kind === 'campos' &&
        screen.content.items.map((item) => {
          const fieldName = `q_${item.questionId}`
          const meta = resolveCampoMeta(item.questionId)
          return (
            <Controller
              key={String(item.questionId)}
              control={control}
              name={fieldName as any}
              render={({ field }) => (
                <CampoField
                  label={item.label}
                  type={item.type}
                  value={typeof field.value === 'string' ? field.value : ''}
                  placeholder={item.placeholder ?? meta.placeholder}
                  municipalityValue={item.type === 'select-search' ? selectedMunicipality : undefined}
                  neighborhoods={item.type === 'select-search' ? neighborhoodsByMunicipality : undefined}
                  error={errors?.[fieldName]?.message}
                  onChange={(v) => {
                    field.onChange(v)
                    setTimeout(() => trigger(fieldName as any), 0)
                  }}
                />
              )}
            />
          )
        })}
    </div>
  )
}
