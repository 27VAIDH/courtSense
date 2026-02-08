import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    if (get().initialized) return

    try {
      set({ loading: true })

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null })
      })

      set({ initialized: true })
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    try {
      set({ loading: true })
      await supabase.auth.signOut()
      set({ user: null, session: null })

      // Clear other stores if needed
      // This will be called from the Settings page
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))
