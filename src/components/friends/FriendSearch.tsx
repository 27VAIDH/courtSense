import { useState, useEffect } from 'react'
import { Search, UserPlus, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'

interface UserProfile {
  id: string
  username: string
  display_name: string
  bio: string | null
}

interface FriendshipStatus {
  status: 'none' | 'pending_sent' | 'pending_received' | 'accepted'
}

export default function FriendSearch() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, FriendshipStatus>>({})
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      await searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const searchUsers = async (query: string) => {
    if (!user) return

    try {
      setLoading(true)

      // Search for users by username (case-insensitive)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, bio')
        .ilike('username', `%${query}%`)
        .neq('id', user.id) // Exclude current user
        .limit(10)

      if (error) throw error

      setSearchResults(data || [])

      // Check friendship status for each result
      if (data && data.length > 0) {
        await checkFriendshipStatuses(data.map(u => u.id))
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkFriendshipStatuses = async (userIds: string[]) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('friend_id, status')
        .eq('user_id', user.id)
        .in('friend_id', userIds)

      if (error) throw error

      const statuses: Record<string, FriendshipStatus> = {}
      userIds.forEach(id => {
        statuses[id] = { status: 'none' }
      })

      data?.forEach(friendship => {
        if (friendship.status === 'accepted') {
          statuses[friendship.friend_id] = { status: 'accepted' }
        } else if (friendship.status === 'pending') {
          statuses[friendship.friend_id] = { status: 'pending_sent' }
        }
      })

      setFriendshipStatuses(statuses)
    } catch (error) {
      console.error('Error checking friendship status:', error)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return

    try {
      setSendingRequest(friendId)

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      // Optimistically update UI
      setFriendshipStatuses(prev => ({
        ...prev,
        [friendId]: { status: 'pending_sent' }
      }))
    } catch (error) {
      console.error('Error sending friend request:', error)
      alert('Failed to send friend request. Please try again.')
    } finally {
      setSendingRequest(null)
    }
  }

  const renderActionButton = (profile: UserProfile) => {
    const status = friendshipStatuses[profile.id]?.status || 'none'

    if (status === 'accepted') {
      return (
        <div className="flex items-center gap-2 text-primary text-sm font-medium">
          <Check size={16} />
          Friends
        </div>
      )
    }

    if (status === 'pending_sent') {
      return (
        <div className="text-text-secondary text-sm">
          Request Sent
        </div>
      )
    }

    return (
      <Button
        variant="primary"
        onClick={() => sendFriendRequest(profile.id)}
        disabled={sendingRequest === profile.id}
        className="min-w-[120px] flex items-center justify-center gap-2 min-h-[40px]"
      >
        <UserPlus size={16} />
        Add Friend
      </Button>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">Find Friends</h2>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full bg-surface-dark border border-border rounded-lg py-3 pl-10 pr-4 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Search for friends by username"
        />
      </div>

      {/* Search Results */}
      {loading && (
        <div className="text-center py-4 text-text-secondary">
          Searching...
        </div>
      )}

      {!loading && searchQuery && searchResults.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          No users found matching "{searchQuery}"
        </div>
      )}

      {!loading && searchResults.length > 0 && (
        <div className="space-y-3">
          {searchResults.map((profile) => (
            <div
              key={profile.id}
              className="bg-surface-dark border border-border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary">
                  {profile.display_name}
                </div>
                <div className="text-sm text-text-secondary">
                  @{profile.username}
                </div>
                {profile.bio && (
                  <div className="text-sm text-text-secondary mt-1 truncate">
                    {profile.bio}
                  </div>
                )}
              </div>

              <div className="ml-4 flex-shrink-0">
                {renderActionButton(profile)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
