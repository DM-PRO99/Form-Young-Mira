'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question, neighborhoodsByMunicipality } from '@/data/questions'

type FormValues = { [key: string]: string };

interface QuestionFieldProps {
  q: Question;
  watchValue?: string | string[] | FormValues;
  onChange: (key: string, value: string | string[] | FormValues) => void;
  municipalityValue?: string;
  error?: any;
  fieldName?: string;
}

export default function QuestionField({ q, watchValue, onChange, municipalityValue, error, fieldName }: QuestionFieldProps) {
  // Función helper para obtener el mensaje de error
  const getErrorMessage = (fieldKey?: string): string | undefined => {
    if (!error) return undefined
    
    // Si es un error de grupo, buscar el error del campo específico
    if (error && typeof error === 'object' && fieldKey) {
      const fieldError = (error as any)[fieldKey]
      if (fieldError) {
        return fieldError.message || fieldError
      }
    }
    
    // Error directo
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    
    return undefined
  }

  // Función helper para verificar si hay error
  const hasError = (fieldKey?: string): boolean => {
    if (!error) return false
    if (fieldKey && error && typeof error === 'object') {
      return !!(error as any)[fieldKey]
    }
    return !!error
  }

  // Animación de entrada para las cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut" as const
      }
    }
  };

  if (q.type === 'group') {
    return (
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 relative group"
      >
        {/* Card con efecto glassmorphism */}
        <div className="relative bg-gradient-to-br from-white/90 via-blue-50/50 to-indigo-50/50 backdrop-blur-xl p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
          {/* Efecto de brillo animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Decoración de esquina */}
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-miraBlue/10 to-transparent rounded-bl-full"></div>
          
          <p className="font-bold text-base sm:text-lg text-miraBlue mb-3 sm:mb-4 relative z-10 flex items-center gap-2">
            <span>{q.question}</span>
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
            {q.fields?.map((f: any, index: number) => {
              // FIX PARA CAMPOS ANIDADOS: Asegurar que 'required' es solo un booleano para el elemento HTML.
              const isFieldRequired = typeof f.required === 'boolean' ? f.required : undefined;

              return (
              <motion.div 
                key={f.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gradient-to-r from-miraBlue to-blue-400 rounded-full flex-shrink-0"></span>
                  <span>{f.label}</span>
                </label>
                {f.type === 'select' ? (
                  <div>
                    <select 
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-[3px] outline-none focus:ring-2 sm:focus:ring-4 transition-all text-sm sm:text-base ${
                        hasError(f.name) 
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-300 focus:border-miraBlue focus:ring-blue-200'
                      } ${q.readOnly ? 'bg-gradient-to-r from-gray-50 to-blue-50 cursor-not-allowed' : ''}`}
                      required={isFieldRequired} // Usando la variable resuelta
                      value={watchValue && !Array.isArray(watchValue) && typeof watchValue === 'object' ? watchValue[f.name] || '' : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        onChange(f.name, value);
                      }}
                    >
                      <option value="">Selecciona...</option>
                      {f.options?.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}
                    </select>
                    <AnimatePresence>
                      {watchValue && !Array.isArray(watchValue) && typeof watchValue === 'object' && watchValue[f.name] === 'Otro' && (
                        <motion.input
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          type="text"
                          placeholder="Especifica el tipo de documento"
                          className="modern-input w-full mt-2 text-sm sm:text-base"
                          onChange={(e) => {
                            onChange(f.name, `Otro: ${e.target.value}`);
                          }}
                        />
                      )}
                    </AnimatePresence>
                    {getErrorMessage(f.name) && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-1 text-sm text-red-600 font-medium"
                      >
                        {getErrorMessage(f.name)}
                      </motion.p>
                    )}
                  </div>
                ) : (
                  <div>
                    <input 
                      className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-[3px] outline-none focus:ring-2 sm:focus:ring-4 transition-all text-sm sm:text-base ${
                        hasError(f.name) 
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-300 focus:border-miraBlue focus:ring-blue-200'
                      } ${q.readOnly ? 'bg-gradient-to-r from-gray-50 to-blue-50 cursor-not-allowed' : ''}`}
                      type={f.type === 'number' ? 'number' : f.type} 
                      required={isFieldRequired} 
                      value={watchValue && !Array.isArray(watchValue) && typeof watchValue === 'object' ? watchValue[f.name] || '' : ''}
                      onChange={(e) => onChange(f.name, e.target.value)} 
                    />
                    {getErrorMessage(f.name) && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-1 text-sm text-red-600 font-medium"
                      >
                        {getErrorMessage(f.name)}
                      </motion.p>
                    )}
                  </div>
                )}
              </motion.div>
            )})}
          </div>
        </div>
      </motion.div>
    )
  }

  if (q.type === 'radio' || q.type === 'checkbox') {
    const [showOtherInput, setShowOtherInput] = React.useState(false);
    const [otherValue, setOtherValue] = React.useState('');

    return (
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 relative"
      >
        
        <div className="mb-4 sm:mb-5 flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-miraBlue to-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg">
            {typeof q.id === 'number' ? q.id - 1 : '?'}
          </div>
          <p className="font-bold text-gray-800 text-base sm:text-lg leading-tight pt-0.5 sm:pt-1">{q.question}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 ml-0 sm:ml-9 md:ml-11">
          {q.options?.map((opt: string, index: number) => {
            const isSelected = q.type === 'radio' ? watchValue === opt : Array.isArray(watchValue) && watchValue.includes(opt);
            
            return (
              <motion.label 
                key={opt}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected 
                    ? 'bg-gradient-to-r from-miraBlue to-blue-600 border-miraBlue text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-white border-gray-200 hover:border-miraBlue text-gray-700 shadow-sm hover:shadow-md'
                }`}
              >
                
                {isSelected && (
                  <motion.div
                    layoutId={`selected-${q.id}`}
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                
                
                <div className="relative z-10 flex items-center">
                  <input
                    type={q.type}
                    name={String(q.id)}
                    value={opt}
                    className="sr-only"
                    checked={isSelected}
                    onChange={(e) => {
                      if (q.type === 'checkbox') {
                        const prev = Array.isArray(watchValue) ? watchValue : [];
                        if (e.target.checked) {
                          onChange(q.id as string, [...prev, opt]);
                          if (opt === 'Otro') setShowOtherInput(true);
                        } else {
                          onChange(q.id as string, prev.filter((x: string) => x !== opt && !x.startsWith('Otro:')));
                          if (opt === 'Otro') {
                            setShowOtherInput(false);
                            setOtherValue('');
                          }
                        }
                      } else {
                        onChange(q.id as string, opt);
                        setShowOtherInput(opt === 'Otro');
                        if (opt !== 'Otro') setOtherValue('');
                      }
                    }}
                  />
                  
                 
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    isSelected ? 'border-white bg-white/20' : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 12 12"
                      >
                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                      </motion.svg>
                    )}
                  </div>
                </div>
                
                <span className={`text-xs sm:text-sm font-semibold relative z-10 break-words ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                  {opt}
                </span>
                
               
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </motion.label>
            );
          })}
        </div>
        
       
        <AnimatePresence>
          {showOtherInput && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-3 sm:mt-4 ml-0 sm:ml-9 md:ml-11"
            >
              <input
                type="text"
                placeholder="Especifica tu respuesta..."
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-[3px] outline-none focus:ring-2 sm:focus:ring-4 transition-all text-sm sm:text-base"
                value={otherValue}
                onChange={(e) => {
                  setOtherValue(e.target.value);
                  if (q.type === 'checkbox') {
                    const prev = Array.isArray(watchValue) ? watchValue.filter(x => !x.startsWith('Otro:')) : [];
                    onChange(q.id as string, [...prev, `Otro: ${e.target.value}`]);
                  } else {
                    onChange(q.id as string, `Otro: ${e.target.value}`);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  if (q.type === 'textarea') {
    return (
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 relative group"
      >
        <div className="mb-3 flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-miraBlue to-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg">
            {typeof q.id === 'number' ? q.id - 1 : '?'}
          </div>
          <label className="font-bold text-gray-800 text-base sm:text-lg leading-tight pt-0.5 sm:pt-1">{q.question}</label>
        </div>
      <div className="ml-0 sm:ml-9 md:ml-11">
        <textarea 
          rows={4} 
          placeholder={q.placeholder || 'Escribe tu respuesta aquí...'} 
          className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-[3px] outline-none focus:ring-2 sm:focus:ring-4 transition-all text-sm sm:text-base resize-none ${
            hasError() 
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-300 focus:border-miraBlue focus:ring-blue-200'
          } ${q.readOnly ? 'bg-gradient-to-r from-gray-50 to-blue-50 cursor-not-allowed' : ''}`}
          value={typeof watchValue === 'string' ? watchValue : ''}
          onChange={(e) => onChange(q.id as string, e.target.value)} 
        />
        {getErrorMessage() && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1 text-sm text-red-600 font-medium"
          >
            {getErrorMessage()}
          </motion.p>
        )}
      </div>
      </motion.div>
    )
  }

  if (q.type === 'select' && q.dependsOn) {
    const neighborhoods = municipalityValue && neighborhoodsByMunicipality[municipalityValue]
      ? Object.keys(neighborhoodsByMunicipality[municipalityValue]).sort()
      : []

   
    const isRequired = typeof q.required === 'boolean' ? q.required : undefined;

    return (
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 relative group"
      >
        <div className="mb-3 flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-miraBlue to-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg">
            {typeof q.id === 'number' ? q.id - 1 : '📍'}
          </div>
          <label className="font-bold text-gray-800 text-base sm:text-lg leading-tight pt-0.5 sm:pt-1">{q.question}</label>
        </div>
        <div className="ml-0 sm:ml-9 md:ml-11">
          <select 
            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-[3px] outline-none focus:ring-2 sm:focus:ring-4 transition-all text-sm sm:text-base ${
              hasError() 
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:border-miraBlue focus:ring-blue-200'
            } ${q.readOnly ? 'bg-gradient-to-r from-gray-50 to-blue-50 cursor-not-allowed' : ''}`} 
            required={isRequired} 
            value={typeof watchValue === 'string' ? watchValue : ''}
            onChange={(e) => onChange(q.id as string, e.target.value)}
          >
            <option value="">Selecciona tu barrio...</option>
            {neighborhoods.map((n: string) => (<option key={n} value={n}>{n}</option>))}
          </select>
          {getErrorMessage() && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1 text-sm text-red-600 font-medium"
            >
              {getErrorMessage()}
            </motion.p>
          )}
        </div>
      </motion.div>
    )
  }


  const isRequired = typeof q.required === 'boolean' ? q.required : undefined;
  
  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="mb-6 relative group"
    >
      <div className="mb-3 flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-miraBlue to-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg">
          {typeof q.id === 'number' ? q.id - 1 : '?'}
        </div>
        <label className="font-bold text-gray-800 text-base sm:text-lg leading-tight pt-0.5 sm:pt-1">{q.question}</label>
      </div>
      <div className="ml-0 sm:ml-9 md:ml-11">
        <input
          type={q.type === 'date' ? 'date' : 'text'}
          placeholder={q.placeholder || 'Tu respuesta...'}
          required={isRequired}    
          readOnly={q.readOnly}
          value={typeof watchValue === 'string' ? watchValue : ''}
          className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-[3px] outline-none focus:ring-2 sm:focus:ring-4 transition-all text-sm sm:text-base ${
            hasError() 
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-300 focus:border-miraBlue focus:ring-blue-200'
          } ${q.readOnly ? 'bg-gradient-to-r from-gray-50 to-blue-50 cursor-not-allowed' : ''}`}
          onChange={(e) => !q.readOnly && onChange(q.id as string, e.target.value)}
        />
        {getErrorMessage() && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1 text-sm text-red-600 font-medium"
          >
            {getErrorMessage()}
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}