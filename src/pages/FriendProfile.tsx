import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserMinus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'
import CurrentForm from '@/components/insights/CurrentForm'
import WinRateByOpponent from '@/components/insights/WinRateByOpponent'
import EnergyImpact from '@/components/insights/EnergyImpact'
import type { Match, Player } from '@/db/types'

interface UserProfile {
  id: string
  username: string
  display_name: string
  bio: string | null
  privacy_setting: 'private' | 'friends' | 'public'
}

// No need for custom interfaces - we'll use Match and Player types

export default function FriendProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [isFriend, setIsFriend] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false)
  const [unfriending, setUnfriending] = useState(false)
  const [headToHead, setHeadToHead] = useState<{ wins: number; losses: number } | null>(null)

  useEffect(() => {
    if (user && userId) {
      loadFriendProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userId])

  const loadFriendProfile = async () => {
    if (!user || !userId) return

    try {
      setLoading(true)

      // Check if this user is a friend
      const { data: friendshipData } = await supabase
        .from('friendships')
        .select('id')
        .eq('user_id', user.id)
        .eq('friend_id', userId)
        .eq('status', 'accepted')
        .single()

      const isUserFriend = !!friendshipData
      setIsFriend(isUserFriend)

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, bio, privacy_setting')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Check privacy settings
      const canViewStats =
        profileData.privacy_setting === 'public' ||
        (profileData.privacy_setting === 'friends' && isUserFriend)

      if (canViewStats) {
        // Load friend's matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('id, date, result, user_score, opponent_score, energy_level, opponent_id, created_at')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('date', { ascending: false })

        if (matchesError) throw matchesError

        // Transform matches to match local Match type format
        const transformedMatches: Match[] = matchesData?.map((m, index) => ({
          id: index, // Use index as local ID since Match type expects number
          date: new Date(m.date),
          result: m.result === 'win' ? `W ${m.user_score}-${m.opponent_score}` : `L ${m.user_score}-${m.opponent_score}`,
          opponentId: 0, // Will be mapped properly with players
          venueId: 0, // Not needed for stats display
          format: 'Bo5' as const,
          energyLevel: m.energy_level
            ? (m.energy_level <= 2 ? 'Low' as const : m.energy_level === 3 ? 'Medium' as const : 'High' as const)
            : undefined,
          createdAt: new Date(m.created_at),
        })) || []

        setMatches(transformedMatches)

        // Load friend's players/opponents
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('id, name')
          .eq('user_id', userId)
          .is('deleted_at', null)

        if (playersError) throw playersError

        // Transform players to match local Player type format
        const transformedPlayers: Player[] = playersData?.map((p, index) => ({
          id: index, // Use index for local format
          name: p.name,
          emoji: '🎾', // Default emoji
          isCurrentUser: false,
          createdAt: new Date(),
        })) || []

        setPlayers(transformedPlayers)

        // Check for head-to-head stats
        // Find if current user has a player record in the friend's data
        const currentUserPlayer = playersData?.find(p => p.name === user.user_metadata?.full_name || p.name === user.email?.split('@')[0])

        if (currentUserPlayer) {
          // Count matches where friend played against current user
          const h2hMatches = matchesData?.filter(m => m.opponent_id === currentUserPlayer.id) || []
          const wins = h2hMatches.filter(m => m.result === 'win').length
          const losses = h2hMatches.length - wins

          if (h2hMatches.length > 0) {
            setHeadToHead({ wins: losses, losses: wins }) // Reverse since we're showing from current user's perspective
          }
        }
      }
    } catch (error) {
      console.error('Error loading friend profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnfriend = async () => {
    if (!user || !userId || unfriending) return

    try {
      setUnfriending(true)

      // Delete both friendship records (bidirectional)
      const { error: error1 } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', user.id)
        .eq('friend_id', userId)

      const { error: error2 } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', userId)
        .eq('friend_id', user.id)

      if (error1 || error2) {
        throw error1 || error2
      }

      // Navigate back to profile
      navigate('/profile')
    } catch (error) {
      console.error('Error unfriending:', error)
      alert('Failed to unfriend. Please try again.')
    } finally {
      setUnfriending(false)
      setShowUnfriendConfirm(false)
    }
  }

  const calculateOverallRecord = () => {
    const wins = matches.filter(m => m.result.startsWith('W')).length
    const losses = matches.length - wins
    const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0
    return { wins, losses, winRate }
  }

  const calculateLast5Form = () => {
    const last5 = matches.slice(0, 5)
    return last5.map(m => ({
      result: m.result.startsWith('W') ? 'W' : 'L',
      color: m.result.startsWith('W') ? '#00E676' : '#FF5252',
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24 flex items-center justify-center">
        <div className="text-text-secondary">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="text-center py-8">
          <div className="text-text-secondary">Profile not found</div>
        </div>
      </div>
    )
  }

  const canViewStats =
    profile.privacy_setting === 'public' ||
    (profile.privacy_setting === 'friends' && isFriend)

  const record = calculateOverallRecord()
  const last5Form = calculateLast5Form()

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Profile Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          {profile.display_name}
        </h1>
        <div className="text-text-secondary mb-2">@{profile.username}</div>
        {profile.bio && (
          <p className="text-text-primary mt-3">{profile.bio}</p>
        )}
      </div>

      {/* Unfriend Button */}
      {isFriend && (
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => setShowUnfriendConfirm(true)}
            className="flex items-center gap-2"
          >
            <UserMinus size={16} />
            Unfriend
          </Button>
        </div>
      )}

      {/* Privacy-Respecting Content */}
      {profile.privacy_setting === 'private' && !canViewStats ? (
        <div className="bg-surface-dark border border-border rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <div className="text-text-secondary">
            This profile is private
          </div>
        </div>
      ) : !canViewStats ? (
        <div className="bg-surface-dark border border-border rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">👥</div>
          <div className="text-text-secondary">
            Add {profile.display_name} as a friend to view their stats
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-surface-dark border border-border rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">🎾</div>
          <div className="text-text-secondary">
            {profile.display_name} hasn't logged any matches yet.
          </div>
        </div>
      ) : (
        <>
          {/* Overall Record */}
          <div className="bg-surface-dark border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Overall Record
            </h2>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold text-text-primary">
                  {record.wins}-{record.losses}
                </div>
                <div className="text-sm text-text-secondary">
                  {record.winRate}% win rate
                </div>
              </div>
              {last5Form.length > 0 && (
                <div className="flex-1">
                  <div className="text-sm text-text-secondary mb-2">Last 5 matches</div>
                  <div className="flex gap-2">
                    {last5Form.map((form, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: form.color }}
                      >
                        {form.result}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Head-to-Head Section */}
          {headToHead && (
            <div className="bg-surface-dark border border-border rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Head-to-Head
              </h2>
              <div className="text-2xl font-bold text-text-primary">
                You vs {profile.display_name}: {headToHead.wins}-{headToHead.losses}
                {headToHead.wins + headToHead.losses > 0 && (
                  <span className="text-lg text-text-secondary ml-2">
                    ({Math.round((headToHead.wins / (headToHead.wins + headToHead.losses)) * 100)}%)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Insight Cards */}
          <div className="space-y-4 mb-6">
            <CurrentForm matches={matches} />
            <WinRateByOpponent matches={matches} players={players} />
            <EnergyImpact matches={matches} />
          </div>
        </>
      )}

      {/* Unfriend Confirmation Modal */}
      {showUnfriendConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-dark border border-border rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Unfriend {profile.display_name}?
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              You will no longer be able to view each other's profiles and stats.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowUnfriendConfirm(false)}
                className="flex-1"
                disabled={unfriending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUnfriend}
                className="flex-1 bg-[#FF5252] hover:bg-[#FF5252]/90"
                disabled={unfriending}
              >
                {unfriending ? 'Unfriending...' : 'Unfriend'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
