import { Match } from '@/db/types'

interface BestMonthProps {
  matches: Match[]
}

export default function BestMonth({ matches }: BestMonthProps) {
  // Group matches by month
  const monthStats = new Map<
    string,
    { wins: number; total: number; month: string; year: number }
  >()

  matches.forEach((match) => {
    const date = new Date(match.date)
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
    const monthName = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()

    if (!monthStats.has(monthKey)) {
      monthStats.set(monthKey, { wins: 0, total: 0, month: monthName, year })
    }

    const stats = monthStats.get(monthKey)!
    stats.total++
    if (match.result.startsWith('W')) {
      stats.wins++
    }
  })

  // Find best month (highest win rate with at least 3 matches)
  let bestMonth = { month: '', year: 0, winRate: 0, wins: 0, total: 0 }

  monthStats.forEach((stats) => {
    if (stats.total >= 3) {
      const winRate = (stats.wins / stats.total) * 100
      if (winRate > bestMonth.winRate) {
        bestMonth = {
          month: stats.month,
          year: stats.year,
          winRate,
          wins: stats.wins,
          total: stats.total,
        }
      }
    }
  })

  if (!bestMonth.month) {
    // Not enough data - show most recent month
    const latest = Array.from(monthStats.values()).sort(
      (a, b) => b.year - a.year
    )[0]
    if (latest) {
      bestMonth = {
        month: latest.month,
        year: latest.year,
        winRate: (latest.wins / latest.total) * 100,
        wins: latest.wins,
        total: latest.total,
      }
    }
  }

  if (!bestMonth.month) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#4A00E0] to-[#8E2DE2] p-8">
        <div className="text-center text-text-secondary">
          No month data available
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#4A00E0] to-[#8E2DE2] p-8">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-4xl font-bold text-text-primary">
          Best Month
        </h2>
      </div>

      {/* Month name */}
      <div className="mb-4 text-center">
        <div className="text-6xl font-bold text-primary">{bestMonth.month}</div>
        <div className="mt-2 text-2xl text-text-secondary">{bestMonth.year}</div>
      </div>

      {/* Win Rate */}
      <div className="mb-8 rounded-2xl bg-surface/20 p-8 text-center backdrop-blur-sm">
        <div className="text-8xl font-bold text-text-primary">
          {bestMonth.winRate.toFixed(0)}%
        </div>
        <div className="mt-2 text-lg text-text-secondary">Win Rate</div>
      </div>

      {/* Matches Played */}
      <div className="rounded-2xl bg-surface/20 px-8 py-4 backdrop-blur-sm">
        <div className="text-center text-lg text-text-primary">
          {bestMonth.wins}W - {bestMonth.total - bestMonth.wins}L in{' '}
          {bestMonth.total} matches
        </div>
      </div>

      {/* Watermark */}
      <div className="mt-8 text-sm text-text-secondary opacity-50">
        SquashIQ
      </div>
    </div>
  )
}
