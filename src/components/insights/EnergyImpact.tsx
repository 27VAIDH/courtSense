import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import type { Match } from '@/db/types'

interface EnergyImpactProps {
  matches: Match[]
}

interface EnergyStats {
  level: 'Low' | 'Medium' | 'High'
  emoji: string
  wins: number
  losses: number
  total: number
  winRate: number
}

const MIN_TOTAL_MATCHES = 5
const MIN_TAGGED_MATCHES = 3

const ENERGY_CONFIG: { level: 'Low' | 'Medium' | 'High'; emoji: string }[] = [
  { level: 'Low', emoji: '🪫' },
  { level: 'Medium', emoji: '⚡' },
  { level: 'High', emoji: '🔥' },
]

export default function EnergyImpact({ matches }: EnergyImpactProps) {
  const { data, taggedCount } = useMemo(() => {
    const statsMap: Record<string, { wins: number; losses: number }> = {
      Low: { wins: 0, losses: 0 },
      Medium: { wins: 0, losses: 0 },
      High: { wins: 0, losses: 0 },
    }

    let tagged = 0
    for (const m of matches) {
      if (m.energyLevel) {
        tagged++
        const isWin = m.result.startsWith('W')
        if (isWin) statsMap[m.energyLevel].wins++
        else statsMap[m.energyLevel].losses++
      }
    }

    const result: EnergyStats[] = ENERGY_CONFIG.map(({ level, emoji }) => {
      const s = statsMap[level]
      const total = s.wins + s.losses
      return {
        level,
        emoji,
        wins: s.wins,
        losses: s.losses,
        total,
        winRate: total > 0 ? Math.round((s.wins / total) * 100) : 0,
      }
    })

    return { data: result, taggedCount: tagged }
  }, [matches])

  // Locked state: not enough total matches or not enough tagged
  if (matches.length < MIN_TOTAL_MATCHES || taggedCount < MIN_TAGGED_MATCHES) {
    const needMore = matches.length < MIN_TOTAL_MATCHES
    const remaining = needMore
      ? MIN_TOTAL_MATCHES - matches.length
      : MIN_TAGGED_MATCHES - taggedCount

    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Energy Impact
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-16 rounded bg-surface-elevated" />
                <div className="flex-1 h-4 rounded bg-surface-elevated" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            {needMore
              ? `Log ${remaining} more match${remaining !== 1 ? 'es' : ''} to unlock`
              : `Tag energy on ${remaining} more match${remaining !== 1 ? 'es' : ''} to unlock`}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Energy Impact
      </h3>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.level} className="flex items-center gap-2">
            {/* Energy level label */}
            <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
              <span className="text-sm">{d.emoji}</span>
              <span className="text-xs text-text-primary">{d.level}</span>
            </div>
            {/* Bar */}
            <div className="flex-1 h-5 rounded bg-surface-elevated relative overflow-hidden">
              {d.total > 0 && (
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.max(d.winRate, 4)}%`,
                    backgroundColor:
                      d.winRate > 50
                        ? '#00E676'
                        : d.winRate === 50
                          ? '#FFD600'
                          : '#FF5252',
                    opacity: 0.7 + (d.winRate / 100) * 0.3,
                  }}
                />
              )}
            </div>
            {/* Win rate + sample size */}
            <div className="flex-shrink-0 w-24 text-right">
              {d.total > 0 ? (
                <>
                  <span
                    className="text-xs font-bold"
                    style={{
                      color:
                        d.winRate > 50
                          ? '#00E676'
                          : d.winRate === 50
                            ? '#FFD600'
                            : '#FF5252',
                    }}
                  >
                    {d.winRate}%
                  </span>
                  <span className="text-xs text-text-secondary ml-1">
                    ({d.total})
                  </span>
                </>
              ) : (
                <span className="text-xs text-text-secondary">No data</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
