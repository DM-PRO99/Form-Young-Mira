'use client'

import { useActionState, useTransition, useState } from 'react'
import { Mail, Lock, Info, LogIn, Loader2, AlertCircle } from 'lucide-react'
import { loginAction } from '@/app/admin/login/actions'

export default function CoordinadorLogin() {
  const [error, formAction] = useActionState(loginAction, null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(formData: FormData) {
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <div
      className="flex-1 flex items-center justify-center px-6 py-12 md:py-16"
      style={{ backgroundColor: '#F4F6FC' }}
    >
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mira-badge.png"
            alt="Mira"
            className="w-[68px] h-[68px] rounded-2xl object-cover flex-shrink-0"
          />
          <div className="leading-tight">
            <p className="text-sm font-extrabold tracking-wide" style={{ color: '#1E56E8' }}>
              JUVENTUDES MIRA
            </p>
            <p className="text-sm" style={{ color: '#7A85A3' }}>
              Panel interno de coordinadores
            </p>
          </div>
        </div>

        <h1
          className="font-extrabold mb-2"
          style={{ color: '#0A2472', fontSize: '26px', letterSpacing: '-0.01em' }}
        >
          Acceso coordinadores y administradores
        </h1>
        <p className="text-sm mb-8" style={{ color: '#5C6784' }}>
          Consulta resultados y gestiona la encuesta con tus credenciales.
        </p>

        <form action={handleSubmit} className="space-y-[26px]">
          {error && (
            <div
              className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
              style={{ color: '#D9455F', backgroundColor: '#FCE9ED' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold mb-2"
              style={{ color: '#0A2472' }}
            >
              Correo institucional
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                style={{ color: '#7A85A3' }}
                strokeWidth={1.8}
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                placeholder="nombre@mira.org"
                className="w-full pl-12 pr-4 text-sm outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  height: '56px',
                  borderRadius: '14px',
                  border: '1.5px solid #DDE3F3',
                  boxSizing: 'border-box',
                  color: '#0A2472',
                  backgroundColor: '#FFFFFF',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#1E56E8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#DDE3F3')}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-semibold" style={{ color: '#0A2472' }}>
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isPending}
                className="landing-toggle text-sm font-medium disabled:opacity-60"
                style={{ color: '#1E56E8' }}
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                style={{ color: '#7A85A3' }}
                strokeWidth={1.8}
              />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isPending}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 text-sm outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  height: '56px',
                  borderRadius: '14px',
                  border: '1.5px solid #DDE3F3',
                  boxSizing: 'border-box',
                  color: '#0A2472',
                  backgroundColor: '#FFFFFF',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#1E56E8')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#DDE3F3')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="landing-btn-primary w-full flex items-center justify-center gap-2 text-white text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0A2472, #1E56E8)',
              boxShadow: '0 12px 24px -8px rgba(30, 86, 232, 0.45)',
              boxSizing: 'border-box',
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" strokeWidth={1.8} />
                Iniciar sesión
              </>
            )}
          </button>
        </form>

        <div
          className="flex items-start gap-2.5 mt-[28px] px-4 py-3.5"
          style={{ backgroundColor: '#EEF2FE', borderRadius: '12px' }}
        >
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#1E56E8' }} strokeWidth={1.8} />
          <p className="text-sm" style={{ color: '#5C6784' }}>
            Este acceso es solo para personal autorizado. Si vienes a responder la encuesta, usa el
            formulario de la izquierda.
          </p>
        </div>
      </div>
    </div>
  )
}
