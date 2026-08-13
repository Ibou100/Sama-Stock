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
  full_name: string | null
  role: string
  created_at: string
}

export interface LoginLog {
  id: string
  user_id: string
  email: string
  organization_id: string | null
  logged_in_at: string
}

export interface DailyConnectionData {
  date: string
  connexions: number
}

export interface OrgConnectionData {
  name: string
  connexions: number
}

interface SuperAdminState {
  organizations: TenantOrganization[]
  profiles: TenantProfile[]
  loginLogs: LoginLog[]
  isLoading: boolean
  error: string | null
  fetchPlatformData: () => Promise<void>

  // Computed getters
  connectionsToday: () => number
  connectionsThisWeek: () => number
  connectionsThisMonth: () => number
  dailyConnectionsChart: () => DailyConnectionData[]
  orgConnectionsChart: () => OrgConnectionData[]
  recentConnections: () => LoginLog[]
}

export const useSuperAdminStore = create<SuperAdminState>((set, get) => ({
  organizations: [],
  profiles: [],
  loginLogs: [],
  isLoading: false,
  error: null,

  fetchPlatformData: async () => {
    set({ isLoading: true, error: null })
    try {
      // Fetch last 30 days of login logs
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [orgsResponse, profilesResponse, logsResponse] = await Promise.all([
        supabase.from('organizations').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('login_logs').select('*').gte('logged_in_at', thirtyDaysAgo.toISOString()).order('logged_in_at', { ascending: false }),
      ])

      if (orgsResponse.error) throw orgsResponse.error
      if (profilesResponse.error) throw profilesResponse.error
      if (logsResponse.error) throw logsResponse.error

      set({
        organizations: orgsResponse.data as TenantOrganization[],
        profiles: profilesResponse.data as TenantProfile[],
        loginLogs: logsResponse.data as LoginLog[],
      })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  connectionsToday: () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return get().loginLogs.filter(l => new Date(l.logged_in_at) >= today).length
  },

  connectionsThisWeek: () => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    return get().loginLogs.filter(l => new Date(l.logged_in_at) >= weekAgo).length
  },

  connectionsThisMonth: () => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return get().loginLogs.filter(l => new Date(l.logged_in_at) >= monthStart).length
  },

  dailyConnectionsChart: () => {
    const logs = get().loginLogs
    const days: Record<string, number> = {}

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days[key] = 0
    }

    // Count logs per day
    logs.forEach(l => {
      const key = new Date(l.logged_in_at).toISOString().split('T')[0]
      if (key in days) {
        days[key]++
      }
    })

    return Object.entries(days).map(([date, connexions]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      connexions,
    }))
  },

  orgConnectionsChart: () => {
    const logs = get().loginLogs
    const orgs = get().organizations
    const counts: Record<string, number> = {}

    logs.forEach(l => {
      if (l.organization_id) {
        counts[l.organization_id] = (counts[l.organization_id] || 0) + 1
      }
    })

    return orgs
      .map(org => ({
        name: org.name.length > 15 ? org.name.substring(0, 15) + '...' : org.name,
        connexions: counts[org.id] || 0,
      }))
      .sort((a, b) => b.connexions - a.connexions)
      .slice(0, 10)
  },

  recentConnections: () => {
    return get().loginLogs.slice(0, 20)
  },
}))
