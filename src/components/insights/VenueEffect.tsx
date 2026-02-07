import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import type { Match, Venue } from '@/db/types'

interface VenueEffectProps {
  matches: Match[]
  venues: Venue[]
}

interface VenueStat {
  venueId: number
  name: string
  isHome: boolean
  wins: number
  losses: number
  total: number
  winRate: number
}

const MIN_TOTAL_MATCHES = 5
const MIN_VENUES = 2

function CircularProgress({
  percentage,
  color,
  size = 64,
  strokeWidth = 5,
}: {
  percentage: number
  color: string
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#242424"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      {/* Percentage text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.22}
        fontWeight="bold"
      >
        {percentage}%
      </text>
    </svg>
  )
}

export default function VenueEffect({ matches, venues }: VenueEffectProps) {
  const venueStats = useMemo(() => {
    const statsMap = new Map<number, { wins: number; losses: number }>()

    for (const m of matches) {
      if (!statsMap.has(m.venueId)) {
        statsMap.set(m.venueId, { wins: 0, losses: 0 })
      }
      const s = statsMap.get(m.venueId)!
      if (m.result.startsWith('W')) s.wins++
      else s.losses++
    }

    const venueMap = new Map<number, Venue>()
    for (const v of venues) {
      if (v.id !== undefined) venueMap.set(v.id, v)
    }

    const stats: VenueStat[] = []
    for (const [venueId, s] of statsMap) {
      const venue = venueMap.get(venueId)
      if (!venue) continue
      const total = s.wins + s.losses
      stats.push({
        venueId,
        name: venue.name,
        isHome: venue.isHome,
        wins: s.wins,
        losses: s.losses,
        total,
        winRate: total > 0 ? Math.round((s.wins / total) * 100) : 0,
      })
    }

    // Sort by total matches played descending
    stats.sort((a, b) => b.total - a.total)
    return stats
  }, [matches, venues])

  const uniqueVenues = venueStats.length

  // Locked state
  if (matches.length < MIN_TOTAL_MATCHES || uniqueVenues < MIN_VENUES) {
    const needMoreMatches = matches.length < MIN_TOTAL_MATCHES
    const remaining = needMoreMatches
      ? MIN_TOTAL_MATCHES - matches.length
      : MIN_VENUES - uniqueVenues

    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Venue Effect
          </h3>
          <div className="flex gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-elevated"
              >
                <div className="w-14 h-14 rounded-full bg-bg" />
                <div className="h-3 w-16 rounded bg-bg" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            {needMoreMatches
              ? `Log ${remaining} more match${remaining !== 1 ? 'es' : ''} to unlock`
              : `Play at ${remaining} more venue${remaining !== 1 ? 's' : ''} to unlock`}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Venue Effect
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {venueStats.map((v) => {
          const color = v.winRate > 50 ? '#00E676' : v.winRate === 50 ? '#FFD600' : '#FF5252'
          return (
            <div
              key={v.venueId}
              className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-elevated min-w-[120px]"
            >
              <CircularProgress percentage={v.winRate} color={color} />
              <div className="text-center">
                <p className="text-xs font-medium text-text-primary truncate max-w-[100px]">
                  {v.name}
                </p>
                {v.isHome && (
                  <span className="inline-block mt-0.5 text-[10px] font-semibold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    Home
                  </span>
                )}
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {v.wins}W - {v.losses}L
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
