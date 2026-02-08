/**
 * Haptics utility using Vibration API
 * Respects prefers-reduced-motion setting
 */

let prefersReducedMotion = false

// Check prefers-reduced-motion on initialization
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion = mediaQuery.matches

  // Update on changes
  mediaQuery.addEventListener('change', (e) => {
    prefersReducedMotion = e.matches
  })
}

/**
 * Trigger light haptic feedback (10ms)
 * Used for button presses and UI interactions
 */
export function triggerLightHaptic() {
  if (prefersReducedMotion) return
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

/**
 * Trigger success haptic feedback (3 short bursts)
 * Used for successful operations like match save
 */
export function triggerSuccessHaptic() {
  if (prefersReducedMotion) return
  if ('vibrate' in navigator) {
    navigator.vibrate([50, 50, 50])
  }
}

/**
 * Trigger error haptic feedback (2 medium bursts)
 * Used for errors or failed operations
 */
export function triggerErrorHaptic() {
  if (prefersReducedMotion) return
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 100])
  }
}
