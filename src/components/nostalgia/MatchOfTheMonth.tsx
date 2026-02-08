import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import type { Match, Game, Player } from '@/db/types'
import { getMatchOfTheMonth } from '@/lib/nostalgiaEngine'

interface MatchOfTheMonthProps {
  matches: Match[]
  games: Game[]
  players: Player[]
  venues: { id?: number; name: string }[]
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export default function MatchOfTheMonth({
  matches,
  games,
  players,
  venues,
}: MatchOfTheMonthProps) {
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  const monthMatch = useMemo(() => {
    return getMatchOfTheMonth(matches, games, players, venues)
  }, [matches, games, players, venues])

  if (!monthMatch || dismissed) return null

  const opponent = players.find((p) => p.id === monthMatch.match.opponentId)
  const venue = venues.find((v) => v.id === monthMatch.match.venueId)

  const handleCardClick = () => {
    if (monthMatch.match.id) {
      navigate(`/match/${monthMatch.match.id}`)
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
  }

  return (
    <Card
      className="mb-4 border-2 border-accent bg-surface-elevated cursor-pointer relative"
      onClick={handleCardClick}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-text-secondary hover:text-text-primary w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>

      <div className="flex items-start gap-3">
        {/* Large emoji */}
        <div className="text-4xl flex-shrink-0">{monthMatch.emoji}</div>

        <div className="flex-1 pr-6">
          {/* Badge */}
          <div className="inline-block px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-semibold mb-2">
            Match of the Month
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-text-primary mb-1">
            {monthMatch.title}
          </h3>

          {/* Match details */}
          <div className="text-sm text-text-secondary space-y-0.5">
            <p>
              <span className={monthMatch.match.result.startsWith('W') ? 'text-win' : 'text-loss'}>
                {monthMatch.match.result}
              </span>
              {' '}vs {opponent?.emoji} {opponent?.name}
            </p>
            {venue && (
              <p>at {venue.name}</p>
            )}
            <p className="text-xs">{formatDate(monthMatch.match.date)}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
