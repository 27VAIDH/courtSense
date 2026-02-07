import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatches, usePlayers } from '@/db/hooks'
import type { Match, Player } from '@/db/types'
import Button from '@/components/ui/Button'
import WinLossRiver from '@/components/timeline/WinLossRiver'
import RollingWinRate from '@/components/timeline/RollingWinRate'

type TimeRange = '30d' | '3m' | '6m' | 'all'

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: '30d', label: 'Last 30 days' },
  { key: '3m', label: 'Last 3 months' },
  { key: '6m', label: 'Last 6 months' },
  { key: 'all', label: 'All time' },
]

function filterByTimeRange(matches: Match[], range: TimeRange): Match[] {
  if (range === 'all') return matches

  const now = new Date()
  let cutoff: Date
  switch (range) {
    case '30d':
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
      break
    case '3m':
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      break
    case '6m':
      cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      break
  }

  return matches.filter((m) => new Date(m.date).getTime() >= cutoff.getTime())
}

export default function Timeline() {
  const matches = useMatches()
  const players = usePlayers()
  const navigate = useNavigate()
  const [range, setRange] = useState<TimeRange>('all')

  const playersMap = useMemo(() => {
    if (!players) return new Map<number, Player>()
    const map = new Map<number, Player>()
    for (const p of players) {
      if (p.id !== undefined) map.set(p.id, p)
    }
    return map
  }, [players])

  const filteredMatches = useMemo(() => {
    if (!matches) return []
    return filterByTimeRange(matches, range)
  }, [matches, range])

  const isLoading = matches === undefined || players === undefined

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-surface mb-4" />
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 animate-pulse rounded-[20px] bg-surface" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-[16px] bg-surface" />
      </div>
    )
  }

  const hasMatches = matches.length > 0

  if (!hasMatches) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20 text-center">
        <span className="text-6xl mb-4">📈</span>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Your squash journey starts here
        </h1>
        <p className="text-text-secondary mb-8 max-w-[280px]">
          Log your first match to start seeing your timeline!
        </p>
        <Button onClick={() => navigate('/log')} className="w-full max-w-[280px]">
          Log First Match
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold text-text-primary mb-4">Timeline</h1>

      {/* Time range selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-hide">
        {TIME_RANGES.map((tr) => (
          <button
            key={tr.key}
            onClick={() => setRange(tr.key)}
            className={`min-h-[36px] whitespace-nowrap rounded-[20px] px-4 text-sm font-medium transition-colors ${
              range === tr.key
                ? 'bg-primary text-black'
                : 'border border-white/20 bg-transparent text-text-primary'
            }`}
          >
            {tr.label}
          </button>
        ))}
      </div>

      {/* Win/Loss River Chart */}
      <WinLossRiver matches={filteredMatches} playersMap={playersMap} />

      {/* Rolling Win Rate Chart */}
      <div className="mt-4">
        <RollingWinRate matches={filteredMatches} />
      </div>
    </div>
  )
}
