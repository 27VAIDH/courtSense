import { ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const { session, loading, initialized, initialize } = useAuthStore()

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

  // Show loading state while initializing
  if (loading || !initialized) {
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

  // Render children if authenticated
  return <>{children}</>
}
