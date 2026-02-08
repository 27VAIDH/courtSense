import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'

interface ActivityEntry {
  id: string
  user_id: string
  event_type: string
  event_data: Record<string, any>
  created_at: string
  display_name: string
  username: string
}

interface GroupActivityFeedProps {
  groupId: string
}

export default function GroupActivityFeed({ groupId }: GroupActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadActivities = async () => {
    try {
      // Get group member IDs
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)

      if (membersError) throw membersError
      const memberIds = members.map((m) => m.user_id)

      // Fetch recent activity for group members
      const { data: activityData, error: activityError } = await supabase
        .from('activity_log')
        .select(`
          id,
          user_id,
          event_type,
          event_data,
          created_at,
          user_profiles!activity_log_user_id_fkey (
            display_name,
            username
          )
        `)
        .in('user_id', memberIds)
        .in('event_type', ['match_logged', 'match_updated', 'match_deleted'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (activityError) throw activityError

      const activities: ActivityEntry[] = activityData.map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        event_type: a.event_type,
        event_data: a.event_data,
        created_at: a.created_at,
        display_name: a.user_profiles.display_name,
        username: a.user_profiles.username,
      }))

      setActivities(activities)
    } catch (err) {
      console.error('Error loading activity feed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivities()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`group-activity-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          // Fetch user profile for the new activity
          supabase
            .from('user_profiles')
            .select('display_name, username')
            .eq('id', payload.new.user_id)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                const newActivity: ActivityEntry = {
                  id: payload.new.id,
                  user_id: payload.new.user_id,
                  event_type: payload.new.event_type,
                  event_data: payload.new.event_data,
                  created_at: payload.new.created_at,
                  display_name: profile.display_name,
                  username: profile.username,
                }
                setActivities((prev) => [newActivity, ...prev].slice(0, 50))
              }
            })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [groupId])

  const formatActivityMessage = (activity: ActivityEntry) => {
    const data = activity.event_data

    switch (activity.event_type) {
      case 'match_logged':
        return (
          <>
            logged a <span className="font-semibold">{data.result === 'win' ? 'win' : 'loss'}</span> vs{' '}
            {data.opponent_name} ({data.user_score}-{data.opponent_score})
          </>
        )
      case 'match_updated':
        return <>updated a match</>
      case 'match_deleted':
        return <>deleted a match</>
      default:
        return <>performed an action</>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getActivityIcon = (eventType: string, result?: string) => {
    if (eventType === 'match_logged') {
      return result === 'win' ? '🟢' : '🔴'
    }
    return '📝'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-text-secondary text-sm mt-2">Loading activity...</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="text-center py-8">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-white font-medium mb-1">No activity yet</p>
        <p className="text-sm text-text-secondary">
          Group members' match activity will appear here
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <Card key={activity.id}>
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              {getActivityIcon(activity.event_type, activity.event_data.result)}
            </div>
            <div className="flex-1">
              <p className="text-white text-sm">
                <span className="font-semibold">{activity.display_name}</span>{' '}
                {formatActivityMessage(activity)}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {formatTimestamp(activity.created_at)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
