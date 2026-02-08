import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import CreateGroupModal from './CreateGroupModal'

interface Group {
  id: string
  name: string
  description: string | null
  privacy: 'private' | 'public'
  owner_id: string
  created_at: string
  member_count: number
  is_owner: boolean
}

export default function GroupsList() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadGroups = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch groups where user is a member
      const { data: memberGroups, error: memberError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups (
            id,
            name,
            description,
            privacy,
            owner_id,
            created_at
          )
        `)
        .eq('user_id', user.id)

      if (memberError) throw memberError

      // Get member counts for each group
      const groupIds = memberGroups.map((m: any) => m.groups.id)
      const { data: memberCounts, error: countError } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds)

      if (countError) throw countError

      // Count members per group
      const countsMap = new Map<string, number>()
      memberCounts.forEach((m: any) => {
        countsMap.set(m.group_id, (countsMap.get(m.group_id) || 0) + 1)
      })

      // Transform data
      const groupsList: Group[] = memberGroups
        .map((m: any) => ({
          id: m.groups.id,
          name: m.groups.name,
          description: m.groups.description,
          privacy: m.groups.privacy,
          owner_id: m.groups.owner_id,
          created_at: m.groups.created_at,
          member_count: countsMap.get(m.groups.id) || 0,
          is_owner: m.groups.owner_id === user.id,
        }))
        .sort((a, b) => {
          // Owner groups first, then by creation date
          if (a.is_owner && !b.is_owner) return -1
          if (!a.is_owner && b.is_owner) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

      setGroups(groupsList)
    } catch (err) {
      console.error('Error loading groups:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [user])

  const handleCreateSuccess = (groupId: string) => {
    loadGroups()
    navigate(`/groups/${groupId}`)
  }

  if (loading) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-text-secondary text-sm mt-2">Loading groups...</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-white">Your Groups</h2>
          <p className="text-xs text-text-secondary">Compete with your squash club</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="text-sm px-4 py-2"
        >
          + Create
        </Button>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card className="text-center py-8">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-white font-medium mb-1">No groups yet</p>
          <p className="text-sm text-text-secondary mb-4">
            Create a group for your squash club or friends
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="mx-auto">
            Create Your First Group
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="cursor-pointer hover:bg-surface-elevated/50 transition-colors active:scale-98"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{group.name}</h3>
                    {group.is_owner && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Owner
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      {group.privacy === 'private' ? '🔒' : '🌍'}
                      {group.privacy === 'private' ? 'Private' : 'Public'}
                    </span>
                    <span>•</span>
                    <span>
                      {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
                <div className="text-text-secondary">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
