import { useState, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'

interface FriendRequest {
  id: string
  user_id: string
  created_at: string
  user_profile: {
    username: string
    display_name: string
    bio: string | null
  }
}

export default function FriendRequests() {
  const { user } = useAuthStore()
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadFriendRequests()
    }
  }, [user])

  const loadFriendRequests = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Find all pending requests where current user is the friend_id (receiver)
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          created_at,
          user_profiles!friendships_user_id_fkey (
            username,
            display_name,
            bio
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        created_at: item.created_at,
        user_profile: Array.isArray(item.user_profiles) ? item.user_profiles[0] : item.user_profiles
      })) || []

      setRequests(transformedData)
    } catch (error) {
      console.error('Error loading friend requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptRequest = async (requestId: string, senderId: string) => {
    if (!user) return

    try {
      setProcessingRequest(requestId)

      // Update the existing friendship to accepted
      const { error: updateError } = await supabase
        .from('friendships')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // Create reverse record for bidirectional friendship
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: senderId,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      // Remove from UI
      setRequests(prev => prev.filter(req => req.id !== requestId))
    } catch (error) {
      console.error('Error accepting friend request:', error)
      alert('Failed to accept friend request. Please try again.')
    } finally {
      setProcessingRequest(null)
    }
  }

  const declineRequest = async (requestId: string) => {
    if (!user) return

    try {
      setProcessingRequest(requestId)

      // Delete the friendship record (or could update status to 'declined')
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      // Remove from UI
      setRequests(prev => prev.filter(req => req.id !== requestId))
    } catch (error) {
      console.error('Error declining friend request:', error)
      alert('Failed to decline friend request. Please try again.')
    } finally {
      setProcessingRequest(null)
    }
  }

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="mb-4 text-xl font-semibold text-text-primary">Friend Requests</h2>
        <div className="text-center py-4 text-text-secondary">
          Loading requests...
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return null // Don't show section if no requests
  }

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">
        Friend Requests
        {requests.length > 0 && (
          <span className="ml-2 text-sm font-normal text-text-secondary">
            ({requests.length})
          </span>
        )}
      </h2>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-surface-dark border border-border rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary">
                  {request.user_profile.display_name}
                </div>
                <div className="text-sm text-text-secondary">
                  @{request.user_profile.username}
                </div>
                {request.user_profile.bio && (
                  <div className="text-sm text-text-secondary mt-1">
                    {request.user_profile.bio}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => acceptRequest(request.id, request.user_id)}
                disabled={processingRequest === request.id}
                className="flex-1 flex items-center justify-center gap-2 min-h-[40px]"
              >
                <Check size={16} />
                Accept
              </Button>
              <Button
                variant="secondary"
                onClick={() => declineRequest(request.id)}
                disabled={processingRequest === request.id}
                className="flex-1 flex items-center justify-center gap-2 min-h-[40px]"
              >
                <X size={16} />
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
