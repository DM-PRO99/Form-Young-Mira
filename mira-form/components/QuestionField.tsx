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
}

export default function QuestionField({ q, watchValue, onChange, municipalityValue }: QuestionFieldProps) {
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
        <div className="relative bg-gradient-to-br from-white/90 via-blue-50/50 to-indigo-50/50 backdrop-blur-xl p-6 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
          {/* Efecto de brillo animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Decoración de esquina */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-miraBlue/10 to-transparent rounded-bl-full"></div>
          
          <p className="font-bold text-lg text-miraBlue mb-4 relative z-10 flex items-center gap-2">
            <span className="w-2 h-2 bg-miraBlue rounded-full animate-pulse"></span>
            {q.question}
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 relative z-10">
            {q.fields?.map((f: any, index: number) => (
              <motion.div 
                key={f.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <label className="block text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gradient-to-r from-miraBlue to-blue-400 rounded-full"></span>
                  {f.label}
                </label>
                {f.type === 'select' ? (
                  <div>
                    <select 
                      className="modern-input w-full" 
                      required={f.required} 
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
                          className="modern-input w-full mt-2"
                          onChange={(e) => {
                            onChange(f.name, `Otro: ${e.target.value}`);
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <input 
                    className="modern-input w-full" 
                    type={f.type === 'number' ? 'number' : f.type} 
                    required={f.required}
                    value={watchValue && !Array.isArray(watchValue) && typeof watchValue === 'object' ? watchValue[f.name] || '' : ''}
                    onChange={(e) => onChange(f.name, e.target.value)} 
                  />
                )}
              </motion.div>
            ))}
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
        {/* Pregunta con diseño mejorado */}
        <div className="mb-5 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-miraBlue to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {typeof q.id === 'number' ? q.id : '?'}
          </div>
          <p className="font-bold text-gray-800 text-lg leading-tight pt-1">{q.question}</p>
        </div>
        
        {/* Opciones con diseño moderno tipo chip */}
        <div className="flex flex-wrap gap-3 ml-11">
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
                className={`group relative flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isSelected 
                    ? 'bg-gradient-to-r from-miraBlue to-blue-600 border-miraBlue text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-white border-gray-200 hover:border-miraBlue text-gray-700 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Efecto de resplandor al seleccionar */}
                {isSelected && (
                  <motion.div
                    layoutId={`selected-${q.id}`}
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                
                {/* Checkbox/Radio personalizado */}
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
                  
                  {/* Icono visual del checkbox/radio */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-white bg-white/20' : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 12 12"
                      >
                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                      </motion.svg>
                    )}
                  </div>
                </div>
                
                <span className={`text-sm font-semibold relative z-10 ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                  {opt}
                </span>
                
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </motion.label>
            );
          })}
        </div>
        
        {/* Input "Otro" con animación */}
        <AnimatePresence>
          {showOtherInput && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-4 ml-11"
            >
              <input
                type="text"
                placeholder="✨ Especifica tu respuesta..."
                className="modern-input w-full md:w-2/3"
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
        <div className="mb-3 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-miraBlue to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {typeof q.id === 'number' ? q.id : '?'}
          </div>
          <label className="font-bold text-gray-800 text-lg leading-tight pt-1">{q.question}</label>
        </div>
        <div className="ml-11">
          <textarea 
            rows={4} 
            placeholder={q.placeholder || '✍️ Escribe tu respuesta aquí...'} 
            className="modern-input w-full resize-y min-h-[100px]" 
            onChange={(e) => onChange(q.id as string, e.target.value)} 
          />
        </div>
      </motion.div>
    )
  }

  if (q.type === 'select' && q.dependsOn) {
    const neighborhoods = municipalityValue && neighborhoodsByMunicipality[municipalityValue]
      ? Object.keys(neighborhoodsByMunicipality[municipalityValue]).sort()
      : []

    return (
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="mb-6 relative group"
      >
        <div className="mb-3 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-miraBlue to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {typeof q.id === 'number' ? q.id : '📍'}
          </div>
          <label className="font-bold text-gray-800 text-lg leading-tight pt-1">{q.question}</label>
        </div>
        <div className="ml-11">
          <select className="modern-input w-full" onChange={(e) => onChange(q.id as string, e.target.value)}>
            <option value="">Selecciona tu barrio...</option>
            {neighborhoods.map((n: string) => (<option key={n} value={n}>{n}</option>))}
          </select>
        </div>
      </motion.div>
    )
  }

  // Text, Date y otros inputs
  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="mb-6 relative group"
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-miraBlue to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {typeof q.id === 'number' ? q.id : '?'}
        </div>
        <label className="font-bold text-gray-800 text-lg leading-tight pt-1">{q.question}</label>
      </div>
      <div className="ml-11">
        <input
          type={q.type === 'date' ? 'date' : 'text'}
          placeholder={q.placeholder || '📝 Tu respuesta...'}
          required={q.required}
          readOnly={q.readOnly}
          value={typeof watchValue === 'string' ? watchValue : ''}
          className={`modern-input w-full ${q.readOnly ? 'bg-gradient-to-r from-gray-50 to-blue-50 cursor-not-allowed' : ''}`}
          onChange={(e) => !q.readOnly && onChange(q.id as string, e.target.value)}
        />
      </div>
    </motion.div>
  )
}
