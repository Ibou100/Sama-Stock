import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

export type BusinessType = 'general' | 'pharmacy' | 'quincaillerie' | 'supermarket'

export interface Organization {
  id: string
  name: string
  business_type: BusinessType
  enable_expiry_tracking: boolean
  enable_extended_units: boolean
  enable_serial_numbers: boolean
  plan?: string
  status?: string
  created_at?: string
  updated_at?: string
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: any | null
  organization: Organization | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: any | null) => void
  setOrganization: (organization: Organization | null) => void
  setLoading: (isLoading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  organization: null,
  isLoading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setOrganization: (organization) => set({ organization }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: () => set({ session: null, user: null, profile: null, organization: null }),
}))
