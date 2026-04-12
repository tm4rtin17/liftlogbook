import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 dark:disabled:bg-brand-900',
  secondary:
    'bg-white dark:bg-zinc-800 text-brand-700 dark:text-brand-400 border border-brand-300 dark:border-brand-700 hover:bg-brand-50 dark:hover:bg-zinc-700 active:bg-brand-100 disabled:opacity-50',
  ghost:
    'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 dark:active:bg-zinc-700 disabled:opacity-40',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', fullWidth, className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-colors duration-100 focus:outline-none focus-visible:ring-2
        focus-visible:ring-brand-500 focus-visible:ring-offset-1
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  )
)

Button.displayName = 'Button'
