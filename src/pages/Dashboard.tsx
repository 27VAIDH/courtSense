import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatches, usePlayers, useVenues, useGames } from '@/db/hooks'
import type { Match } from '@/db/types'
import MatchHistoryList from '@/components/matches/MatchHistoryList'
import Button from '@/components/ui/Button'
import WinRateByOpponent from '@/components/insights/WinRateByOpponent'
import EnergyImpact from '@/components/insights/EnergyImpact'
import BestDays from '@/components/insights/BestDays'
import VenueEffect from '@/components/insights/VenueEffect'
import DecidingGames from '@/components/insights/DecidingGames'

function CurrentFormDots({ matches }: { matches: Match[] }) {
  const last5 = useMemo(() => {
    const sorted = [...matches].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return sorted.slice(0, 5)
  }, [matches])

  if (last5.length === 0) return null

  return (
    <div className="flex items-center gap-1.5">
      {last5.map((m, i) => {
        const isWin = m.result.startsWith('W')
        return (
          <span
            key={m.id ?? i}
            className={`text-xs font-bold ${isWin ? 'text-win' : 'text-loss'}`}
          >
            {isWin ? 'W' : 'L'}
          </span>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const matches = useMatches()
  const players = usePlayers()
  const venues = useVenues()
  const games = useGames()
  const navigate = useNavigate()

  const currentUser = useMemo(() => {
    if (!players) return undefined
    return players.find((p) => p.isCurrentUser)
  }, [players])

  const { wins, losses } = useMemo(() => {
    if (!matches) return { wins: 0, losses: 0 }
    let w = 0
    let l = 0
    for (const m of matches) {
      if (m.result.startsWith('W')) w++
      else l++
    }
    return { wins: w, losses: l }
  }, [matches])

  const isLoading = matches === undefined || players === undefined || venues === undefined || games === undefined

  // Loading state
  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-4">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-surface mb-2" />
          <div className="h-5 w-24 animate-pulse rounded-lg bg-surface mb-2" />
          <div className="h-4 w-20 animate-pulse rounded-lg bg-surface" />
        </div>
        {/* Insight cards skeleton */}
        <div className="mb-6">
          <div className="h-5 w-28 animate-pulse rounded-lg bg-surface mb-3" />
          <div className="flex gap-3 overflow-x-auto">
            <div className="h-32 w-48 flex-shrink-0 animate-pulse rounded-[16px] bg-surface" />
            <div className="h-32 w-48 flex-shrink-0 animate-pulse rounded-[16px] bg-surface" />
          </div>
        </div>
        {/* Match history skeleton */}
        <div className="mb-3">
          <div className="h-5 w-28 animate-pulse rounded-lg bg-surface" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[16px] bg-surface" />
          ))}
        </div>
      </div>
    )
  }

  const hasMatches = matches.length > 0

  // Empty state
  if (!hasMatches) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20 text-center">
        <span className="text-6xl mb-4">🏸</span>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Welcome to SquashIQ!
        </h1>
        <p className="text-text-secondary mb-8 max-w-[280px]">
          Log your first match to start seeing insights.
        </p>
        <Button onClick={() => navigate('/log')} className="w-full max-w-[280px]">
          Log First Match
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header with stats */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {currentUser?.name || 'Player'}
        </h1>
        <p className="text-lg text-text-secondary font-semibold mt-1">
          {wins}W - {losses}L
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-text-secondary">Form:</span>
          <CurrentFormDots matches={matches} />
        </div>
      </div>

      {/* Insight cards container — cards added in US-015 through US-022 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-secondary mb-3">Insights</h2>
        <div className="space-y-3" id="insight-cards-container">
          <WinRateByOpponent matches={matches} players={players} />
          <EnergyImpact matches={matches} />
          <BestDays matches={matches} />
          <VenueEffect matches={matches} venues={venues} />
          <DecidingGames matches={matches} games={games} />
        </div>
      </div>

      {/* Match history */}
      <div>
        <h2 className="text-lg font-semibold text-text-secondary mb-3">Match History</h2>
        <MatchHistoryList />
      </div>
    </div>
  )
}
