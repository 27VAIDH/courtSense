import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'failed'

export type DirtyRecord = {
  table: 'players' | 'venues' | 'matches' | 'games' | 'rally_analyses'
  id: number // Local IndexedDB ID
}

interface SyncState {
  status: SyncStatus
  dirtyRecords: Set<string> // Serialized as "table:id"
  lastSyncTimestamp: number
  errorMessage: string | null
  retryCount: number

  // Actions
  setStatus: (status: SyncStatus) => void
  markDirty: (record: DirtyRecord) => void
  markClean: (record: DirtyRecord) => void
  clearDirty: () => void
  setLastSyncTimestamp: (timestamp: number) => void
  setError: (message: string | null) => void
  incrementRetry: () => void
  resetRetry: () => void
}

// Load initial state from localStorage
const loadLastSyncTimestamp = (): number => {
  try {
    const stored = localStorage.getItem('lastSyncTimestamp')
    return stored ? parseInt(stored, 10) : 0
  } catch {
    return 0
  }
}

const serializeRecord = (record: DirtyRecord): string => `${record.table}:${record.id}`

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  dirtyRecords: new Set(),
  lastSyncTimestamp: loadLastSyncTimestamp(),
  errorMessage: null,
  retryCount: 0,

  setStatus: (status) => set({ status }),

  markDirty: (record) => {
    const { dirtyRecords } = get()
    const key = serializeRecord(record)
    set({ dirtyRecords: new Set(dirtyRecords).add(key) })
  },

  markClean: (record) => {
    const { dirtyRecords } = get()
    const newSet = new Set(dirtyRecords)
    newSet.delete(serializeRecord(record))
    set({ dirtyRecords: newSet })
  },

  clearDirty: () => set({ dirtyRecords: new Set() }),

  setLastSyncTimestamp: (timestamp) => {
    localStorage.setItem('lastSyncTimestamp', timestamp.toString())
    set({ lastSyncTimestamp: timestamp })
  },

  setError: (message) => set({ errorMessage: message, status: message ? 'failed' : get().status }),

  incrementRetry: () => set((state) => ({ retryCount: state.retryCount + 1 })),

  resetRetry: () => set({ retryCount: 0 }),
}))
