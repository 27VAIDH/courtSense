import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import ProfileSetupModal from './ProfileSetupModal'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const { session, loading, initialized, initialize, setProfileComplete } = useAuthStore()
  const [profileExists, setProfileExists] = useState<boolean | null>(null)
  const [profileChecking, setProfileChecking] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)

  useEffect(() => {
    // Initialize auth store on first mount
    if (!initialized) {
      initialize()
    }
  }, [initialized, initialize])

  useEffect(() => {
    // Redirect to auth page if not authenticated (once initialization is complete)
    if (!loading && initialized && !session) {
      navigate('/auth', { replace: true })
    }
  }, [session, loading, initialized, navigate])

  useEffect(() => {
    // Check if user profile exists after authentication
    const checkProfile = async () => {
      if (!session?.user) return

      setProfileChecking(true)

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error('Profile check error:', error)
          setProfileExists(false)
        } else if (data) {
          setProfileExists(true)
        } else {
          setProfileExists(false)
        }
      } catch (err) {
        console.error('Profile check error:', err)
        setProfileExists(false)
      } finally {
        setProfileChecking(false)
      }
    }

    if (session && !loading && initialized && profileExists === null) {
      checkProfile()
    }
  }, [session, loading, initialized, profileExists])

  useEffect(() => {
    // Show profile setup modal if profile doesn't exist
    if (profileExists === false && !profileChecking) {
      setShowProfileSetup(true)
    }
  }, [profileExists, profileChecking])

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false)
    setProfileExists(true)
    setProfileComplete(true)
  }

  // Show loading state while initializing or checking profile
  if (loading || !initialized || profileChecking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E676] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show nothing if not authenticated (will redirect)
  if (!session) {
    return null
  }

  // Show profile setup modal if needed
  if (showProfileSetup) {
    return <ProfileSetupModal onComplete={handleProfileSetupComplete} />
  }

  // Render children if authenticated and profile exists
  return <>{children}</>
}
