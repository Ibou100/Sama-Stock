import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  organization_id: string
  email: string
  full_name: string | null
  role: 'owner' | 'admin' | 'employee'
  created_at: string
}

interface TeamState {
  members: Profile[]
  isLoading: boolean
  error: string | null
  fetchMembers: () => Promise<void>
}

export const useTeamStore = create<TeamState>((set) => ({
  members: [],
  isLoading: false,
  error: null,

  fetchMembers: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      set({ members: data as Profile[] })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },
}))
