import { useSyncStore } from '@/stores/syncStore'
import { triggerManualSync } from '@/lib/sync'
import { useState } from 'react'

export default function SyncStatusIndicator() {
  const { status, dirtyRecords, errorMessage } = useSyncStore()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await triggerManualSync()
    } finally {
      setIsRetrying(false)
    }
  }

  // Synced state
  if (status === 'idle' && dirtyRecords.size === 0 && !errorMessage) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-success" role="status">
        <span className="text-lg">✅</span>
        <span className="font-medium">Synced</span>
      </div>
    )
  }

  // Syncing state
  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary" role="status" aria-live="polite">
        <span className="text-lg animate-spin">🔄</span>
        <span className="font-medium">Syncing...</span>
      </div>
    )
  }

  // Failed state
  if (status === 'failed' || errorMessage) {
    return (
      <div className="flex items-center gap-2" role="alert">
        <div className="flex items-center gap-1.5 text-xs text-error">
          <span className="text-lg">❌</span>
          <span className="font-medium">Sync Failed</span>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-2 py-1 text-xs font-medium text-primary bg-surface rounded hover:bg-surface-hover transition-colors disabled:opacity-50"
          aria-label="Retry sync"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    )
  }

  // Dirty records (unsaved changes)
  if (dirtyRecords.size > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-warning" role="status">
        <span className="text-lg">🔄</span>
        <span className="font-medium">{dirtyRecords.size} unsaved</span>
      </div>
    )
  }

  return null
}
