'use client'

import { useActionState, useTransition, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  Loader2,
} from 'lucide-react'
import { loginAction } from './actions'

export default function LoginPage() {
  const [error, formAction] = useActionState(loginAction, null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(formData: FormData) {
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <div className="min-h-screen bg-miraBlue/90 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden bg-white"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-miraBlue via-blue-600 to-indigo-600 p-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-[19px] font-semibold text-white mb-1"
          >
            Panel administrativo
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="text-[13px] text-blue-200"
          >
            Encuesta Juventudes MIRA
          </motion.p>
        </div>

        {/* Body */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          action={handleSubmit}
          className="p-8 space-y-5"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-red-600 flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 mb-1.5"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 mb-1.5"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isPending}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isPending}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20 rounded"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#14286E] hover:bg-[#1E3A9E] text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed transition-[background-color,transform] duration-[140ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Iniciar sesión
              </>
            )}
          </button>
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="border-t border-zinc-100 px-8 py-4 text-center"
        >
          <p className="text-xs text-zinc-400">
            <Lock className="w-3.5 h-3.5 inline mr-1" />
            Acceso restringido a coordinadores y administradores
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
