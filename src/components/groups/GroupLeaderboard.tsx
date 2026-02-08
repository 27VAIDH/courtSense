import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/ui/Card'
import Chip from '@/components/ui/Chip'

interface Member {
  user_id: string
  display_name: string
  username: string
}

interface LeaderboardEntry {
  user_id: string
  display_name: string
  username: string
  rank: number
  metric_value: string
  metric_label: string
}

type Category = 'overall' | 'iron_man' | 'clutch_king' | 'comeback_kid' | 'hot_streak' | 'consistency' | 'most_improved'

const CATEGORIES = [
  { id: 'overall' as Category, label: 'Overall', emoji: '🏆' },
  { id: 'iron_man' as Category, label: 'Iron Man', emoji: '💪' },
  { id: 'clutch_king' as Category, label: 'Clutch King', emoji: '👑' },
  { id: 'comeback_kid' as Category, label: 'Comeback Kid', emoji: '🔥' },
  { id: 'hot_streak' as Category, label: 'Hot Streak', emoji: '⚡' },
  { id: 'consistency' as Category, label: 'Consistency', emoji: '📊' },
  { id: 'most_improved' as Category, label: 'Most Improved', emoji: '📈' },
]

interface GroupLeaderboardProps {
  groupId: string
  members: Member[]
}

export default function GroupLeaderboard({ groupId, members }: GroupLeaderboardProps) {
  const { user } = useAuthStore()
  const [category, setCategory] = useState<Category>('overall')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const computeGroupLeaderboard = async (cat: Category) => {
    if (!members.length) return []

    const memberIds = members.map((m) => m.user_id)

    try {
      // Fetch all matches for group members
      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .in('user_id', memberIds)
        .is('deleted_at', null)

      if (error) throw error
      if (!matches || matches.length === 0) return []

      // Compute stats per user
      const statsMap = new Map<string, any>()

      for (const userId of memberIds) {
        const userMatches = matches.filter((m) => m.user_id === userId)
        if (userMatches.length === 0) continue

        const wins = userMatches.filter((m) => m.result === 'win').length
        const losses = userMatches.filter((m) => m.result === 'loss').length
        const total = wins + losses
        const winRate = total > 0 ? (wins / total) * 100 : 0

        // Last 5 matches
        const last5 = userMatches
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
        const last5Wins = last5.filter((m) => m.result === 'win').length

        // Comebacks (3+ game losses recovered to win)
        const comebacks = userMatches.filter((m) => m.result === 'win' && m.opponent_score >= 2).length

        // Clutch wins (games decided by <=2 points)
        const clutchWins = 0 // Would need games data

        // Hot streak (current consecutive wins)
        let streak = 0
        const sorted = userMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        for (const m of sorted) {
          if (m.result === 'win') streak++
          else break
        }

        statsMap.set(userId, {
          total,
          wins,
          losses,
          winRate,
          last5Wins,
          comebacks,
          clutchWins,
          streak,
        })
      }

      // Sort by category
      let sorted: LeaderboardEntry[] = []

      switch (cat) {
        case 'overall':
          sorted = Array.from(statsMap.entries())
            .filter(([_, stats]) => stats.total > 0)
            .sort((a, b) => b[1].winRate - a[1].winRate)
            .map(([userId, stats], idx) => {
              const member = members.find((m) => m.user_id === userId)!
              return {
                user_id: userId,
                display_name: member.display_name,
                username: member.username,
                rank: idx + 1,
                metric_value: `${stats.wins}-${stats.losses}`,
                metric_label: `${stats.winRate.toFixed(0)}%`,
              }
            })
          break

        case 'iron_man':
          sorted = Array.from(statsMap.entries())
            .filter(([_, stats]) => stats.total > 0)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([userId, stats], idx) => {
              const member = members.find((m) => m.user_id === userId)!
              return {
                user_id: userId,
                display_name: member.display_name,
                username: member.username,
                rank: idx + 1,
                metric_value: `${stats.total}`,
                metric_label: `${stats.total} matches`,
              }
            })
          break

        case 'clutch_king':
          sorted = Array.from(statsMap.entries())
            .filter(([_, stats]) => stats.clutchWins > 0)
            .sort((a, b) => b[1].clutchWins - a[1].clutchWins)
            .map(([userId, stats], idx) => {
              const member = members.find((m) => m.user_id === userId)!
              return {
                user_id: userId,
                display_name: member.display_name,
                username: member.username,
                rank: idx + 1,
                metric_value: `${stats.clutchWins}`,
                metric_label: `${stats.clutchWins} clutch wins`,
              }
            })
          break

        case 'comeback_kid':
          sorted = Array.from(statsMap.entries())
            .filter(([_, stats]) => stats.comebacks > 0)
            .sort((a, b) => b[1].comebacks - a[1].comebacks)
            .map(([userId, stats], idx) => {
              const member = members.find((m) => m.user_id === userId)!
              return {
                user_id: userId,
                display_name: member.display_name,
                username: member.username,
                rank: idx + 1,
                metric_value: `${stats.comebacks}`,
                metric_label: `${stats.comebacks} comebacks`,
              }
            })
          break

        case 'hot_streak':
          sorted = Array.from(statsMap.entries())
            .filter(([_, stats]) => stats.streak > 0)
            .sort((a, b) => b[1].streak - a[1].streak)
            .map(([userId, stats], idx) => {
              const member = members.find((m) => m.user_id === userId)!
              return {
                user_id: userId,
                display_name: member.display_name,
                username: member.username,
                rank: idx + 1,
                metric_value: `${stats.streak}`,
                metric_label: `${stats.streak} wins`,
              }
            })
          break

        case 'consistency':
          sorted = Array.from(statsMap.entries())
            .filter(([_, stats]) => stats.total >= 5)
            .sort((a, b) => b[1].last5Wins - a[1].last5Wins)
            .map(([userId, stats], idx) => {
              const member = members.find((m) => m.user_id === userId)!
              return {
                user_id: userId,
                display_name: member.display_name,
                username: member.username,
                rank: idx + 1,
                metric_value: `${stats.last5Wins}/5`,
                metric_label: 'last 5',
              }
            })
          break

        case 'most_improved':
          // Simplified: sort by win rate (would need historical comparison)
          sorted = Array.from(statsMap.entries())
            .filter(([_, stats]) => stats.total >= 3)
            .sort((a, b) => b[1].winRate - a[1].winRate)
            .map(([userId, stats], idx) => {
              const member = members.find((m) => m.user_id === userId)!
              return {
                user_id: userId,
                display_name: member.display_name,
                username: member.username,
                rank: idx + 1,
                metric_value: `${stats.winRate.toFixed(0)}%`,
                metric_label: 'recent',
              }
            })
          break
      }

      return sorted.slice(0, 50) // Top 50
    } catch (err) {
      console.error('Error computing group leaderboard:', err)
      return []
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await computeGroupLeaderboard(category)
      setLeaderboard(data)
      setLoading(false)
    }
    load()
  }, [category, members, groupId])

  const currentCategory = CATEGORIES.find((c) => c.id === category)!
  const userRank = leaderboard.findIndex((entry) => entry.user_id === user?.id)

  return (
    <div>
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.id}
            selected={category === cat.id}
            onClick={() => setCategory(cat.id)}
          >
            {cat.emoji} {cat.label}
          </Chip>
        ))}
      </div>

      {/* User Rank Badge */}
      {userRank >= 0 && (
        <Card className="mb-3 bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary font-medium">Your Rank</p>
              <p className="text-white font-bold text-lg">
                #{userRank + 1} of {leaderboard.length}
              </p>
            </div>
            <div className="text-3xl">{currentCategory.emoji}</div>
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-text-secondary text-sm mt-2">Computing rankings...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <Card className="text-center py-8">
          <div className="text-4xl mb-2">{currentCategory.emoji}</div>
          <p className="text-white font-medium mb-1">No data yet</p>
          <p className="text-sm text-text-secondary">
            Group members need to log matches first
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.user_id === user?.id
            const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null

            return (
              <Card
                key={entry.user_id}
                className={isCurrentUser ? 'border-2 border-primary' : ''}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-center w-8">
                      {medal ? (
                        <span className="text-2xl">{medal}</span>
                      ) : (
                        <span className="text-text-secondary font-bold">#{entry.rank}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
                        {entry.display_name}
                      </p>
                      <p className="text-xs text-text-secondary">@{entry.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{entry.metric_value}</p>
                    <p className="text-xs text-text-secondary">{entry.metric_label}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
