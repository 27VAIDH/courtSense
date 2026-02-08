import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ensureCurrentUser } from '@/db/database'
import { isOnboardingComplete, markOnboardingComplete } from '@/lib/onboarding'
import BottomTabBar from '@/components/layout/BottomTabBar'
import BadgeToast from '@/components/badges/BadgeToast'
import Onboarding from '@/components/onboarding/Onboarding'
import AuthGuard from '@/components/auth/AuthGuard'
import AuthPage from '@/pages/AuthPage'
import AuthCallback from '@/pages/AuthCallback'
import Dashboard from '@/pages/Dashboard'
import LogMatch from '@/pages/LogMatch'
import Timeline from '@/pages/Timeline'
import Rivals from '@/pages/Rivals'
import RivalryDetail from '@/pages/RivalryDetail'
import Profile from '@/pages/Profile'
import PostMatchSaved from '@/pages/PostMatchSaved'
import MatchDetail from '@/pages/MatchDetail'
import { useAuthStore } from '@/stores/authStore'
import { performSync } from '@/lib/sync'
import { processPhotoUploadQueue } from '@/lib/photoUpload'

function App() {
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingComplete())
  const { initialize, session } = useAuthStore()

  useEffect(() => {
    ensureCurrentUser()
    initialize() // Initialize auth on app load
  }, [initialize])

  // Sync on app load (after auth initialized)
  useEffect(() => {
    if (session) {
      performSync()
    }
  }, [session])

  // Sync on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (session) {
        performSync()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [session])

  // Process photo upload queue when online
  useEffect(() => {
    if (!session) return

    const handleOnline = () => {
      processPhotoUploadQueue()
    }

    // Process queue immediately if online
    if (navigator.onLine) {
      processPhotoUploadQueue()
    }

    // Listen for online event
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [session])

  const handleOnboardingComplete = () => {
    markOnboardingComplete()
    setShowOnboarding(false)
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <AuthGuard>
            {showOnboarding ? (
              <Onboarding onComplete={handleOnboardingComplete} />
            ) : (
              <div className="min-h-screen bg-[#0A0A0A] text-white pb-20">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/log" element={<LogMatch />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/rivals" element={<Rivals />} />
                  <Route path="/rivals/:opponentId" element={<RivalryDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/match/:id" element={<MatchDetail />} />
                  <Route path="/match/:id/saved" element={<PostMatchSaved />} />
                </Routes>
                <BottomTabBar />
                <BadgeToast />
              </div>
            )}
          </AuthGuard>
        }
      />
    </Routes>
  )
}

export default App
