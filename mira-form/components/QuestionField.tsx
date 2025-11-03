'use client'
import React from 'react'

import { Question, neighborhoodsByMunicipality } from '@/data/questions'

type FormValues = { [key: string]: string };

interface QuestionFieldProps {
  q: Question;
  watchValue?: string | string[] | FormValues;
  onChange: (key: string, value: string | string[] | FormValues) => void;
  municipalityValue?: string;
}

export default function QuestionField({ q, watchValue, onChange, municipalityValue }: QuestionFieldProps) {
  if (q.type === 'group') {
    return (
      <div className="mb-4">
        <p className="font-semibold text-miraBlue mb-2">{q.question}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {q.fields?.map((f: any) => (
            <div key={f.name}>
              <label className="block text-sm mb-1">{f.label}</label>
              {f.type === 'select' ? (
                <div>
                  <select 
                    className="border rounded-lg p-2 w-full" 
                    required={f.required} 
                    value={watchValue && !Array.isArray(watchValue) && typeof watchValue === 'object' ? watchValue[f.name] || '' : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'Otro') {
                       
                        onChange(f.name, value);
                      } else {
                        onChange(f.name, value);
                      }
                    }}
                  >
                    <option value="">Selecciona...</option>
                    {f.options?.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                  {watchValue && !Array.isArray(watchValue) && typeof watchValue === 'object' && watchValue[f.name] === 'Otro' && (
                    <input
                      type="text"
                      placeholder="Especifica el tipo de documento"
                      className="border rounded-lg p-2 w-full mt-2"
                      onChange={(e) => {
                        onChange(f.name, `Otro: ${e.target.value}`);
                      }}
                    />
                  )}
                </div>
              ) : (
                <input 
                  className="border rounded-lg p-2 w-full" 
                  type={f.type === 'number' ? 'number' : f.type} 
                  required={f.required}
                  value={watchValue && !Array.isArray(watchValue) && typeof watchValue === 'object' ? watchValue[f.name] || '' : ''}
                  onChange={(e) => onChange(f.name, e.target.value)} 
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (q.type === 'radio' || q.type === 'checkbox') {
    const [showOtherInput, setShowOtherInput] = React.useState(false);
    const [otherValue, setOtherValue] = React.useState('');

    return (
      <div className="mb-6">
        <p className="font-semibold text-gray-800 mb-4 text-base">{q.question}</p>
        <div className="flex flex-wrap gap-3">
          {q.options?.map((opt: string) => (
            <label key={opt} className="group relative flex items-center gap-3 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 px-5 py-3.5 rounded-xl border-2 border-gray-200 hover:border-miraBlue transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
              <input
                type={q.type}
                name={String(q.id)}
                value={opt}
                className="text-miraBlue focus:ring-miraBlue"
                checked={q.type === 'radio' ? watchValue === opt : Array.isArray(watchValue) && watchValue.includes(opt)}
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
              <span className="text-sm font-medium text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
        {showOtherInput && (
          <div className="mt-2">
            <input
              type="text"
              placeholder="Especifica tu respuesta"
              className="border rounded-lg p-2 w-full md:w-1/2"
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
          </div>
        )}
      </div>
    )
  }

  if (q.type === 'textarea') {
    return (
      <div className="mb-4">
        <label className="font-semibold text-miraBlue block mb-1">{q.question}</label>
        <textarea rows={4} placeholder={q.placeholder || ''} className="border rounded-lg p-2 w-full" onChange={(e) => onChange(q.id as string, e.target.value)} />
      </div>
    )
  }

  if (q.type === 'select' && q.dependsOn) {
    const neighborhoods = municipalityValue && neighborhoodsByMunicipality[municipalityValue]
      ? Object.keys(neighborhoodsByMunicipality[municipalityValue]).sort()
      : []

    return (
      <div className="mb-4">
        <label className="font-semibold text-miraBlue block mb-1">{q.question}</label>
        <select
          className="border rounded-lg p-2 w-full"
          required={q.required}
          value={typeof watchValue === 'string' ? watchValue : ''}
          onChange={(e) => onChange(q.id as string, e.target.value)}
          disabled={!municipalityValue || neighborhoods.length === 0}
        >
          <option value="">{municipalityValue ? 'Selecciona tu barrio...' : 'Primero selecciona un municipio'}</option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
          ))}
          <option value="Otro">Otro</option>
        </select>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <label className="font-semibold text-miraBlue block mb-1">{q.question}</label>
      <input
        type={q.type === 'date' ? 'date' : 'text'}
        placeholder={q.placeholder || ''}
        required={q.required}
        readOnly={q.readOnly}
        value={typeof watchValue === 'string' ? watchValue : ''}
        className={`border rounded-lg p-2 w-full ${q.readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        onChange={(e) => !q.readOnly && onChange(q.id as string, e.target.value)}
      />
    </div>
  )
}
