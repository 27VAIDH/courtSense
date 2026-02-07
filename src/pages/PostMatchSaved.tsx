import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import Button from '@/components/ui/Button'

export default function PostMatchSaved() {
  const navigate = useNavigate()
  const { hideTabBar, showTabBar } = useUIStore()

  useEffect(() => {
    hideTabBar()
    return () => showTabBar()
  }, [hideTabBar, showTabBar])

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg px-6">
      <div className="text-6xl mb-4">🏸</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Match Saved!</h1>
      <p className="text-text-secondary mb-8 text-center">
        Your match has been logged successfully.
      </p>
      <Button onClick={() => { showTabBar(); navigate('/') }} className="w-full max-w-xs">
        Done
      </Button>
    </div>
  )
}
