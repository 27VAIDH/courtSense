import { useState, useMemo } from 'react'
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion'
import type { Match, Game, Player, Venue } from '@/db/types'
import Card from '@/components/ui/Card'
import { triggerLightHaptic } from '@/lib/haptics'

interface SwipeableMatchCardProps {
  match: Match
  games: Game[]
  opponent: Player | undefined
  venue: Venue | undefined
  onClick: () => void
  onDelete: () => void
}

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

export default function SwipeableMatchCard({
  match,
  games,
  opponent,
  venue,
  onClick,
  onDelete,
}: SwipeableMatchCardProps) {
  const isWin = match.result.startsWith('W')
  const [showDelete, setShowDelete] = useState(false)

  const sortedGames = useMemo(
    () => [...games].sort((a, b) => a.gameNumber - b.gameNumber),
    [games]
  )

  const tightIndices = useMemo(() => {
    const indices = new Set<number>()
    sortedGames.forEach((g, i) => {
      if (g.isTight) indices.add(i)
    })
    return indices
  }, [sortedGames])

  // Swipe animation
  const x = useMotionValue(0)
  const backgroundColor = useTransform(x, [-150, 0], ['rgba(239, 68, 68, 0.2)', 'rgba(0, 0, 0, 0)'])

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const threshold = -100

    if (info.offset.x < threshold) {
      // Swipe left - show delete
      animate(x, -80, { type: 'spring', stiffness: 300, damping: 30 })
      setShowDelete(true)
      triggerLightHaptic()
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
      setShowDelete(false)
    }
  }

  function handleDelete() {
    triggerLightHaptic()
    onDelete()
  }

  function handleCardClick() {
    if (showDelete) {
      // If delete is showing, dismiss it
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
      setShowDelete(false)
    } else {
      onClick()
    }
  }

  return (
    <div className="relative">
      {/* Delete button background */}
      <motion.div
        className="absolute right-0 top-0 h-full flex items-center pr-4"
        style={{ backgroundColor }}
      >
        <button
          onClick={handleDelete}
          className="flex items-center justify-center w-16 h-16 text-loss"
          aria-label="Delete match"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative"
      >
        <Card className="cursor-pointer active:opacity-80" onClick={handleCardClick}>
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
      </motion.div>
    </div>
  )
}
