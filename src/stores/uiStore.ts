import { create } from 'zustand'

interface UIState {
  tabBarVisible: boolean
  showTabBar: () => void
  hideTabBar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  tabBarVisible: true,
  showTabBar: () => set({ tabBarVisible: true }),
  hideTabBar: () => set({ tabBarVisible: false }),
}))
