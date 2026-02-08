import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '@/stores/settingsStore'
import { useNavigate } from 'react-router-dom'

export default function BackupReminder() {
  const { matchesSinceExport } = useSettingsStore()
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  const shouldShow = matchesSinceExport >= 10 && !dismissed

  const handleDismiss = () => {
    setDismissed(true)
  }

  const handleBackup = () => {
    navigate('/profile')
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-4 rounded-[16px] border-2 border-accent bg-surface p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-lg">💾</span>
                <span className="font-semibold text-text-primary">
                  Back up your data
                </span>
              </div>
              <p className="text-sm text-text-secondary">
                You have logged {matchesSinceExport} matches since your last export
              </p>
              <button
                onClick={handleBackup}
                className="mt-2 text-sm font-medium text-primary underline"
              >
                Go to Settings →
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-elevated"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
