import { useEffect } from 'react'
import { ensureCurrentUser } from '@/db/database'

function App() {
  useEffect(() => {
    ensureCurrentUser()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-white">
      <h1 className="text-3xl font-bold">SquashIQ</h1>
    </div>
  )
}

export default App
