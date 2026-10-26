'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmOptions {
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
  }, [])

  const handleCancel = useCallback(() => close(false), [close])
  const tone = options?.tone ?? 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onClose={handleCancel}
        size="sm"
        title={
          <span className="flex items-center gap-2.5">
            {tone === 'danger' && (
              <span className="w-8 h-8 rounded-full bg-danger-tint flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-danger" strokeWidth={1.8} />
              </span>
            )}
            {options?.title}
          </span>
        }
        description={options?.description}
        footer={
          <>
            <Button variant="secondary" onClick={handleCancel}>
              {options?.cancelLabel ?? 'Cancelar'}
            </Button>
            <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => close(true)}>
              {options?.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>')
  return confirm
}
