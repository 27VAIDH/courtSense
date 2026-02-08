import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatches, useGames, usePlayers, useVenues } from '@/db/hooks'
import type { Match, Game, Player, Venue } from '@/db/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const d = new Date(date)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const matchDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - matchDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getGameScoresText(games: Game[]): { text: string; tightIndices: Set<number> } {
  const sorted = [...games].sort((a, b) => a.gameNumber - b.gameNumber)
  const tightIndices = new Set<number>()
  const parts = sorted.map((g, i) => {
    if (g.isTight) tightIndices.add(i)
    return `${g.myScore}-${g.opponentScore}`
  })
  return { text: parts.join(', '), tightIndices }
}

interface MatchCardProps {
  match: Match
  games: Game[]
  opponent: Player | undefined
  venue: Venue | undefined
  onClick: () => void
}

function MatchCard({ match, games, opponent, venue, onClick }: MatchCardProps) {
  const isWin = match.result.startsWith('W')
  const { tightIndices } = useMemo(() => getGameScoresText(games), [games])
  const sortedGames = useMemo(
    () => [...games].sort((a, b) => a.gameNumber - b.gameNumber),
    [games]
  )

  return (
    <Card className="cursor-pointer active:opacity-80" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{opponent?.emoji || '👤'}</span>
          <div>
            <p className="font-semibold text-text-primary">{opponent?.name || 'Unknown'}</p>
            <p className="text-sm text-text-secondary">{formatRelativeDate(match.date)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${isWin ? 'text-win' : 'text-loss'}`}>
            {match.result}
          </p>
          {venue && <p className="text-xs text-text-secondary">{venue.name}</p>}
        </div>
      </div>
      {sortedGames.length > 0 && (
        <div className="mt-2 flex gap-2 text-sm text-text-secondary">
          {sortedGames.map((g, i) => (
            <span key={g.id ?? i}>
              {g.myScore}-{g.opponentScore}
              {tightIndices.has(i) && ' 🔥'}
              {i < sortedGames.length - 1 && ','}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function MatchHistoryList() {
  const matches = useMatches()
  const games = useGames()
  const players = usePlayers()
  const venues = useVenues()
  const navigate = useNavigate()

  const sortedMatches = useMemo(() => {
    if (!matches) return undefined
    return [...matches].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [matches])

  const gamesByMatch = useMemo(() => {
    if (!games) return new Map<number, Game[]>()
    const map = new Map<number, Game[]>()
    for (const g of games) {
      const arr = map.get(g.matchId) || []
      arr.push(g)
      map.set(g.matchId, arr)
    }
    return map
  }, [games])

  const playersById = useMemo(() => {
    if (!players) return new Map<number, Player>()
    const map = new Map<number, Player>()
    for (const p of players) {
      if (p.id !== undefined) map.set(p.id, p)
    }
    return map
  }, [players])

  const venuesById = useMemo(() => {
    if (!venues) return new Map<number, Venue>()
    const map = new Map<number, Venue>()
    for (const v of venues) {
      if (v.id !== undefined) map.set(v.id, v)
    }
    return map
  }, [venues])

  // Loading state
  if (sortedMatches === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[16px] bg-surface" />
        ))}
      </div>
    )
  }

  // Empty state
  if (sortedMatches.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="text-6xl mb-4">🏸</span>
        <p className="text-lg font-semibold text-text-primary mb-2">No matches yet — let's fix that!</p>
        <p className="text-text-secondary mb-6 max-w-[240px]">
          Start logging matches to build your history and unlock insights
        </p>
        <Button onClick={() => navigate('/log')} className="w-full max-w-[200px]">
          Log First Match
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedMatches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          games={gamesByMatch.get(match.id!) || []}
          opponent={playersById.get(match.opponentId)}
          venue={venuesById.get(match.venueId)}
          onClick={() => navigate(`/match/${match.id}`)}
        />
      ))}
    </div>
  )
}
