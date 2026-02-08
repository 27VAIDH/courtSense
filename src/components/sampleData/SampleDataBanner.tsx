import { useEffect, useState } from 'react'
import { hasSampleData } from '@/lib/sampleData'

/**
 * Banner shown on Dashboard when sample data exists.
 * Informs user that they're viewing sample data and encourages logging real matches.
 */
export default function SampleDataBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const checkSampleData = async () => {
      const hasSample = await hasSampleData()
      setShowBanner(hasSample)
    }
    checkSampleData()
  }, [])

  if (!showBanner) return null

  return (
    <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">👀</span>
        <div className="flex-1">
          <p className="text-sm text-text-primary font-medium">
            This is sample data
          </p>
          <p className="text-xs text-text-secondary mt-1">
            Log your first real match to replace it and start tracking your actual improvement!
          </p>
        </div>
      </div>
    </div>
  )
}
