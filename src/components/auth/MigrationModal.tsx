import { useEffect, useState } from 'react'

interface MigrationModalProps {
  onMigrationComplete: () => void
  onMigrationStart: () => void
  totalRecords: number
  progress?: number
  currentStep?: string
  error?: string | null
}

export default function MigrationModal({
  onMigrationComplete,
  onMigrationStart,
  totalRecords,
  progress: externalProgress,
  currentStep: externalStep,
  error: externalError,
}: MigrationModalProps) {
  const [isStarted, setIsStarted] = useState(false)

  const progress = externalProgress || 0
  const currentStep = externalStep || ''
  const error = externalError || null

  const handleStart = () => {
    setIsStarted(true)
    onMigrationStart()
  }

  // This will be called by the parent to update progress
  useEffect(() => {
    if (progress >= totalRecords && progress > 0) {
      // Migration complete
      setTimeout(() => {
        onMigrationComplete()
      }, 1000)
    }
  }, [progress, totalRecords, onMigrationComplete])

  const handleRetry = () => {
    setIsStarted(true)
    onMigrationStart()
  }

  const progressPercentage = totalRecords > 0 ? (progress / totalRecords) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-[#1A1A1A] rounded-3xl p-8 max-w-md w-full border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">
              {!isStarted ? 'Backup Your Data' : error ? 'Migration Paused' : 'Migrating Your Data'}
            </h2>
          </div>
          <p className="text-gray-400 text-sm">
            {!isStarted
              ? `We found ${totalRecords} local ${totalRecords === 1 ? 'record' : 'records'}. Let's back them up to the cloud.`
              : error
              ? 'Something went wrong. Your data is safe locally.'
              : 'Please wait while we upload your match history...'}
          </p>
        </div>

        {/* Progress Section */}
        {isStarted && !error && (
          <div className="mb-6">
            {/* Progress Bar */}
            <div className="bg-[#0A0A0A] rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#00E676] to-[#00C853] h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Progress Text */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{currentStep}</span>
              <span className="text-white font-semibold">
                {progress}/{totalRecords}
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!isStarted && (
          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-[#00E676] to-[#00C853] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            Start Migration
          </button>
        )}

        {error && (
          <button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-[#00E676] to-[#00C853] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            Retry Migration
          </button>
        )}

        {/* Info Note */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          Your local data will remain safe and serve as a cache
        </p>
      </div>
    </div>
  )
}

// Export update functions for parent to control the modal
export interface MigrationModalController {
  setProgress: (progress: number) => void
  setCurrentStep: (step: string) => void
  setError: (error: string | null) => void
}
