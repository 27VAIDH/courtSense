import { useState, useMemo } from 'react'
import { useMatches, usePlayers, useGames } from '@/db/hooks'
import Card from '@/components/ui/Card'
import Chip from '@/components/ui/Chip'
import { generateLeaderboard, LEADERBOARD_CATEGORIES, LeaderboardEntry } from '@/lib/leaderboards'

export default function LeaderboardCard() {
  const [selectedCategory, setSelectedCategory] = useState('overall')
  const matches = useMatches()
  const players = usePlayers()
  const games = useGames()

  const currentUser = useMemo(() => {
    return players?.find(p => p.isCurrentUser)
  }, [players])

  const opponents = useMemo(() => {
    return players?.filter(p => !p.isCurrentUser) || []
  }, [players])

  const leaderboard = useMemo(() => {
    if (!matches || !players || !currentUser || !games) return []

    return generateLeaderboard(
      selectedCategory,
      currentUser,
      opponents,
      matches,
      games
    )
  }, [selectedCategory, currentUser, opponents, matches, games])

  const selectedCategoryInfo = LEADERBOARD_CATEGORIES.find(c => c.id === selectedCategory)

  // Get encouraging header text based on leader
  const headerText = useMemo(() => {
    if (leaderboard.length === 0) return 'Keep playing to unlock leaderboards!'

    const leader = leaderboard[0]
    const categoryName = selectedCategoryInfo?.name || ''

    return `${leader.playerEmoji} ${leader.playerName} leads ${categoryName}!`
  }, [leaderboard, selectedCategoryInfo])

  if (!matches || !players || !currentUser) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-4 pt-4">
        <h2 className="text-xl font-bold text-white mb-1">Leaderboards</h2>
        <p className="text-sm text-text-secondary">{headerText}</p>
      </div>

      {/* Category Pills */}
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {LEADERBOARD_CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              selected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {category.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* Leaderboard Card */}
      <div className="px-4">
        <Card>
          <div className="space-y-3">
            {/* Category Description */}
            <div className="pb-3 border-b border-surface-elevated">
              <p className="text-xs text-text-secondary">
                {selectedCategoryInfo?.description}
              </p>
            </div>

            {/* Leaderboard List */}
            {leaderboard.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-text-secondary text-sm">
                  Not enough data for this category yet.
                </p>
                <p className="text-text-secondary text-xs mt-1">
                  Keep playing to unlock!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.playerId}
                    position={index + 1}
                    entry={entry}
                    isCurrentUser={entry.playerId === currentUser.id}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

interface LeaderboardRowProps {
  position: number
  entry: LeaderboardEntry
  isCurrentUser: boolean
}

function LeaderboardRow({ position, entry, isCurrentUser }: LeaderboardRowProps) {
  // Medal emojis for top 3
  const getMedal = (pos: number) => {
    if (pos === 1) return '🥇'
    if (pos === 2) return '🥈'
    if (pos === 3) return '🥉'
    return null
  }

  const medal = getMedal(position)

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-surface-elevated/50'
      }`}
    >
      {/* Position/Medal */}
      <div className="w-8 text-center flex-shrink-0">
        {medal ? (
          <span className="text-xl">{medal}</span>
        ) : (
          <span className="text-text-secondary font-bold">{position}</span>
        )}
      </div>

      {/* Player Info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-2xl flex-shrink-0">{entry.playerEmoji}</span>
        <span className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
          {entry.playerName}
        </span>
      </div>

      {/* Metric Value */}
      <div className="flex-shrink-0">
        <span className={`text-sm font-bold ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
          {entry.value}
        </span>
      </div>
    </div>
  )
}
