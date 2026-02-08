import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ensureCurrentUser } from '@/db/database'
import BottomTabBar from '@/components/layout/BottomTabBar'
import BadgeToast from '@/components/badges/BadgeToast'
import Dashboard from '@/pages/Dashboard'
import LogMatch from '@/pages/LogMatch'
import Timeline from '@/pages/Timeline'
import Rivals from '@/pages/Rivals'
import Profile from '@/pages/Profile'
import PostMatchSaved from '@/pages/PostMatchSaved'
import MatchDetail from '@/pages/MatchDetail'

function App() {
  useEffect(() => {
    ensureCurrentUser()
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<LogMatch />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/rivals" element={<Rivals />} />
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
