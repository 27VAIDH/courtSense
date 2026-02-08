import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { triggerLightHaptic } from '@/lib/haptics'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: ReactNode
  disableHaptic?: boolean
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  onClick,
  disableHaptic = false,
  ...props
}: ButtonProps) {
  const base = 'min-h-[48px] rounded-[12px] px-6 font-semibold transition-opacity active:opacity-80 disabled:opacity-40'
  const variants = {
    primary: 'bg-primary text-black',
    secondary: 'bg-surface text-text-primary',
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!disableHaptic) {
      triggerLightHaptic()
    }
    onClick?.(e)
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} onClick={handleClick} {...props}>
      {children}
    </button>
  )
}
