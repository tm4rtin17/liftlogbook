interface LogoProps {
  iconSize?: number
  stacked?: boolean
  className?: string
}

export function Logo({ iconSize = 32, stacked = false, className = '' }: LogoProps) {
  const isLarge = iconSize > 36

  return (
    <div
      className={`flex ${stacked ? 'flex-col items-center gap-2' : 'items-center gap-2.5'} ${className}`}
    >
      {/* Barbell icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Rounded square background */}
        <rect width="40" height="40" rx="10" fill="rgb(var(--brand-600))" />
        {/* Left outer plate */}
        <rect x="3.5" y="10.5" width="8" height="19" rx="2.5" fill="white" />
        {/* Left collar */}
        <rect x="12" y="14.5" width="4" height="11" rx="1.5" fill="white" fillOpacity="0.75" />
        {/* Bar */}
        <rect x="16" y="17.5" width="8" height="5" rx="2" fill="white" fillOpacity="0.6" />
        {/* Right collar */}
        <rect x="24" y="14.5" width="4" height="11" rx="1.5" fill="white" fillOpacity="0.75" />
        {/* Right outer plate */}
        <rect x="28.5" y="10.5" width="8" height="19" rx="2.5" fill="white" />
      </svg>

      <div className={stacked ? 'text-center' : ''}>
        <p className={`font-bold text-brand-700 dark:text-brand-400 leading-tight ${isLarge ? 'text-2xl' : 'text-xl'}`}>
          LiftLogbook
        </p>
        <p className={`text-slate-400 dark:text-zinc-500 ${isLarge ? 'text-sm mt-0.5' : 'text-xs'}`}>
          Track your progress
        </p>
      </div>
    </div>
  )
}
