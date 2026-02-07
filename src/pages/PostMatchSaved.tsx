import { useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useUIStore } from '@/stores/uiStore'
import { useMatches, usePlayers, useGames } from '@/db/hooks'
import Button from '@/components/ui/Button'
import RecommendationCard from '@/components/recommendations/RecommendationCard'
import type { Recommendation } from '@/lib/recommendations'

function getStreakText(
  matches: { opponentId: number; result: string }[],
  currentMatch: { opponentId: number; result: string },
  opponentName: string
): string | null {
  const isWin = currentMatch.result.startsWith('W')

  // Get all matches against the same opponent, sorted by most recent first
  const opponentMatches = matches
    .filter((m) => m.opponentId === currentMatch.opponentId)
    .sort((a, b) => matches.indexOf(b) - matches.indexOf(a))

  if (opponentMatches.length <= 1) {
    // First match against this opponent
    if (isWin) return `First win against ${opponentName}!`
    return null
  }

  // Count consecutive streak (including current match, which is the last element in the sorted list)
  let streak = 0
  for (const m of opponentMatches) {
    const mIsWin = m.result.startsWith('W')
    if (mIsWin === isWin) streak++
    else break
  }

  if (isWin && streak >= 2) return `W${streak} against ${opponentName}!`
  if (!isWin && streak >= 2) return `L${streak} — time to turn it around!`

  return null
}

export default function PostMatchSaved() {
  const { id } = useParams<{ id: string }>()
  const matchId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const { hideTabBar, showTabBar } = useUIStore()
  const confettiFired = useRef(false)

  const allMatches = useMatches()
  const players = usePlayers()
  const games = useGames(matchId)

  const currentMatch = useMemo(
    () => allMatches?.find((m) => m.id === matchId),
    [allMatches, matchId]
  )

  const opponent = useMemo(
    () => players?.find((p) => p.id === currentMatch?.opponentId),
    [players, currentMatch]
  )

  const isWin = currentMatch?.result?.startsWith('W') ?? false

  const streakText = useMemo(() => {
    if (!allMatches || !currentMatch || !opponent) return null
    return getStreakText(allMatches, currentMatch, opponent.name)
  }, [allMatches, currentMatch, opponent])

  const gameScoreText = useMemo(() => {
    if (!games || games.length === 0) return ''
    return games
      .sort((a, b) => a.gameNumber - b.gameNumber)
      .map((g) => `${g.myScore}-${g.opponentScore}`)
      .join(', ')
  }, [games])

  const recommendation = useMemo((): Recommendation | null => {
    if (!currentMatch?.recommendationText) return null
    try {
      return JSON.parse(currentMatch.recommendationText) as Recommendation
    } catch {
      return null
    }
  }, [currentMatch])

  useEffect(() => {
    hideTabBar()
    return () => showTabBar()
  }, [hideTabBar, showTabBar])

  // Confetti for wins
  useEffect(() => {
    if (isWin && currentMatch && !confettiFired.current) {
      confettiFired.current = true
      // Vibrate if available
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }
      // Fire confetti burst
      const duration = 2000
      const end = Date.now() + duration
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#00E676', '#448AFF', '#FF6D00', '#FFD600'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#00E676', '#448AFF', '#FF6D00', '#FFD600'],
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
  }, [isWin, currentMatch])

  // Loading state
  if (!currentMatch || !opponent || !games) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 z-40 flex flex-col bg-bg overflow-auto`}>
      {/* Background animation for loss */}
      {!isWin && (
        <div className="pointer-events-none absolute inset-0 animate-pulse-blue" />
      )}

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Result emoji */}
        <motion.div
          className="text-7xl mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
        >
          {isWin ? '🏆' : '💪'}
        </motion.div>

        {/* Result text */}
        <motion.h1
          className={`text-3xl font-bold mb-1 ${isWin ? 'text-win' : 'text-loss'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {currentMatch.result.replace('W ', 'WIN ').replace('L ', 'LOSS ')}
        </motion.h1>

        {/* Opponent name */}
        <motion.p
          className="text-lg text-text-secondary mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          vs {opponent.emoji} {opponent.name}
        </motion.p>

        {/* Game scores */}
        <motion.p
          className="text-sm text-text-secondary/70 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {gameScoreText}
        </motion.p>

        {/* Streak toast */}
        {streakText && (
          <motion.div
            className={`mb-6 rounded-[12px] px-5 py-3 text-sm font-semibold ${
              isWin
                ? 'bg-win/15 text-win'
                : 'bg-loss/15 text-loss'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
          >
            {isWin ? '🔥' : '💪'} {streakText}
          </motion.div>
        )}

        {/* Recommendation Card */}
        {recommendation && (
          <motion.div
            className="mb-6 w-full max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <RecommendationCard recommendation={recommendation} />
          </motion.div>
        )}

        {/* Rally Analysis Placeholder */}
        <motion.p
          className="mb-8 text-sm text-primary/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Want to add rally details? (30 sec)
        </motion.p>

        {/* Done button */}
        <motion.div
          className="w-full max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={() => {
              showTabBar()
              navigate('/')
            }}
            className="w-full"
          >
            Done
          </Button>
        </motion.div>
      </div>

      {/* Loss pulse animation keyframes */}
      <style>{`
        @keyframes pulse-blue {
          0%, 100% { background: transparent; }
          50% { background: rgba(68, 138, 255, 0.06); }
        }
        .animate-pulse-blue {
          animation: pulse-blue 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-blue {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
