import { useState } from 'react'
import type { Recommendation } from '@/lib/recommendations'

interface RecommendationCardProps {
  recommendation: Recommendation
  /** Compact mode for dashboard pinned card */
  compact?: boolean
  /** Label shown above the card */
  label?: string
}

export default function RecommendationCard({
  recommendation,
  compact = false,
  label,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false)

  if (compact) {
    return (
      <div className="mb-4">
        {label && (
          <p className="mb-2 text-xs font-medium text-text-secondary">{label}</p>
        )}
        <div
          className="rounded-[16px] bg-surface border-l-4 border-primary p-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded)
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{recommendation.emoji}</span>
            <span className="text-sm font-semibold text-text-primary">
              {recommendation.headline}
            </span>
          </div>
          {expanded && (
            <p className="mt-2 text-xs text-text-secondary">
              {recommendation.context}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-[16px] bg-surface border-l-4 border-primary p-4 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded)
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{recommendation.emoji}</span>
        <span className="text-base font-bold text-text-primary">
          {recommendation.headline}
        </span>
      </div>
      {expanded && (
        <p className="mt-3 text-sm text-text-secondary">
          {recommendation.context}
        </p>
      )}
    </div>
  )
}
