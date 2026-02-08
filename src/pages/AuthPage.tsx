import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/db/database'

export default function AuthPage() {
  const navigate = useNavigate()
  const { session, loading } = useAuthStore()
  const [localMatchCount, setLocalMatchCount] = useState<number>(0)

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (session && !loading) {
      navigate('/', { replace: true })
    }
  }, [session, loading, navigate])

  useEffect(() => {
    // Check for local IndexedDB data
    const checkLocalData = async () => {
      try {
        const count = await db.matches.count()
        setLocalMatchCount(count)
      } catch (error) {
        console.error('Error checking local data:', error)
      }
    }
    checkLocalData()
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6">
      {/* Local Data Banner */}
      {!session && localMatchCount > 0 && (
        <div className="w-full max-w-md mb-6 bg-gradient-to-r from-[#00E676]/20 to-[#00C853]/20 border border-[#00E676]/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💾</span>
            <div>
              <div className="font-semibold text-white">
                You have {localMatchCount} {localMatchCount === 1 ? 'match' : 'matches'} stored locally
              </div>
              <div className="text-sm text-gray-300">
                Sign in to back them up to the cloud!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center mb-12 max-w-md">
        <div className="mb-6">
          <div className="text-6xl font-bold bg-gradient-to-r from-[#00E676] to-[#00C853] bg-clip-text text-transparent">
            SquashIQ
          </div>
        </div>
        <p className="text-xl text-gray-300 mb-8">
          Your squash journey, synced across all devices
        </p>

        {/* Value Props */}
        <div className="space-y-4 text-left bg-[#1A1A1A] rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="font-semibold text-white">Deep insights</div>
              <div className="text-sm text-gray-400">Advanced analytics to improve your game</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <div className="font-semibold text-white">Never lose data</div>
              <div className="text-sm text-gray-400">Automatic cloud sync across all devices</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <div className="font-semibold text-white">Compete with friends</div>
              <div className="text-sm text-gray-400">Join leaderboards and track rivalries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth UI */}
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-2xl p-8">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#00E676',
                  brandAccent: '#00C853',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#1A1A1A',
                  defaultButtonBackgroundHover: '#2A2A2A',
                  defaultButtonBorder: '#3A3A3A',
                  defaultButtonText: 'white',
                  dividerBackground: '#3A3A3A',
                  inputBackground: '#0A0A0A',
                  inputBorder: '#3A3A3A',
                  inputBorderHover: '#00E676',
                  inputBorderFocus: '#00E676',
                  inputText: 'white',
                  inputLabelText: '#9CA3AF',
                  inputPlaceholder: '#6B7280',
                },
                space: {
                  inputPadding: '12px',
                  buttonPadding: '12px 16px',
                },
                fontSizes: {
                  baseInputSize: '16px',
                  baseButtonSize: '16px',
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '12px',
                  buttonBorderRadius: '12px',
                  inputBorderRadius: '12px',
                },
              },
            },
          }}
          providers={['google']}
          redirectTo={`${window.location.origin}/auth/callback`}
          onlyThirdPartyProviders
          showLinks={false}
        />
      </div>

      {/* Footer Note */}
      <p className="text-sm text-gray-500 mt-8 text-center max-w-md">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
