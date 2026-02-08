import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import type { RallyAnalysis } from '@/db/types'

interface BestShotTrendsProps {
  rallyAnalyses: RallyAnalysis[]
}

const MIN_ANALYSES = 5

const SHOT_EMOJIS: Record<string, string> = {
  'Forehand drive': '➡️',
  'Backhand drive': '⬅️',
  'Drop shot': '🎯',
  'Boast': '↩️',
  'Lob': '⬆️',
  'Serve': '🏸',
  'Volley': '⚡',
}

const SHOT_COLORS: Record<string, string> = {
  'Forehand drive': '#00E676', // primary green
  'Backhand drive': '#448AFF', // secondary blue
  'Drop shot': '#FFD600', // tight yellow
  'Boast': '#FF6D00', // accent orange
  'Lob': '#7C4DFF', // purple
  'Serve': '#FF5252', // loss red
  'Volley': '#00BFA5', // teal
}

export default function BestShotTrends({
  rallyAnalyses,
}: BestShotTrendsProps) {
  const stats = useMemo(() => {
    const shotCounts: Record<string, number> = {}

    for (const ra of rallyAnalyses) {
      if (ra.bestShots && Array.isArray(ra.bestShots)) {
        for (const shot of ra.bestShots) {
          shotCounts[shot] = (shotCounts[shot] || 0) + 1
        }
      }
    }

    const total = Object.values(shotCounts).reduce((sum, c) => sum + c, 0)

    const shotData = Object.entries(shotCounts)
      .map(([shot, count]) => ({
        name: shot,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate bubble sizes (min 40px, max 120px)
    const maxCount = shotData.length > 0 ? shotData[0].count : 1
    const shotDataWithSize = shotData.map((shot) => {
      const size = 40 + ((shot.count / maxCount) * 80)
      return { ...shot, size }
    })

    return { shotData: shotDataWithSize, total }
  }, [rallyAnalyses])

  // Locked state
  if (stats.total < MIN_ANALYSES) {
    const remaining = MIN_ANALYSES - rallyAnalyses.length

    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Your Best Shots
          </h3>
          <div className="flex items-center justify-center py-4">
            <div className="flex gap-2">
              <div className="w-12 h-12 rounded-full bg-surface-elevated" />
              <div className="w-10 h-10 rounded-full bg-surface-elevated" />
              <div className="w-8 h-8 rounded-full bg-surface-elevated" />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            Add rally analysis to {remaining} more match{remaining !== 1 ? 'es' : ''} to unlock
          </p>
        </div>
      </Card>
    )
  }

  if (stats.shotData.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Your Best Shots
        </h3>
        <p className="text-xs text-text-secondary text-center py-4">
          No best shots recorded yet
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Your Best Shots
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-3 py-2">
        {stats.shotData.map((shot) => (
          <div
            key={shot.name}
            className="flex flex-col items-center justify-center rounded-full relative transition-transform hover:scale-105"
            style={{
              width: `${shot.size}px`,
              height: `${shot.size}px`,
              backgroundColor: SHOT_COLORS[shot.name] || '#B0B0B0',
              opacity: 0.85,
            }}
          >
            {/* Emoji */}
            <span
              className="text-center"
              style={{ fontSize: `${shot.size * 0.35}px` }}
            >
              {SHOT_EMOJIS[shot.name] || '🎾'}
            </span>
            {/* Count */}
            <span
              className="font-bold text-bg"
              style={{ fontSize: `${shot.size * 0.25}px` }}
            >
              {shot.count}
            </span>
          </div>
        ))}
      </div>
      {/* Legend below bubbles */}
      <div className="mt-3 pt-3 border-t border-surface-elevated space-y-1">
        {stats.shotData.slice(0, 3).map((shot) => (
          <div key={shot.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: SHOT_COLORS[shot.name] || '#B0B0B0' }}
              />
              <span className="text-xs text-text-secondary">{shot.name}</span>
            </div>
            <span className="text-xs font-semibold text-text-primary">
              {shot.percentage}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
