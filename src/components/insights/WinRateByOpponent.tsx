import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import type { Match, Player } from '@/db/types'

interface WinRateByOpponentProps {
  matches: Match[]
  players: Player[]
}

interface OpponentStat {
  name: string
  emoji: string
  wins: number
  losses: number
  total: number
  winRate: number
  record: string
  opponentId: number
}

const MIN_TOTAL_MATCHES = 3
const MIN_OPPONENT_MATCHES = 3

export default function WinRateByOpponent({
  matches,
  players,
}: WinRateByOpponentProps) {
  const data = useMemo(() => {
    const statsMap = new Map<
      number,
      { wins: number; losses: number }
    >()

    for (const m of matches) {
      const curr = statsMap.get(m.opponentId) || { wins: 0, losses: 0 }
      if (m.result.startsWith('W')) curr.wins++
      else curr.losses++
      statsMap.set(m.opponentId, curr)
    }

    const playerMap = new Map<number, Player>()
    for (const p of players) {
      if (p.id !== undefined) playerMap.set(p.id, p)
    }

    const result: OpponentStat[] = []
    for (const [oppId, stats] of statsMap) {
      const total = stats.wins + stats.losses
      if (total < MIN_OPPONENT_MATCHES) continue
      const player = playerMap.get(oppId)
      if (!player) continue
      result.push({
        name: player.name,
        emoji: player.emoji,
        wins: stats.wins,
        losses: stats.losses,
        total,
        winRate: Math.round((stats.wins / total) * 100),
        record: `${stats.wins}-${stats.losses}`,
        opponentId: oppId,
      })
    }

    // Sort by total matches played (most played at top)
    result.sort((a, b) => b.total - a.total)
    return result
  }, [matches, players])

  // Locked state: fewer than 3 total matches
  if (matches.length < MIN_TOTAL_MATCHES) {
    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Win Rate by Opponent
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-20 rounded bg-surface-elevated" />
                <div className="flex-1 h-4 rounded bg-surface-elevated" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center">
            Log {MIN_TOTAL_MATCHES - matches.length} more match
            {MIN_TOTAL_MATCHES - matches.length !== 1 ? 'es' : ''} to unlock
          </p>
        </div>
      </Card>
    )
  }

  // No opponents with enough matches
  if (data.length === 0) {
    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Win Rate by Opponent
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-20 rounded bg-surface-elevated" />
                <div className="flex-1 h-4 rounded bg-surface-elevated" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            Play {MIN_OPPONENT_MATCHES}+ matches against an opponent to unlock
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Win Rate by Opponent
      </h3>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.opponentId} className="flex items-center gap-2">
            {/* Opponent label */}
            <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
              <span className="text-sm">{d.emoji}</span>
              <span className="text-xs text-text-primary truncate">
                {d.name}
              </span>
            </div>
            {/* Bar */}
            <div className="flex-1 h-5 rounded bg-surface-elevated relative overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${Math.max(d.winRate, 4)}%`,
                  backgroundColor:
                    d.winRate > 50 ? '#00E676' : d.winRate === 50 ? '#FFD600' : '#FF5252',
                  opacity: 0.7 + (d.winRate / 100) * 0.3,
                }}
              />
            </div>
            {/* Record + percentage */}
            <div className="flex items-center gap-1 flex-shrink-0 w-20 justify-end">
              <span className="text-xs text-text-secondary">{d.record}</span>
              <span
                className="text-xs font-bold"
                style={{
                  color:
                    d.winRate > 50 ? '#00E676' : d.winRate === 50 ? '#FFD600' : '#FF5252',
                }}
              >
                {d.winRate}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
