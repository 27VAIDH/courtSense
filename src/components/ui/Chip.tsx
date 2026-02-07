import type { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  className?: string
}

export default function Chip({ children, selected = false, onClick, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[48px] rounded-[20px] px-4 text-sm font-medium transition-colors ${
        selected
          ? 'bg-primary text-black'
          : 'border border-white/20 bg-transparent text-text-primary'
      } ${className}`}
    >
      {children}
    </button>
  )
}
