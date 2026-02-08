import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import type { Match, Game, Player } from '@/db/types'

interface ClutchRatingProps {
  matches: Match[]
  games: Game[]
  players: Player[]
}

const MIN_TIGHT_GAMES = 5

export default function ClutchRating({ matches, games, players }: ClutchRatingProps) {
  const [expandedSection, setExpandedSection] = useState<'opponent' | 'gameNumber' | null>(null)

  const stats = useMemo(() => {
    // Get all tight games
    const tightGames = games.filter((g) => g.isTight)

    // Build a map of matchId -> games and matchId -> match
    const gamesByMatch = new Map<number, Game[]>()
    const matchMap = new Map<number, Match>()

    for (const g of games) {
      const arr = gamesByMatch.get(g.matchId) || []
      arr.push(g)
      gamesByMatch.set(g.matchId, arr)
    }

    for (const m of matches) {
      if (m.id !== undefined) {
        matchMap.set(m.id, m)
      }
    }

    let tightWins = 0
    let tightLosses = 0
    const recentTight: boolean[] = []

    // Sort tight games by match creation date for trend
    const tightGamesWithMatch = tightGames
      .map((g) => ({ game: g, match: matchMap.get(g.matchId) }))
      .filter((item) => item.match !== undefined)
      .sort((a, b) =>
        new Date(a.match!.createdAt).getTime() - new Date(b.match!.createdAt).getTime()
      )

    for (const { game } of tightGamesWithMatch) {
      const won = game.myScore > game.opponentScore
      if (won) tightWins++
      else tightLosses++
      recentTight.push(won)
    }

    const total = tightWins + tightLosses
    const clutchIndex = total > 0 ? Math.round((tightWins / total) * 100) : 0

    // Last 5 tight games win rate for trend
    const last5 = recentTight.slice(-5)
    const last5WinRate =
      last5.length > 0
        ? Math.round((last5.filter(Boolean).length / last5.length) * 100)
        : 0

    let trend: 'up' | 'down' | 'flat' = 'flat'
    if (last5.length >= 3) {
      if (last5WinRate > clutchIndex) trend = 'up'
      else if (last5WinRate < clutchIndex) trend = 'down'
    }

    // Rating label and color
    let ratingLabel = 'Neutral'
    let ratingColor = '#FFD600' // yellow
    if (clutchIndex >= 80) {
      ratingLabel = 'Ice Veins'
      ratingColor = '#00BFA5' // cyan
    } else if (clutchIndex >= 60) {
      ratingLabel = 'Hot'
      ratingColor = '#FF6D00' // orange
    } else if (clutchIndex >= 40) {
      ratingLabel = 'Neutral'
      ratingColor = '#FFD600' // yellow
    } else {
      ratingLabel = 'Cold'
      ratingColor = '#448AFF' // blue
    }

    // Clutch by opponent
    const clutchByOpponent = new Map<number, { wins: number; total: number }>()
    for (const { game, match } of tightGamesWithMatch) {
      if (!match) continue
      const opponentId = match.opponentId
      const current = clutchByOpponent.get(opponentId) || { wins: 0, total: 0 }
      current.total++
      if (game.myScore > game.opponentScore) current.wins++
      clutchByOpponent.set(opponentId, current)
    }

    const opponentStats = Array.from(clutchByOpponent.entries())
      .map(([opponentId, stats]) => {
        const player = players.find((p) => p.id === opponentId)
        return {
          opponentId,
          opponentName: player?.name || 'Unknown',
          opponentEmoji: player?.emoji || '❓',
          index: Math.round((stats.wins / stats.total) * 100),
          tightGames: stats.total,
        }
      })
      .sort((a, b) => b.tightGames - a.tightGames)

    // Clutch by game number
    const clutchByGameNumber = new Map<number, { wins: number; total: number }>()
    for (const { game } of tightGamesWithMatch) {
      const gameNum = game.gameNumber
      const current = clutchByGameNumber.get(gameNum) || { wins: 0, total: 0 }
      current.total++
      if (game.myScore > game.opponentScore) current.wins++
      clutchByGameNumber.set(gameNum, current)
    }

    const gameNumberStats = Array.from(clutchByGameNumber.entries())
      .map(([gameNumber, stats]) => ({
        gameNumber,
        index: Math.round((stats.wins / stats.total) * 100),
        tightGames: stats.total,
      }))
      .sort((a, b) => a.gameNumber - b.gameNumber)

    return {
      clutchIndex,
      total,
      tightWins,
      tightLosses,
      trend,
      ratingLabel,
      ratingColor,
      opponentStats,
      gameNumberStats,
    }
  }, [matches, games, players])

  // Locked state
  if (stats.total < MIN_TIGHT_GAMES) {
    const remaining = MIN_TIGHT_GAMES - stats.total

    return (
      <Card className="relative overflow-hidden">
        <div className="opacity-40">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            8-8+ Index
          </h3>
          <div className="flex items-center justify-center py-8">
            <div className="text-6xl font-bold text-text-secondary">--</div>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60">
          <span className="text-2xl mb-1">🔒</span>
          <p className="text-xs text-text-secondary text-center px-4">
            {stats.total === 0
              ? `Play ${remaining} tight game${remaining !== 1 ? 's' : ''} to unlock`
              : `${remaining} more tight game${remaining !== 1 ? 's' : ''} to unlock`}
          </p>
        </div>
      </Card>
    )
  }

  const trendArrow =
    stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '→'
  const trendColor =
    stats.trend === 'up'
      ? 'text-win'
      : stats.trend === 'down'
        ? 'text-loss'
        : 'text-text-secondary'

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        8-8+ Index
      </h3>

      {/* Main rating display */}
      <div className="flex items-center justify-center mb-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-5xl font-bold text-text-primary"
            >
              {stats.clutchIndex}
            </motion.span>
            <span className={`text-2xl ${trendColor}`}>{trendArrow}</span>
          </div>
          <div
            className="text-sm font-semibold mb-1"
            style={{ color: stats.ratingColor }}
          >
            {stats.ratingLabel}
          </div>
          <p className="text-xs text-text-secondary">
            {stats.tightWins}W-{stats.tightLosses}L in tight games
          </p>
        </motion.div>
      </div>

      {/* Expandable sections */}
      <div className="space-y-2">
        {/* Clutch by Opponent */}
        {stats.opponentStats.length > 0 && (
          <div className="border-t border-surface-elevated pt-3">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === 'opponent' ? null : 'opponent'
                )
              }
              className="w-full flex items-center justify-between text-sm font-medium text-text-primary"
            >
              <span>Clutch by Opponent</span>
              <span className="text-text-secondary">
                {expandedSection === 'opponent' ? '▼' : '▶'}
              </span>
            </button>
            {expandedSection === 'opponent' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 space-y-1"
              >
                {stats.opponentStats.map((stat) => (
                  <div
                    key={stat.opponentId}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-text-primary">
                      {stat.opponentEmoji} {stat.opponentName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            stat.index >= 50 ? '#00E676' : '#FF5252',
                        }}
                      >
                        {stat.index}%
                      </span>
                      <span className="text-text-secondary">
                        ({stat.tightGames})
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Clutch by Game Number */}
        {stats.gameNumberStats.length > 0 && (
          <div className="border-t border-surface-elevated pt-3">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === 'gameNumber' ? null : 'gameNumber'
                )
              }
              className="w-full flex items-center justify-between text-sm font-medium text-text-primary"
            >
              <span>Clutch by Game Number</span>
              <span className="text-text-secondary">
                {expandedSection === 'gameNumber' ? '▼' : '▶'}
              </span>
            </button>
            {expandedSection === 'gameNumber' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 space-y-1"
              >
                {stats.gameNumberStats.map((stat) => (
                  <div
                    key={stat.gameNumber}
                    className="flex items-center justify-between text-xs py-1"
                  >
                    <span className="text-text-primary">
                      Game {stat.gameNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            stat.index >= 50 ? '#00E676' : '#FF5252',
                        }}
                      >
                        {stat.index}%
                      </span>
                      <span className="text-text-secondary">
                        ({stat.tightGames})
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
