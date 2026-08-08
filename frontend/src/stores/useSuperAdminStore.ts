import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface TenantOrganization {
  id: string
  name: string
  created_at: string
}

export interface TenantProfile {
  id: string
  organization_id: string
  email: string
  role: string
  created_at: string
}

interface SuperAdminState {
  organizations: TenantOrganization[]
  profiles: TenantProfile[]
  isLoading: boolean
  error: string | null
  fetchPlatformData: () => Promise<void>
}

export const useSuperAdminStore = create<SuperAdminState>((set) => ({
  organizations: [],
  profiles: [],
  isLoading: false,
  error: null,

  fetchPlatformData: async () => {
    set({ isLoading: true, error: null })
    try {
      const [orgsResponse, profilesResponse] = await Promise.all([
        supabase.from('organizations').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false })
      ])

      if (orgsResponse.error) throw orgsResponse.error
      if (profilesResponse.error) throw profilesResponse.error

      set({ 
        organizations: orgsResponse.data as TenantOrganization[],
        profiles: profilesResponse.data as TenantProfile[]
      })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },
}))
