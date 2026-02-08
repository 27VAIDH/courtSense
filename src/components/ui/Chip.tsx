import type { ReactNode } from 'react'
import { triggerLightHaptic } from '@/lib/haptics'

interface ChipProps {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  className?: string
  disableHaptic?: boolean
}

export default function Chip({
  children,
  selected = false,
  onClick,
  className = '',
  disableHaptic = false,
}: ChipProps) {
  function handleClick() {
    if (!disableHaptic) {
      triggerLightHaptic()
    }
    onClick?.()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
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
