import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ArchetypeHistoryEntry {
  archetype: string // archetype name
  date: string // ISO date string
}

interface ArchetypeHistoryState {
  history: ArchetypeHistoryEntry[]
  addArchetype: (archetypeName: string) => void
}

export const useArchetypeHistoryStore = create<ArchetypeHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addArchetype: (archetypeName: string) =>
        set((state) => {
          // Check if the most recent entry is the same archetype
          const lastEntry = state.history[state.history.length - 1]
          if (lastEntry && lastEntry.archetype === archetypeName) {
            // Same archetype, don't add duplicate
            return state
          }

          // New archetype or first entry - add to history
          const newEntry: ArchetypeHistoryEntry = {
            archetype: archetypeName,
            date: new Date().toISOString(),
          }

          return {
            history: [...state.history, newEntry],
          }
        }),
    }),
    {
      name: 'archetype-history-storage',
    }
  )
)
