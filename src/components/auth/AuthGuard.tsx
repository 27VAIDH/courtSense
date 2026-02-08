import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import ProfileSetupModal from './ProfileSetupModal'
import MigrationModal from './MigrationModal'
import {
  checkIfMigrationNeeded,
  getTotalRecordsToMigrate,
  performMigration,
} from '@/lib/migration'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const { session, loading, initialized, initialize, setProfileComplete } = useAuthStore()
  const [profileExists, setProfileExists] = useState<boolean | null>(null)
  const [profileChecking, setProfileChecking] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showMigration, setShowMigration] = useState(false)
  const [migrationInProgress, setMigrationInProgress] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [migrationStep, setMigrationStep] = useState('')
  const [migrationError, setMigrationError] = useState<string | null>(null)

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
          .select('id, username')
          .eq('id', session.user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error('Profile check error:', error)
          setProfileExists(false)
        } else if (data) {
          setProfileExists(true)
          // Update Sentry user context with username
          Sentry.setUser({
            id: session.user.id,
            email: session.user.email,
            username: data.username,
          })
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

  const handleProfileSetupComplete = async () => {
    setShowProfileSetup(false)
    setProfileExists(true)
    setProfileComplete(true)

    // Check if migration is needed after profile setup
    if (session?.user) {
      await checkMigration()
    }
  }

  const checkMigration = async () => {
    if (!session?.user) return

    // Check if migration already completed
    const migrationCompleted = localStorage.getItem('migration_completed')
    if (migrationCompleted === 'true') {
      return
    }

    try {
      const needsMigration = await checkIfMigrationNeeded(session.user.id)
      if (needsMigration) {
        const totalCount = await getTotalRecordsToMigrate()
        setTotalRecords(totalCount)
        setShowMigration(true)
      }
    } catch (error) {
      console.error('Error checking migration:', error)
    }
  }

  const handleMigrationStart = async () => {
    if (!session?.user) return

    setMigrationInProgress(true)
    setMigrationError(null)

    const success = await performMigration(session.user.id, {
      onProgress: (current, _total, step) => {
        setMigrationProgress(current)
        setMigrationStep(step)
      },
      onError: (error) => {
        setMigrationError(error)
        setMigrationInProgress(false)
      },
    })

    if (success) {
      setMigrationInProgress(false)
    }
  }

  const handleMigrationComplete = () => {
    setShowMigration(false)
    setMigrationProgress(0)
    setMigrationStep('')
  }

  // Check migration after profile is confirmed to exist
  useEffect(() => {
    if (profileExists === true && !showProfileSetup && !migrationInProgress && !showMigration) {
      checkMigration()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileExists, showProfileSetup])

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

  // Show migration modal if needed
  if (showMigration) {
    return (
      <MigrationModal
        totalRecords={totalRecords}
        progress={migrationProgress}
        currentStep={migrationStep}
        error={migrationError}
        onMigrationStart={handleMigrationStart}
        onMigrationComplete={handleMigrationComplete}
      />
    )
  }

  // Render children if authenticated and profile exists
  return <>{children}</>
}
