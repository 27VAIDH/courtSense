import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Chip from '@/components/ui/Chip'
import GroupLeaderboard from '@/components/groups/GroupLeaderboard'
import GroupActivityFeed from '@/components/groups/GroupActivityFeed'

interface GroupInfo {
  id: string
  name: string
  description: string | null
  privacy: 'private' | 'public'
  owner_id: string
  created_at: string
}

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  display_name: string
  username: string
}

type TabType = 'leaderboard' | 'members' | 'activity'

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('leaderboard')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member' | null>(null)

  const loadGroupData = async () => {
    if (!groupId || !user) return

    setLoading(true)
    try {
      // Fetch group info
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) throw groupError
      setGroup(groupData)

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          user_profiles!group_members_user_id_fkey (
            display_name,
            username
          )
        `)
        .eq('group_id', groupId)

      if (membersError) throw membersError

      const membersList: Member[] = membersData
        .map((m: any): Member => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role as 'owner' | 'admin' | 'member',
          joined_at: m.joined_at,
          display_name: m.user_profiles.display_name,
          username: m.user_profiles.username,
        }))
        .sort((a, b) => {
          // Sort by role first (owner, admin, member), then by join date
          const roleOrder: Record<'owner' | 'admin' | 'member', number> = { owner: 0, admin: 1, member: 2 }
          const aOrder = roleOrder[a.role]
          const bOrder = roleOrder[b.role]
          if (aOrder !== bOrder) {
            return aOrder - bOrder
          }
          return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
        })

      setMembers(membersList)

      // Check if current user is a member
      const userMember = membersList.find((m) => m.user_id === user.id)
      setIsMember(!!userMember)
      setCurrentUserRole(userMember?.role || null)
    } catch (err) {
      console.error('Error loading group:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroupData()
  }, [groupId, user])

  const handleLeaveGroup = async () => {
    if (!user || !groupId) return

    if (currentUserRole === 'owner') {
      alert('Owners cannot leave groups. Delete the group or transfer ownership first.')
      return
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

      if (error) throw error

      navigate('/rivals')
    } catch (err) {
      console.error('Error leaving group:', err)
      alert('Failed to leave group')
    }
  }

  const handleDeleteGroup = async () => {
    if (!user || !groupId || currentUserRole !== 'owner') return

    try {
      // Delete group (cascade will delete members and related data)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('owner_id', user.id)

      if (error) throw error

      navigate('/rivals')
    } catch (err) {
      console.error('Error deleting group:', err)
      alert('Failed to delete group')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-text-secondary text-sm mt-2">Loading group...</p>
        </div>
      </div>
    )
  }

  if (!group || !isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">Group Not Found</h1>
          <p className="text-text-secondary mb-6">
            This group doesn't exist or you don't have access.
          </p>
          <Button onClick={() => navigate('/rivals')}>Back to Rivals</Button>
        </div>
      </div>
    )
  }

  const isOwner = currentUserRole === 'owner'

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-surface-elevated">
        <div className="p-4">
          <button
            onClick={() => navigate('/rivals')}
            className="text-text-secondary hover:text-white mb-2 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{group.name}</h1>
              {group.description && (
                <p className="text-sm text-text-secondary mt-1">{group.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  {group.privacy === 'private' ? '🔒' : '🌍'}
                  {group.privacy === 'private' ? 'Private' : 'Public'}
                </span>
                <span>•</span>
                <span>
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-2">
          <Chip selected={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')}>
            Leaderboard
          </Chip>
          <Chip selected={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
            Activity
          </Chip>
          <Chip selected={activeTab === 'members'} onClick={() => setActiveTab('members')}>
            Members
          </Chip>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {activeTab === 'leaderboard' && <GroupLeaderboard groupId={groupId!} members={members} />}
        {activeTab === 'activity' && <GroupActivityFeed groupId={groupId!} />}
        {activeTab === 'members' && (
          <div className="space-y-3">
            {members.map((member) => (
              <Card key={member.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{member.display_name}</p>
                    <p className="text-sm text-text-secondary">@{member.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === 'owner' && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        Owner
                      </span>
                    )}
                    {member.role === 'admin' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-6 space-y-3">
        {!isOwner && (
          <Button
            variant="secondary"
            onClick={handleLeaveGroup}
            className="w-full"
          >
            Leave Group
          </Button>
        )}
        {isOwner && (
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-loss"
            >
              Delete Group
            </Button>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">Delete Group?</h2>
            <p className="text-text-secondary mb-6">
              This action cannot be undone. All group data, including leaderboards and activity, will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteGroup}
                className="flex-1 bg-loss hover:bg-loss/80"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
