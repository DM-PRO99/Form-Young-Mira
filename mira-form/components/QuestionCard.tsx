'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function isOtroValue(v: string): boolean {
  return v === 'Otro' || v.startsWith('Otro:')
}

function otroText(v: string): string {
  return v.startsWith('Otro:') ? v.slice('Otro:'.length).trim() : ''
}

// ─── Opciones (radio de selección única o checkbox de selección múltiple) ──

interface OpcionesCardProps {
  options: string[]
  multi: boolean
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
}

export function OpcionesCard({ options, multi, value, onChange }: OpcionesCardProps) {
  const selectedList: string[] = multi
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string' && value
      ? [value]
      : []

  const otroSelected = selectedList.some(isOtroValue)
  const otroCurrentText = selectedList.find(isOtroValue) ? otroText(selectedList.find(isOtroValue)!) : ''

  function toggle(opt: string) {
    if (multi) {
      const prev = Array.isArray(value) ? value : []
      const already = prev.some((v) => (opt === 'Otro' ? isOtroValue(v) : v === opt))
      if (already) {
        onChange(prev.filter((v) => (opt === 'Otro' ? !isOtroValue(v) : v !== opt)))
      } else {
        onChange([...prev, opt])
      }
    } else {
      onChange(opt)
    }
  }

  function isChecked(opt: string): boolean {
    if (opt === 'Otro') return otroSelected
    return selectedList.includes(opt)
  }

  function handleOtroText(text: string) {
    const next = `Otro: ${text}`
    if (multi) {
      const prev = Array.isArray(value) ? value.filter((v) => !isOtroValue(v)) : []
      onChange([...prev, next])
    } else {
      onChange(next)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          const checked = isChecked(opt)
          return (
            <label
              key={opt}
              className="wizard-option flex items-center gap-3.5 cursor-pointer"
              style={{
                padding: '18px 20px',
                borderRadius: '14px',
                backgroundColor: checked ? '#EEF2FE' : '#FBFCFF',
                border: `1.5px solid ${checked ? '#1E56E8' : '#DDE3F3'}`,
              }}
            >
              <input
                type={multi ? 'checkbox' : 'radio'}
                className="sr-only"
                checked={checked}
                onChange={() => toggle(opt)}
              />
              <span
                className="flex items-center justify-center flex-shrink-0 font-extrabold"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '9px',
                  fontSize: '12.5px',
                  backgroundColor: checked ? '#1E56E8' : '#EEF2FE',
                  color: checked ? '#FFFFFF' : '#5C6784',
                }}
              >
                {LETTERS[i] ?? i + 1}
              </span>
              <span
                className="text-base"
                style={{ fontWeight: checked ? 600 : 500, color: checked ? '#0A2472' : '#37456B' }}
              >
                {opt}
              </span>
            </label>
          )
        })}
      </div>

      <AnimatePresence>
        {otroSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Especifica tu respuesta..."
              defaultValue={otroCurrentText}
              onChange={(e) => handleOtroText(e.target.value)}
              className="wizard-input w-full text-base"
              style={{
                height: '54px',
                borderRadius: '14px',
                border: '1.5px solid #DDE3F3',
                backgroundColor: '#FBFCFF',
                color: '#0A2472',
                padding: '0 16px',
                boxSizing: 'border-box',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Campo (un input dentro de la rejilla de "campos") ─────────────────────

interface CampoFieldProps {
  label: string
  type: 'text' | 'date' | 'number' | 'textarea' | 'select' | 'select-search' | 'readonly'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  options?: string[]
  municipalityValue?: string
  neighborhoods?: Record<string, Record<string, string>>
  error?: string
}

function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      style={{ color: '#8C97B4' }}
    >
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const fieldBaseStyle: React.CSSProperties = {
  height: '54px',
  borderRadius: '14px',
  border: '1.5px solid #DDE3F3',
  backgroundColor: '#FBFCFF',
  color: '#0A2472',
  boxSizing: 'border-box',
}

export function CampoField({
  label,
  type,
  value,
  onChange,
  placeholder,
  options,
  municipalityValue,
  neighborhoods,
  error,
}: CampoFieldProps) {
  const safeValue = typeof value === 'string' ? value : ''
  const [searchTerm, setSearchTerm] = React.useState(safeValue)
  const [showDropdown, setShowDropdown] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const wrapRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setSearchTerm(safeValue)
  }, [safeValue])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setSearchTerm(safeValue)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [safeValue])

  const neighborhoodList =
    type === 'select-search' && municipalityValue && neighborhoods?.[municipalityValue]
      ? Object.keys(neighborhoods[municipalityValue]).sort()
      : []

  const filteredNeighborhoods = React.useMemo(() => {
    if (!searchTerm.trim()) return neighborhoodList
    const term = searchTerm.toLowerCase().trim()
    return neighborhoodList.filter((n) => n.toLowerCase().includes(term))
  }, [searchTerm, neighborhoodList])

  return (
    <div>
      <label className="block mb-2" style={{ fontSize: '14px', fontWeight: 600, color: '#22304F' }}>
        {label}
      </label>

      {type === 'readonly' ? (
        <input
          type="text"
          value={safeValue}
          readOnly
          placeholder="Se completa automáticamente"
          className="w-full text-base px-4 cursor-not-allowed"
          style={{ ...fieldBaseStyle, backgroundColor: '#F0F3FB', color: '#7A85A3' }}
        />
      ) : type === 'textarea' ? (
        <textarea
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="wizard-input w-full text-base px-4 py-3 resize-none"
          style={{ borderRadius: '14px', border: '1.5px solid #DDE3F3', backgroundColor: '#FBFCFF', color: '#0A2472', boxSizing: 'border-box' }}
        />
      ) : type === 'select' ? (
        <div className="relative">
          <select
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            className="wizard-input w-full appearance-none text-base pl-4 pr-10"
            style={fieldBaseStyle}
          >
            <option value="">Selecciona...</option>
            {options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown />
          {isOtroValue(safeValue) && (
            <input
              type="text"
              placeholder="Especifica"
              defaultValue={otroText(safeValue)}
              onChange={(e) => onChange(`Otro: ${e.target.value}`)}
              className="wizard-input w-full text-base px-4 mt-2"
              style={fieldBaseStyle}
            />
          )}
        </div>
      ) : type === 'select-search' ? (
        <div className="relative" ref={wrapRef}>
          <input
            ref={inputRef}
            type="text"
            placeholder={municipalityValue ? 'Busca y selecciona tu barrio...' : 'Primero selecciona un municipio'}
            value={searchTerm}
            disabled={!municipalityValue}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
              if (neighborhoodList.includes(e.target.value)) onChange(e.target.value)
              else if (e.target.value === '') onChange('')
            }}
            className="wizard-input w-full text-base px-4 disabled:opacity-60 disabled:cursor-not-allowed"
            style={fieldBaseStyle}
          />
          <ChevronDown />
          <AnimatePresence>
            {showDropdown && filteredNeighborhoods.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="absolute z-30 w-full mt-1.5 overflow-y-auto"
                style={{
                  maxHeight: '220px',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #DDE3F3',
                  borderRadius: '14px',
                  boxShadow: '0 12px 28px rgba(10,36,114,0.14)',
                }}
              >
                {filteredNeighborhoods.map((n) => (
                  <div
                    key={n}
                    onClick={() => {
                      onChange(n)
                      setSearchTerm(n)
                      setShowDropdown(false)
                      inputRef.current?.blur()
                    }}
                    className="cursor-pointer text-base"
                    style={{
                      padding: '12px 16px',
                      color: n === safeValue ? '#FFFFFF' : '#37456B',
                      backgroundColor: n === safeValue ? '#1E56E8' : 'transparent',
                    }}
                  >
                    {n}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <input
          type={type === 'date' ? 'date' : type === 'number' ? 'text' : 'text'}
          inputMode={type === 'number' ? 'numeric' : undefined}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="wizard-input w-full text-base px-4"
          style={fieldBaseStyle}
        />
      )}

      {error && (
        <p className="mt-1.5 text-sm" style={{ color: '#D9455F' }}>
          {error}
        </p>
      )}
    </div>
  )
}
