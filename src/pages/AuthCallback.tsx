import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        )

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/auth', { replace: true })
          return
        }

        // Redirect to dashboard on success
        navigate('/', { replace: true })
      } catch (error) {
        console.error('Unexpected auth callback error:', error)
        navigate('/auth', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E676] mx-auto mb-4"></div>
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  )
}
