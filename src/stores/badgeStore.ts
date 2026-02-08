import { create } from 'zustand'
import type { EarnedBadge } from '@/lib/badges'

interface BadgeState {
  /** Badges the user has earned */
  earnedBadges: EarnedBadge[]
  /** Newly earned badges that haven't been shown yet */
  newBadges: EarnedBadge[]
  /** Set earned badges (called after badge detection) */
  setEarnedBadges: (badges: EarnedBadge[]) => void
  /** Mark a new badge as shown */
  markBadgeShown: (badgeId: string) => void
  /** Clear all new badges */
  clearNewBadges: () => void
}

const STORAGE_KEY = 'squashiq-earned-badges'

function loadEarnedBadges(): EarnedBadge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const badges = JSON.parse(raw)
      // Parse dates from strings
      return badges.map((b: any) => ({
        ...b,
        earnedAt: new Date(b.earnedAt),
      }))
    }
  } catch {
    // ignore parse errors
  }
  return []
}

function saveEarnedBadges(badges: EarnedBadge[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(badges))
}

export const useBadgeStore = create<BadgeState>((set) => ({
  earnedBadges: loadEarnedBadges(),
  newBadges: [],

  setEarnedBadges: (badges) =>
    set((state) => {
      const previousIds = new Set(state.earnedBadges.map((b) => b.id))
      const newlyEarned = badges.filter((b) => !previousIds.has(b.id))

      saveEarnedBadges(badges)

      return {
        earnedBadges: badges,
        newBadges: [...state.newBadges, ...newlyEarned],
      }
    }),

  markBadgeShown: (badgeId) =>
    set((state) => ({
      newBadges: state.newBadges.filter((b) => b.id !== badgeId),
    })),

  clearNewBadges: () => set({ newBadges: [] }),
}))
