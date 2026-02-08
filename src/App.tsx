import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ensureCurrentUser } from '@/db/database'
import { isOnboardingComplete, markOnboardingComplete } from '@/lib/onboarding'
import BottomTabBar from '@/components/layout/BottomTabBar'
import BadgeToast from '@/components/badges/BadgeToast'
import Onboarding from '@/components/onboarding/Onboarding'
import Dashboard from '@/pages/Dashboard'
import LogMatch from '@/pages/LogMatch'
import Timeline from '@/pages/Timeline'
import Rivals from '@/pages/Rivals'
import RivalryDetail from '@/pages/RivalryDetail'
import Profile from '@/pages/Profile'
import PostMatchSaved from '@/pages/PostMatchSaved'
import MatchDetail from '@/pages/MatchDetail'

function App() {
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingComplete())

  useEffect(() => {
    ensureCurrentUser()
  }, [])

  const handleOnboardingComplete = () => {
    markOnboardingComplete()
    setShowOnboarding(false)
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
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
  )
}

export default App
