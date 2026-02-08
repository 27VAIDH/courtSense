import { useState, useEffect } from 'react'
import { Users, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'

interface Friend {
  id: string
  friend_id: string
  accepted_at: string
  friend_profile: {
    username: string
    display_name: string
    bio: string | null
  }
}

export default function FriendsList() {
  const { user } = useAuthStore()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadFriends()
    }
  }, [user])

  const loadFriends = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Find all accepted friendships where current user is user_id
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          friend_id,
          accepted_at,
          user_profiles!friendships_friend_id_fkey (
            username,
            display_name,
            bio
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false })

      if (error) throw error

      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        friend_id: item.friend_id,
        accepted_at: item.accepted_at,
        friend_profile: Array.isArray(item.user_profiles) ? item.user_profiles[0] : item.user_profiles
      })) || []

      setFriends(transformedData)
    } catch (error) {
      console.error('Error loading friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewProfile = (friendId: string) => {
    // Navigate to friend profile page
    window.location.href = `/profile/${friendId}`
  }

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="mb-4 text-xl font-semibold text-text-primary">Friends</h2>
        <div className="text-center py-4 text-text-secondary">
          Loading friends...
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">
        Friends
        {friends.length > 0 && (
          <span className="ml-2 text-sm font-normal text-text-secondary">
            ({friends.length})
          </span>
        )}
      </h2>

      {friends.length === 0 ? (
        <div className="bg-surface-dark border border-border rounded-lg p-8 text-center">
          <Users className="mx-auto mb-3 text-text-secondary" size={48} />
          <div className="text-text-secondary mb-2">
            No friends yet
          </div>
          <div className="text-sm text-text-secondary">
            Use the search above to find and connect with friends
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="bg-surface-dark border border-border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary">
                  {friend.friend_profile.display_name}
                </div>
                <div className="text-sm text-text-secondary">
                  @{friend.friend_profile.username}
                </div>
                {friend.friend_profile.bio && (
                  <div className="text-sm text-text-secondary mt-1 truncate">
                    {friend.friend_profile.bio}
                  </div>
                )}
              </div>

              <div className="ml-4 flex-shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => viewProfile(friend.friend_id)}
                  className="flex items-center justify-center gap-2 min-h-[40px]"
                >
                  <ExternalLink size={16} />
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
