const ONBOARDING_KEY = 'onboarding-complete'

export function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true'
  } catch {
    return false
  }
}

export function markOnboardingComplete(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true')
  } catch {
    // If localStorage is unavailable, fail silently
  }
}
