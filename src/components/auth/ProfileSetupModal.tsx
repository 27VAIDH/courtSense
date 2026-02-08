import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

interface ProfileSetupModalProps {
  onComplete: () => void
}

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const { user } = useAuthStore()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  // Username validation
  const validateUsername = (value: string): boolean => {
    setUsernameError(null)

    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      return false
    }

    if (value.length > 20) {
      setUsernameError('Username must be at most 20 characters')
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores')
      return false
    }

    return true
  }

  // Check username uniqueness
  const checkUsernameUnique = async (value: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', value.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (username is available)
      console.error('Username check error:', error)
      return false
    }

    if (data) {
      setUsernameError('Username already taken')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError('No authenticated user found')
      return
    }

    setError(null)
    setLoading(true)

    try {
      // Validate username format
      if (!validateUsername(username)) {
        setLoading(false)
        return
      }

      // Check username uniqueness
      const isUnique = await checkUsernameUnique(username)
      if (!isUnique) {
        setLoading(false)
        return
      }

      // Create user_profiles record
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          username: username.toLowerCase(),
          display_name: displayName.trim(),
          bio: null,
          privacy_setting: 'friends',
          user_tier: 'free',
          feature_flags: {},
        })

      if (profileError) {
        throw profileError
      }

      // Create default player record
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          name: displayName.trim(),
          is_current_user: true,
          last_modified_ms: Date.now(),
          deleted_at: null,
        })

      if (playerError) {
        throw playerError
      }

      // Success! Call completion callback
      onComplete()
    } catch (err) {
      console.error('Profile creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-setup-title"
    >
      <div className="bg-[#1A1A1A] rounded-lg max-w-md w-full p-6">
        <h2 id="profile-setup-title" className="text-2xl font-bold text-white mb-2">Welcome to SquashIQ!</h2>
        <p className="text-gray-400 mb-6">Let's set up your profile to get started.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name Input */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0A0A] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#00E676]"
              placeholder="How should we call you?"
              required
              maxLength={50}
            />
          </div>

          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setUsernameError(null)
              }}
              onBlur={(e) => validateUsername(e.target.value)}
              className={`w-full px-3 py-2 bg-[#0A0A0A] border ${
                usernameError ? 'border-red-500' : 'border-gray-700'
              } rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#00E676]`}
              placeholder="Choose a unique username"
              required
              minLength={3}
              maxLength={20}
            />
            {usernameError && (
              <p className="text-red-500 text-sm mt-1">{usernameError}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">3-20 characters, letters, numbers, and underscores only</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-md p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00E676] hover:bg-[#00C853] disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Creating Profile...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
