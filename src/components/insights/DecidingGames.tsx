import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import Card from '@/components/ui/Card'
import type { Match, Game } from '@/db/types'

interface DecidingGamesProps {
  matches: Match[]
  games: Game[]
}

const MIN_DECIDING_GAMES = 8

export default function DecidingGames({ matches, games }: DecidingGamesProps) {
  const stats = useMemo(() => {
    // Build a map of matchId -> games
    const gamesByMatch = new Map<number, Game[]>()
    for (const g of games) {
      const arr = gamesByMatch.get(g.matchId) || []
      arr.push(g)
      gamesByMatch.set(g.matchId, arr)
    }

    let decidingWins = 0
    let decidingLosses = 0
    // Track last 5 deciding games for trend
    const recentDeciding: boolean[] = []

    // Sort matches by date ascending for trend calculation
    const sorted = [...matches].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    for (const m of sorted) {
      if (m.id === undefined) continue
      const matchGames = gamesByMatch.get(m.id)
      if (!matchGames) continue

      const decidingGameNumber = m.format === 'Bo5' ? 5 : 3
      const decidingGame = matchGames.find(
        (g) => g.gameNumber === decidingGameNumber
      )

      // Only count if the deciding game was actually played (has scores)
      if (!decidingGame || (decidingGame.myScore === 0 && decidingGame.opponentScore === 0)) continue

      const won = decidingGame.myScore > decidingGame.opponentScore
      if (won) decidingWins++
      else decidingLosses++
      recentDeciding.push(won)
    }

    const total = decidingWins + decidingLosses
    const winRate = total > 0 ? Math.round((decidingWins / total) * 100) : 0

    // Last 5 deciding games win rate for trend
    const last5 = recentDeciding.slice(-5)
    const last5WinRate =
      last5.length > 0
        ? Math.round((last5.filter(Boolean).length / last5.length) * 100)
        : 0

    let trend: 'up' | 'down' | 'flat' = 'flat'
    if (last5.length >= 3) {
      if (last5WinRate > winRate) trend = 'up'
      else if (last5WinRate < winRate) trend = 'down'
    }

    return { decidingWins, decidingLosses, total, winRate, trend }
  }, [matches, games])

  // Locked state
  if (stats.total < MIN_DECIDING_GAMES) {
    const remaining = MIN_DECIDING_GAMES - stats.total

    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Deciding Games
          </h3>
          <div className="flex items-center justify-center py-4">
            <div className="w-20 h-20 rounded-full bg-surface-elevated" />
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            {stats.total === 0
              ? `Play ${remaining} deciding game${remaining !== 1 ? 's' : ''} to unlock`
              : `${remaining} more deciding game${remaining !== 1 ? 's' : ''} to unlock`}
          </p>
        </div>
      </Card>
    )
  }

  const chartData = [
    { name: 'Wins', value: stats.decidingWins },
    { name: 'Losses', value: stats.decidingLosses },
  ]
  const COLORS = ['#00E676', '#FF5252']

  const trendArrow =
    stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '→'
  const trendColor =
    stats.trend === 'up'
      ? 'text-win'
      : stats.trend === 'down'
        ? 'text-loss'
        : 'text-text-secondary'

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Deciding Games
      </h3>
      <div className="flex items-center gap-4">
        {/* Donut chart */}
        <div className="w-24 h-24 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={42}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-lg font-bold"
              style={{ color: stats.winRate >= 50 ? '#00E676' : '#FF5252' }}
            >
              {stats.winRate}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-text-primary">
              {stats.winRate}%
            </span>
            <span className={`text-lg ${trendColor}`}>{trendArrow}</span>
          </div>
          <p className="text-xs text-text-secondary">
            Won {stats.decidingWins} of {stats.total} deciding games
          </p>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-win">
              {stats.decidingWins}W
            </span>
            <span className="text-loss">
              {stats.decidingLosses}L
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
