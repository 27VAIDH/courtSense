import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const base = 'min-h-[48px] rounded-[12px] px-6 font-semibold transition-opacity active:opacity-80 disabled:opacity-40'
  const variants = {
    primary: 'bg-primary text-black',
    secondary: 'bg-surface text-text-primary',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
