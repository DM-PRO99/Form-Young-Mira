import { forwardRef, useId } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'

export const controlClass = cn(
  'w-full h-10 px-3.5 text-[13.5px] text-ink bg-white border border-border-input rounded-field outline-none',
  'placeholder:text-ink-faint transition-[border-color,box-shadow] duration-150',
  'focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16]',
  'disabled:bg-canvas disabled:text-ink-muted'
)

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={cn(controlClass, className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(controlClass, 'h-auto py-2.5 resize-none', className)} {...props} />
  }
)

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <div className={cn('relative', className)}>
      <select ref={ref} className={cn(controlClass, 'appearance-none pr-9 cursor-pointer')} {...props}>
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" strokeWidth={1.8} />
    </div>
  )
})

export function SearchInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" strokeWidth={1.8} />
      <input type="search" className={cn(controlClass, 'pl-10')} {...props} />
    </div>
  )
}

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  children: (id: string) => React.ReactNode
}) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-medium text-ink mb-1.5">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="text-[12px] text-danger mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-faint mt-1.5">{hint}</p>
      ) : null}
    </div>
  )
}
