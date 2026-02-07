import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import type { Match, Game } from '@/db/types'

interface FastStarterProps {
  matches: Match[]
  games: Game[]
}

const MIN_MATCHES = 8

export default function FastStarter({ matches, games }: FastStarterProps) {
  const stats = useMemo(() => {
    // Build map of matchId -> games
    const gamesByMatch = new Map<number, Game[]>()
    for (const g of games) {
      const arr = gamesByMatch.get(g.matchId) || []
      arr.push(g)
      gamesByMatch.set(g.matchId, arr)
    }

    let game1Wins = 0
    let game1Total = 0
    let matchWinsAfterGame1Win = 0

    for (const m of matches) {
      if (m.id === undefined) continue
      const matchGames = gamesByMatch.get(m.id)
      if (!matchGames) continue

      const game1 = matchGames.find((g) => g.gameNumber === 1)
      if (!game1 || (game1.myScore === 0 && game1.opponentScore === 0)) continue

      game1Total++
      const wonGame1 = game1.myScore > game1.opponentScore
      if (wonGame1) {
        game1Wins++
        if (m.result.startsWith('W')) {
          matchWinsAfterGame1Win++
        }
      }
    }

    const game1WinPct = game1Total > 0 ? Math.round((game1Wins / game1Total) * 100) : 0
    const conversionPct = game1Wins > 0 ? Math.round((matchWinsAfterGame1Win / game1Wins) * 100) : 0

    return { game1Wins, game1Total, matchWinsAfterGame1Win, game1WinPct, conversionPct }
  }, [matches, games])

  // Locked state
  if (matches.length < MIN_MATCHES) {
    const remaining = MIN_MATCHES - matches.length
    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Fast Starter
          </h3>
          <div className="flex items-center justify-center py-4 gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-elevated" />
            <div className="w-8 h-1 bg-surface-elevated rounded" />
            <div className="w-16 h-16 rounded-full bg-surface-elevated" />
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            Log {remaining} more match{remaining !== 1 ? 'es' : ''} to unlock
          </p>
        </div>
      </Card>
    )
  }

  const { game1WinPct, conversionPct } = stats

  const arrowColor =
    conversionPct >= 70 ? '#00E676' : conversionPct >= 50 ? '#FFD600' : '#FF5252'

  const circleSize = 72
  const r = circleSize / 2 - 4
  const circumference = 2 * Math.PI * r

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Fast Starter
      </h3>

      {/* Two connected circles */}
      <div className="flex items-center justify-center gap-2">
        {/* Left circle — Game 1 win % */}
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: circleSize, height: circleSize }}>
            <svg width={circleSize} height={circleSize}>
              {/* Background ring */}
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={r}
                fill="none"
                stroke="#242424"
                strokeWidth={5}
              />
              {/* Progress ring */}
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={r}
                fill="none"
                stroke={game1WinPct >= 50 ? '#00E676' : '#FF5252'}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (game1WinPct / 100) * circumference}
                transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-base font-bold"
                style={{ color: game1WinPct >= 50 ? '#00E676' : '#FF5252' }}
              >
                {game1WinPct}%
              </span>
            </div>
          </div>
          <span className="text-[10px] text-text-secondary mt-1">Win Game 1</span>
        </div>

        {/* Arrow */}
        <svg width={40} height={20} className="flex-shrink-0">
          <line
            x1={4}
            y1={10}
            x2={30}
            y2={10}
            stroke={arrowColor}
            strokeWidth={2}
          />
          <polygon
            points="28,5 36,10 28,15"
            fill={arrowColor}
          />
        </svg>

        {/* Right circle — Match conversion % */}
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: circleSize, height: circleSize }}>
            <svg width={circleSize} height={circleSize}>
              {/* Background ring */}
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={r}
                fill="none"
                stroke="#242424"
                strokeWidth={5}
              />
              {/* Progress ring */}
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={r}
                fill="none"
                stroke={arrowColor}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (conversionPct / 100) * circumference}
                transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-base font-bold"
                style={{ color: arrowColor }}
              >
                {conversionPct}%
              </span>
            </div>
          </div>
          <span className="text-[10px] text-text-secondary mt-1">Convert to win</span>
        </div>
      </div>

      {/* Example text */}
      <p className="text-xs text-text-secondary mt-3 text-center">
        Win Game 1: {game1WinPct}% → Convert to match win: {conversionPct}%
      </p>
    </Card>
  )
}
