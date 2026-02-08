import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/ui/Card'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import {
  fetchGlobalLeaderboard,
  getCurrentUserRank,
  GLOBAL_LEADERBOARD_CATEGORIES,
  GlobalLeaderboardEntry,
} from '@/lib/globalLeaderboards'

export default function GlobalLeaderboard() {
  const { user } = useAuthStore()
  const [selectedCategory, setSelectedCategory] = useState('overall')
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([])
  const [friendsOnly, setFriendsOnly] = useState(false)
  const [friendIds, setFriendIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<{ rank: number; total: number } | null>(null)

  const selectedCategoryInfo = GLOBAL_LEADERBOARD_CATEGORIES.find(
    c => c.id === selectedCategory
  )

  // Load friends list
  useEffect(() => {
    if (user) {
      loadFriends()
    }
  }, [user])

  // Load leaderboard when category or friends-only changes
  useEffect(() => {
    loadLeaderboard()
  }, [selectedCategory, friendsOnly, friendIds])

  // Load user rank
  useEffect(() => {
    if (user && selectedCategory) {
      loadUserRank()
    }
  }, [user, selectedCategory])

  const loadFriends = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (error) throw error

      const ids = data?.map(f => f.friend_id) || []
      // Include current user in the list
      setFriendIds([user.id, ...ids])
    } catch (error) {
      console.error('Error loading friends:', error)
      setFriendIds([user?.id || ''])
    }
  }

  const loadLeaderboard = async () => {
    try {
      setLoading(true)

      const data = await fetchGlobalLeaderboard(
        selectedCategory,
        friendsOnly,
        friendIds
      )

      setLeaderboard(data)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
      setLeaderboard([])
    } finally {
      setLoading(false)
    }
  }

  const loadUserRank = async () => {
    if (!user) return

    try {
      const rank = await getCurrentUserRank(selectedCategory, user.id)
      setUserRank(rank)
    } catch (error) {
      console.error('Error loading user rank:', error)
      setUserRank(null)
    }
  }

  // Get encouraging header text
  const headerText = useMemo(() => {
    if (loading) return 'Loading leaderboards...'
    if (leaderboard.length === 0) return 'No data available yet. Keep playing!'

    const leader = leaderboard[0]
    const categoryName = selectedCategoryInfo?.name || ''

    if (friendsOnly) {
      return `${leader.displayName} leads ${categoryName} among friends! 🔥`
    }

    return `${leader.displayName} leads ${categoryName} globally! 🔥`
  }, [leaderboard, selectedCategoryInfo, loading, friendsOnly])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-4 pt-4">
        <h2 className="text-xl font-bold text-white mb-1">Global Leaderboards</h2>
        <p className="text-sm text-text-secondary">{headerText}</p>
      </div>

      {/* Friends-Only Toggle */}
      <div className="px-4">
        <Button
          variant={friendsOnly ? 'primary' : 'secondary'}
          onClick={() => setFriendsOnly(!friendsOnly)}
          className="text-sm"
        >
          {friendsOnly ? '👥 Friends Only' : '🌍 Everyone'}
        </Button>
      </div>

      {/* Category Pills */}
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {GLOBAL_LEADERBOARD_CATEGORIES.map((category) => (
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

      {/* User Rank Badge */}
      {userRank && !friendsOnly && (
        <div className="px-4">
          <Card className="bg-primary/10 border border-primary/20">
            <div className="text-center py-2">
              <p className="text-sm text-primary font-semibold">
                You are ranked #{userRank.rank} of {userRank.total} users
              </p>
            </div>
          </Card>
        </div>
      )}

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

            {/* Loading State */}
            {loading && (
              <div className="py-8 text-center">
                <p className="text-text-secondary text-sm">Loading...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && leaderboard.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-text-secondary text-sm">
                  {friendsOnly
                    ? 'No friends on this leaderboard yet.'
                    : 'No data for this category yet.'}
                </p>
                <p className="text-text-secondary text-xs mt-1">
                  Keep playing to unlock!
                </p>
              </div>
            )}

            {/* Leaderboard List */}
            {!loading && leaderboard.length > 0 && (
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <GlobalLeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isCurrentUser={entry.userId === user?.id}
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

interface GlobalLeaderboardRowProps {
  entry: GlobalLeaderboardEntry
  isCurrentUser: boolean
}

function GlobalLeaderboardRow({ entry, isCurrentUser }: GlobalLeaderboardRowProps) {
  // Medal emojis for top 3
  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  const medal = getMedal(entry.rank)

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
          <span className="text-text-secondary font-bold">{entry.rank}</span>
        )}
      </div>

      {/* Player Info */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span
          className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-white'}`}
        >
          {entry.displayName}
        </span>
        <span className="text-xs text-text-secondary truncate">@{entry.username}</span>
      </div>

      {/* Metric Value */}
      <div className="flex-shrink-0">
        <span className={`text-sm font-bold ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
          {entry.metricLabel}
        </span>
      </div>
    </div>
  )
}
