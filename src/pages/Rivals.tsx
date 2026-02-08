import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatches, usePlayers } from '@/db/hooks'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import LeaderboardCard from '@/components/leaderboards/LeaderboardCard'
import GlobalLeaderboard from '@/components/leaderboards/GlobalLeaderboard'
import GroupsList from '@/components/groups/GroupsList'

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

interface OpponentSummary {
  id: number
  name: string
  emoji: string
  wins: number
  losses: number
  total: number
  lastResult: string
  lastDate: Date
}

export default function Rivals() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const matches = useMatches()
  const players = usePlayers()
  const [leaderboardMode, setLeaderboardMode] = useState<'local' | 'global'>('local')

  const opponentsList = useMemo(() => {
    if (!matches || !players) return []

    const statsMap = new Map<number, { wins: number; losses: number; lastDate: Date; lastResult: string }>()

    for (const m of matches) {
      const curr = statsMap.get(m.opponentId) || { wins: 0, losses: 0, lastDate: m.date, lastResult: m.result }
      if (m.result.startsWith('W')) curr.wins++
      else curr.losses++
      // Update last match info
      if (new Date(m.date) > new Date(curr.lastDate)) {
        curr.lastDate = m.date
        curr.lastResult = m.result
      }
      statsMap.set(m.opponentId, curr)
    }

    const result: OpponentSummary[] = []
    for (const [oppId, stats] of statsMap) {
      const player = players.find(p => p.id === oppId)
      if (!player) continue
      result.push({
        id: oppId,
        name: player.name,
        emoji: player.emoji,
        wins: stats.wins,
        losses: stats.losses,
        total: stats.wins + stats.losses,
        lastResult: stats.lastResult,
        lastDate: stats.lastDate,
      })
    }

    // Sort by total matches played (most played first)
    result.sort((a, b) => b.total - a.total)
    return result
  }, [matches, players])

  // Empty state
  if (opponentsList.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        {/* Rivalry illustration */}
        <div className="mb-6 flex items-center gap-2 text-5xl">
          <span>🏸</span>
          <span className="text-3xl">⚔️</span>
          <span>🏸</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Add your first opponent to start tracking rivalries
        </h1>
        <p className="text-text-secondary mb-8 max-w-[280px]">
          Head-to-head records, performance insights, and friendly competition await!
        </p>
        <Button onClick={() => navigate('/profile')} className="w-full max-w-[280px]">
          Manage Opponents
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-surface-elevated">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-white">Rivals</h1>
          <p className="text-sm text-text-secondary">Head-to-head records & leaderboards</p>
        </div>
      </div>

      {/* Leaderboard Mode Toggle */}
      {user && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex gap-2">
            <Chip
              selected={leaderboardMode === 'local'}
              onClick={() => setLeaderboardMode('local')}
            >
              Local Rankings
            </Chip>
            <Chip
              selected={leaderboardMode === 'global'}
              onClick={() => setLeaderboardMode('global')}
            >
              Global Rankings
            </Chip>
          </div>
        </div>
      )}

      {/* Leaderboards Section */}
      {leaderboardMode === 'local' ? <LeaderboardCard /> : <GlobalLeaderboard />}

      {/* Groups Section */}
      {user && <GroupsList />}

      {/* Section Divider */}
      <div className="px-4 pt-6 pb-2">
        <h2 className="text-lg font-bold text-white">Your Rivals</h2>
        <p className="text-xs text-text-secondary">Tap to view head-to-head details</p>
      </div>

      {/* Opponents List */}
      <div className="px-4 space-y-3">
        {opponentsList.map((opp) => (
          <Card
            key={opp.id}
            className="cursor-pointer hover:bg-surface-elevated/50 transition-colors active:scale-98"
            onClick={() => navigate(`/rivals/${opp.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-3xl">{opp.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white">{opp.name}</p>
                  <p className="text-xs text-text-secondary">
                    Last match: {formatDate(opp.lastDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* H2H Record */}
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {opp.wins}-{opp.losses}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {opp.total} {opp.total === 1 ? 'match' : 'matches'}
                  </p>
                </div>
                {/* Last result */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    opp.lastResult.startsWith('W')
                      ? 'bg-primary/20 text-primary'
                      : 'bg-loss/20 text-loss'
                  }`}
                >
                  {opp.lastResult.startsWith('W') ? 'W' : 'L'}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
