import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * PWA Install Banner for iOS
 *
 * Shows a dismissible banner encouraging users to install SquashIQ as a PWA.
 * iOS doesn't support the beforeinstallprompt event, so we show custom instructions.
 */
export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-banner-dismissed')
    if (dismissed) {
      return
    }

    // Check if running in standalone mode (already installed)
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches
    if (isInstalled) {
      return
    }

    // Check if running on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)

    if (isIOS && isSafari) {
      setShowBanner(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-banner-dismissed', 'true')
    setShowBanner(false)
  }

  const handleHowToInstall = () => {
    setShowInstructions(!showInstructions)
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-4">
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[16px] p-4 border border-primary/30 shadow-lg backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Add SquashIQ to your home screen
            </h3>
            <p className="text-xs text-text-secondary">
              Get the best experience with offline access and faster loading
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-text-secondary hover:text-text-primary transition-colors p-1"
            aria-label="Dismiss banner"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleHowToInstall}
            className="flex-1 bg-primary text-bg font-semibold text-sm py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            {showInstructions ? 'Hide Instructions' : 'How to Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="bg-surface text-text-primary font-semibold text-sm py-2 px-4 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            Later
          </button>
        </div>

        {showInstructions && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <ol className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold">1.</span>
                <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold">2.</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold">3.</span>
                <span>Tap <strong>Add</strong> in the top-right corner</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
