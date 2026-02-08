import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMatches, useGames, usePlayers } from '@/db/hooks'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import type { Game } from '@/db/types'

function formatDate(date: Date): string {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function RivalryDetail() {
  const { opponentId } = useParams<{ opponentId: string }>()
  const navigate = useNavigate()
  const oppId = Number(opponentId)

  const matches = useMatches()
  const allGames = useGames()
  const players = usePlayers()

  // Find opponent
  const opponent = useMemo(
    () => players?.find((p) => p.id === oppId),
    [players, oppId]
  )

  // Get current user
  const currentUser = useMemo(
    () => players?.find((p) => p.isCurrentUser),
    [players]
  )

  // Filter matches against this opponent
  const h2hMatches = useMemo(() => {
    if (!matches) return []
    return matches
      .filter((m) => m.opponentId === oppId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [matches, oppId])

  // Calculate H2H record
  const h2hRecord = useMemo(() => {
    let wins = 0
    let losses = 0
    for (const m of h2hMatches) {
      if (m.result.startsWith('W')) wins++
      else losses++
    }
    return { wins, losses }
  }, [h2hMatches])

  // Last 5 results
  const last5 = useMemo(() => {
    return h2hMatches.slice(-5).map((m) => m.result.startsWith('W') ? 'W' : 'L')
  }, [h2hMatches])

  // Build games map
  const gamesMap = useMemo(() => {
    if (!allGames) return new Map()
    const map = new Map<number, Game[]>()
    for (const game of allGames) {
      const arr = map.get(game.matchId) || []
      arr.push(game)
      map.set(game.matchId, arr)
    }
    return map
  }, [allGames])

  // Cumulative chart data
  const chartData = useMemo(() => {
    let cumulative = 0
    return h2hMatches.map((m, idx) => {
      if (m.result.startsWith('W')) cumulative++
      else cumulative--
      return {
        matchIndex: idx + 1,
        cumulative,
        date: formatDate(m.date),
        result: m.result,
      }
    })
  }, [h2hMatches])

  // Win/loss streaks
  const streaks = useMemo(() => {
    if (h2hMatches.length === 0) return { current: 0, bestWin: 0 }
    let current = 0
    let bestWin = 0
    let tempStreak = 0
    let lastType = ''

    for (let i = h2hMatches.length - 1; i >= 0; i--) {
      const isWin = h2hMatches[i].result.startsWith('W')
      const type = isWin ? 'W' : 'L'

      if (i === h2hMatches.length - 1) {
        current = 1
        tempStreak = 1
        lastType = type
      } else {
        if (type === lastType) {
          if (i === h2hMatches.length - 2) current++
          tempStreak++
        } else {
          if (lastType === 'W' && tempStreak > bestWin) {
            bestWin = tempStreak
          }
          tempStreak = 1
          lastType = type
        }
      }
    }

    // Check final streak
    if (lastType === 'W' && tempStreak > bestWin) {
      bestWin = tempStreak
    }

    // Current streak type
    const currentType = h2hMatches.length > 0 && h2hMatches[h2hMatches.length - 1].result.startsWith('W') ? 'W' : 'L'

    return {
      current: currentType === 'W' ? current : -current,
      bestWin,
    }
  }, [h2hMatches])

  // Tight games record
  const tightGamesRecord = useMemo(() => {
    let wins = 0
    let losses = 0
    for (const m of h2hMatches) {
      const games = gamesMap.get(m.id!)
      if (!games) continue
      for (const g of games) {
        if (g.isTight) {
          if (g.myScore > g.opponentScore) wins++
          else losses++
        }
      }
    }
    return { wins, losses }
  }, [h2hMatches, gamesMap])

  // Average games per match
  const avgGames = useMemo(() => {
    if (h2hMatches.length === 0) return '0.0'
    const totalGames = h2hMatches.reduce((sum, m) => {
      const games = gamesMap.get(m.id!)
      return sum + (games?.length || 0)
    }, 0)
    return (totalGames / h2hMatches.length).toFixed(1)
  }, [h2hMatches, gamesMap])

  // Most common final score
  const mostCommonScore = useMemo(() => {
    const scoreCount = new Map<string, number>()
    for (const m of h2hMatches) {
      const count = scoreCount.get(m.result) || 0
      scoreCount.set(m.result, count + 1)
    }
    let maxCount = 0
    let maxScore = ''
    for (const [score, count] of scoreCount) {
      if (count > maxCount) {
        maxCount = count
        maxScore = score
      }
    }
    return maxScore || 'N/A'
  }, [h2hMatches])

  // Best win (largest margin)
  const bestWin = useMemo(() => {
    let best = null
    let maxMargin = 0
    for (const m of h2hMatches) {
      if (!m.result.startsWith('W')) continue
      const games = gamesMap.get(m.id!)
      if (!games) continue
      const myGames = games.filter((g: Game) => g.myScore > g.opponentScore).length
      const oppGames = games.filter((g: Game) => g.opponentScore > g.myScore).length
      const margin = myGames - oppGames
      if (margin > maxMargin) {
        maxMargin = margin
        best = m
      }
    }
    return best
  }, [h2hMatches, gamesMap])

  // Worst loss (largest deficit)
  const worstLoss = useMemo(() => {
    let worst = null
    let maxDeficit = 0
    for (const m of h2hMatches) {
      if (!m.result.startsWith('L')) continue
      const games = gamesMap.get(m.id!)
      if (!games) continue
      const myGames = games.filter((g: Game) => g.myScore > g.opponentScore).length
      const oppGames = games.filter((g: Game) => g.opponentScore > g.myScore).length
      const deficit = oppGames - myGames
      if (deficit > maxDeficit) {
        maxDeficit = deficit
        worst = m
      }
    }
    return worst
  }, [h2hMatches, gamesMap])

  // Fun facts
  const funFacts = useMemo(() => {
    const facts: string[] = []

    // Day of week pattern
    const dayWins = new Map<number, { wins: number; total: number }>()
    for (const m of h2hMatches) {
      const day = new Date(m.date).getDay()
      const curr = dayWins.get(day) || { wins: 0, total: 0 }
      curr.total++
      if (m.result.startsWith('W')) curr.wins++
      dayWins.set(day, curr)
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    for (const [day, stats] of dayWins) {
      const dayName = dayNames[day] || 'Unknown'
      if (stats.total >= 2 && stats.wins === stats.total) {
        facts.push(`You have never lost to ${opponent?.name} on a ${dayName}`)
      }
      if (stats.total >= 2 && stats.wins === 0) {
        facts.push(`You have never beaten ${opponent?.name} on a ${dayName}`)
      }
    }

    // Average games
    if (parseFloat(avgGames) >= 4) {
      facts.push(`Average match goes to ${avgGames} games — always competitive`)
    }

    // Limit to 2 facts
    return facts.slice(0, 2)
  }, [h2hMatches, opponent, avgGames])

  // Loading/not found
  if (!opponent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-secondary">Opponent not found</p>
      </div>
    )
  }

  if (h2hMatches.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="text-2xl mb-2">{opponent.emoji}</p>
        <p className="text-xl font-bold text-white mb-2">{opponent.name}</p>
        <p className="text-text-secondary text-center mb-6">
          No matches played yet
        </p>
        <Button onClick={() => navigate('/log')}>Log First Match</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-surface-elevated">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate('/rivals')}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentUser?.emoji || '👤'}</span>
              <span className="text-sm text-text-secondary">vs</span>
              <span className="text-2xl">{opponent.emoji}</span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {currentUser?.name || 'You'} vs {opponent.name}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* H2H Record */}
        <Card className="text-center">
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-3xl font-bold text-primary">{h2hRecord.wins}</p>
              <p className="text-xs text-text-secondary">You</p>
            </div>
            <div className="text-2xl text-text-secondary">-</div>
            <div>
              <p className="text-3xl font-bold text-loss">{h2hRecord.losses}</p>
              <p className="text-xs text-text-secondary">{opponent.name}</p>
            </div>
          </div>

          {/* Last 5 */}
          <div className="flex items-center justify-center gap-1 mt-3">
            <p className="text-xs text-text-secondary mr-2">Last 5:</p>
            {last5.map((r, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  r === 'W' ? 'bg-primary/20 text-primary' : 'bg-loss/20 text-loss'
                }`}
              >
                {r}
              </div>
            ))}
          </div>
        </Card>

        {/* Score History Chart */}
        {chartData.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Score History
            </h3>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="matchIndex"
                  stroke="#B0B0B0"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis stroke="#B0B0B0" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(val) => `Match ${val}`}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#00E676"
                  strokeWidth={2}
                  dot={{ fill: '#00E676', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Key Stats */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Key Stats
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Current Streak</span>
              <span className={streaks.current > 0 ? 'text-primary font-bold' : 'text-loss font-bold'}>
                {streaks.current > 0 ? `W${streaks.current}` : `L${Math.abs(streaks.current)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Best Win Streak</span>
              <span className="text-white font-bold">W{streaks.bestWin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Tight Games</span>
              <span className="text-white font-bold">
                {tightGamesRecord.wins}-{tightGamesRecord.losses}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Avg Games/Match</span>
              <span className="text-white font-bold">{avgGames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Most Common Score</span>
              <span className="text-white font-bold">{mostCommonScore}</span>
            </div>
          </div>
        </Card>

        {/* Best Win */}
        {bestWin && (
          <Card>
            <h3 className="text-sm font-semibold text-primary mb-2">
              🏆 Best Win
            </h3>
            <p className="text-xs text-text-secondary mb-1">
              {formatDate(bestWin.date)}
            </p>
            <p className="text-lg font-bold text-white">{bestWin.result}</p>
            {bestWin.note && (
              <p className="text-xs text-text-secondary mt-2">"{bestWin.note}"</p>
            )}
          </Card>
        )}

        {/* Worst Loss */}
        {worstLoss && (
          <Card>
            <h3 className="text-sm font-semibold text-loss mb-2">
              💔 Worst Loss
            </h3>
            <p className="text-xs text-text-secondary mb-1">
              {formatDate(worstLoss.date)}
            </p>
            <p className="text-lg font-bold text-white">{worstLoss.result}</p>
            {worstLoss.note && (
              <p className="text-xs text-text-secondary mt-2">"{worstLoss.note}"</p>
            )}
          </Card>
        )}

        {/* Fun Facts */}
        {funFacts.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              💡 Fun Facts
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              {funFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
