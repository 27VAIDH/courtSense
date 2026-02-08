import type { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  style?: CSSProperties
}

export default function Card({ children, className = '', onClick, style }: CardProps) {
  return (
    <div
      className={`rounded-[16px] bg-surface p-4 ${className}`}
      onClick={onClick}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      {children}
    </div>
  )
}
