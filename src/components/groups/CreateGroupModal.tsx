import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (groupId: string) => void
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const { user } = useAuthStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [privacy, setPrivacy] = useState<'private' | 'public'>('private')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          owner_id: user.id,
          privacy,
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add owner as group member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) throw memberError

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user.id,
        event_type: 'group_created',
        event_data: {
          group_id: group.id,
          group_name: name.trim(),
          privacy,
        },
      })

      // Success
      setName('')
      setDescription('')
      setPrivacy('private')
      onSuccess(group.id)
      onClose()
    } catch (err) {
      console.error('Error creating group:', err)
      setError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md bg-surface-elevated rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-surface-base">
          <h2 className="text-xl font-bold text-white">Create Group</h2>
          <p className="text-sm text-text-secondary mt-1">
            Start a private group for your squash club or friends
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Group Name */}
          <div>
            <label htmlFor="group-name" className="block text-sm font-medium text-white mb-2">
              Group Name <span className="text-primary">*</span>
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Squash Club"
              required
              maxLength={50}
              className="w-full px-4 py-3 bg-surface-base text-white rounded-lg border border-surface-elevated focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="group-description" className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what this group is about..."
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 bg-surface-base text-white rounded-lg border border-surface-elevated focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="text-xs text-text-secondary mt-1">{description.length}/200</p>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Privacy</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                  privacy === 'private'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-base border-surface-elevated text-text-secondary hover:border-primary/50'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    🔒 Private
                  </div>
                  <div className="text-xs mt-1">Members only</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                  privacy === 'public'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-base border-surface-elevated text-text-secondary hover:border-primary/50'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    🌍 Public
                  </div>
                  <div className="text-xs mt-1">Anyone can view</div>
                </div>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-loss/10 border border-loss/20 text-loss px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
