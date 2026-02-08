import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import type { Match, Player } from '@/db/types'
import { getOnThisDay } from '@/lib/nostalgiaEngine'

interface OnThisDayProps {
  matches: Match[]
  players: Player[]
  venues: { id?: number; name: string }[]
}

function formatMonthsAgo(monthsAgo: number): string {
  if (monthsAgo === 1) return '1 month'
  return `${monthsAgo} months`
}

export default function OnThisDay({ matches, players, venues }: OnThisDayProps) {
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  const onThisDay = useMemo(() => {
    return getOnThisDay(matches)
  }, [matches])

  if (!onThisDay || dismissed) return null

  const opponent = players.find((p) => p.id === onThisDay.match.opponentId)
  const venue = venues.find((v) => v.id === onThisDay.match.venueId)

  const handleCardClick = () => {
    if (onThisDay.match.id) {
      navigate(`/match/${onThisDay.match.id}`)
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
  }

  const resultText = onThisDay.match.result.startsWith('W') ? 'won' : 'lost'

  return (
    <Card
      className="mb-4 border-l-4 border-secondary bg-surface-elevated cursor-pointer relative"
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

      <div className="pr-6">
        {/* Badge with emoji */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📅</span>
          <div className="inline-block px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs font-semibold">
            On This Day
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-primary leading-relaxed">
          {formatMonthsAgo(onThisDay.yearsAgo)} ago today, you{' '}
          <span className={onThisDay.match.result.startsWith('W') ? 'text-win font-semibold' : 'text-loss font-semibold'}>
            {resultText}
          </span>
          {' '}against {opponent?.emoji} {opponent?.name || 'your opponent'}{' '}
          <span className="font-semibold">{onThisDay.match.result}</span>
          {venue && <span> at {venue.name}</span>}
        </p>
      </div>
    </Card>
  )
}
