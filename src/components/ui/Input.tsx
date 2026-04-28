import { InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full max-w-full rounded-lg border px-3 py-2 text-base text-slate-900 dark:text-zinc-100
            placeholder-slate-400 dark:placeholder-zinc-500
            bg-white dark:bg-zinc-800
            border-slate-300 dark:border-zinc-600
            focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:focus:ring-brand-900
            outline-none transition-shadow
            disabled:bg-slate-50 dark:disabled:bg-zinc-900 disabled:text-slate-400
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}
            ${className}
          `}
          {...rest}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
