import { create } from 'zustand'

export interface GameScore {
  myScore: number
  opponentScore: number
}

interface MatchLogState {
  // Step 1 — Setup
  opponentId: number | null
  date: Date
  venueId: number | null
  format: 'Bo3' | 'Bo5'

  // Step 2 — Scores
  games: GameScore[]

  // Step 3 — Tags
  energyLevel: 'Low' | 'Medium' | 'High' | null
  vibe: string | null
  tags: string[]
  note: string
  photoFile: File | null

  // Navigation
  step: number

  // Actions
  setOpponentId: (id: number | null) => void
  setDate: (date: Date) => void
  setVenueId: (id: number | null) => void
  setFormat: (format: 'Bo3' | 'Bo5') => void
  setGameScore: (index: number, score: GameScore) => void
  setEnergyLevel: (level: 'Low' | 'Medium' | 'High' | null) => void
  setVibe: (vibe: string | null) => void
  toggleTag: (tag: string) => void
  setNote: (note: string) => void
  setPhotoFile: (file: File | null) => void
  setStep: (step: number) => void
  reset: () => void
}

const initialGames = (): GameScore[] => [
  { myScore: 0, opponentScore: 0 },
  { myScore: 0, opponentScore: 0 },
  { myScore: 0, opponentScore: 0 },
]

const initialState = {
  opponentId: null as number | null,
  date: new Date(),
  venueId: null as number | null,
  format: 'Bo3' as const,
  games: initialGames(),
  energyLevel: null as 'Low' | 'Medium' | 'High' | null,
  vibe: null as string | null,
  tags: [] as string[],
  note: '',
  photoFile: null as File | null,
  step: 1,
}

export const useMatchLogStore = create<MatchLogState>((set) => ({
  ...initialState,

  setOpponentId: (id) => set({ opponentId: id }),
  setDate: (date) => set({ date }),
  setVenueId: (id) => set({ venueId: id }),
  setFormat: (format) =>
    set((state) => {
      const games = format === 'Bo5'
        ? [...state.games, ...Array(5 - state.games.length).fill(null).map(() => ({ myScore: 0, opponentScore: 0 }))]
        : state.games.slice(0, 3)
      return { format, games }
    }),
  setGameScore: (index, score) =>
    set((state) => {
      const games = [...state.games]
      games[index] = score
      return { games }
    }),
  setEnergyLevel: (level) => set({ energyLevel: level }),
  setVibe: (vibe) => set({ vibe }),
  toggleTag: (tag) =>
    set((state) => ({
      tags: state.tags.includes(tag)
        ? state.tags.filter((t) => t !== tag)
        : [...state.tags, tag],
    })),
  setNote: (note) => set({ note }),
  setPhotoFile: (file) => set({ photoFile: file }),
  setStep: (step) => set({ step }),
  reset: () => set({ ...initialState, date: new Date(), games: initialGames() }),
}))
