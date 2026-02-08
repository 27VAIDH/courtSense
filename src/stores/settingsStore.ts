import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  tightGameThreshold: number
  lastExportDate: Date | null
  matchesSinceExport: number

  setTightGameThreshold: (threshold: number) => void
  recordExport: () => void
  incrementMatchCount: () => void
  resetMatchCount: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      tightGameThreshold: 8,
      lastExportDate: null,
      matchesSinceExport: 0,

      setTightGameThreshold: (threshold) => set({ tightGameThreshold: threshold }),

      recordExport: () => set({
        lastExportDate: new Date(),
        matchesSinceExport: 0
      }),

      incrementMatchCount: () => set((state) => ({
        matchesSinceExport: state.matchesSinceExport + 1
      })),

      resetMatchCount: () => set({ matchesSinceExport: 0 }),
    }),
    {
      name: 'squashiq-settings',
    }
  )
)
