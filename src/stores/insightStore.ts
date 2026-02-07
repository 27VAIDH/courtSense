import { create } from 'zustand'

export type InsightId =
  | 'winRateByOpponent'
  | 'energyImpact'
  | 'bestDays'
  | 'venueEffect'
  | 'decidingGames'
  | 'comebackIndex'
  | 'currentForm'
  | 'fastStarter'

interface InsightState {
  /** Set of insight IDs that have been seen in their unlocked state */
  seenUnlocked: Set<InsightId>
  /** Mark an insight as having been seen unlocked (animation played) */
  markSeen: (id: InsightId) => void
}

const STORAGE_KEY = 'squashiq-seen-unlocked'

function loadSeenUnlocked(): Set<InsightId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr: InsightId[] = JSON.parse(raw)
      return new Set(arr)
    }
  } catch {
    // ignore parse errors
  }
  return new Set()
}

function saveSeenUnlocked(seen: Set<InsightId>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
}

export const useInsightStore = create<InsightState>((set) => ({
  seenUnlocked: loadSeenUnlocked(),
  markSeen: (id) =>
    set((state) => {
      const next = new Set(state.seenUnlocked)
      next.add(id)
      saveSeenUnlocked(next)
      return { seenUnlocked: next }
    }),
}))
