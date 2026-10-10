import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface TenantOrganization {
  id: string
  name: string
  created_at: string
  plan?: string
  status?: 'active' | 'suspended' | 'trial' | string
}

export interface TenantProfile {
  id: string
  organization_id: string
  email: string
  full_name: string | null
  role: string
  is_super_admin?: boolean
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
  totalProductsCount: number
  totalInvoicesCount: number
  totalGMV: number
  isLoading: boolean
  error: string | null

  fetchPlatformData: () => Promise<void>
  toggleSuperAdmin: (userId: string, newStatus: boolean) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  updateOrgPlan: (orgId: string, plan: string) => Promise<void>
  updateOrgStatus: (orgId: string, status: string) => Promise<void>

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
  totalProductsCount: 0,
  totalInvoicesCount: 0,
  totalGMV: 0,
  isLoading: false,
  error: null,

  fetchPlatformData: async () => {
    set({ isLoading: true, error: null })
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [orgsRes, profilesRes, logsRes, productsCountRes, invoicesRes] = await Promise.all([
        supabase.from('organizations').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase
          .from('login_logs')
          .select('*')
          .gte('logged_in_at', thirtyDaysAgo.toISOString())
          .order('logged_in_at', { ascending: false }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('total_amount'),
      ])

      if (orgsRes.error) throw orgsRes.error
      if (profilesRes.error) throw profilesRes.error
      if (logsRes.error) throw logsRes.error

      const gmv = (invoicesRes.data || []).reduce((acc: number, inv: { total_amount: number }) => acc + (Number(inv.total_amount) || 0), 0)

      set({
        organizations: (orgsRes.data || []) as TenantOrganization[],
        profiles: (profilesRes.data || []) as TenantProfile[],
        loginLogs: (logsRes.data || []) as LoginLog[],
        totalProductsCount: productsCountRes.count || 0,
        totalInvoicesCount: invoicesRes.data ? invoicesRes.data.length : 0,
        totalGMV: gmv,
      })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  toggleSuperAdmin: async (userId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_super_admin', {
        target_user_id: userId,
        new_status: newStatus,
      })
      if (error) {
        // Fallback update direct si RLS le permet
        const { error: directErr } = await supabase
          .from('profiles')
          .update({ is_super_admin: newStatus })
          .eq('id', userId)
        if (directErr) throw directErr
      }

      set((state) => ({
        profiles: state.profiles.map((p) =>
          p.id === userId ? { ...p, is_super_admin: newStatus } : p
        ),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', {
        target_user_id: userId,
      })
      if (error) {
        const { error: directErr } = await supabase.from('profiles').delete().eq('id', userId)
        if (directErr) throw directErr
      }
      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== userId),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  updateOrgPlan: async (orgId: string, plan: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ plan })
        .eq('id', orgId)
      if (error) throw error
      set((state) => ({
        organizations: state.organizations.map((o) =>
          o.id === orgId ? { ...o, plan } : o
        ),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  updateOrgStatus: async (orgId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status })
        .eq('id', orgId)
      if (error) throw error
      set((state) => ({
        organizations: state.organizations.map((o) =>
          o.id === orgId ? { ...o, status } : o
        ),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  connectionsToday: () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return get().loginLogs.filter((l) => new Date(l.logged_in_at) >= today).length
  },

  connectionsThisWeek: () => {
    const now = new Date()
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    return get().loginLogs.filter((l) => new Date(l.logged_in_at) >= weekAgo).length
  },

  connectionsThisMonth: () => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return get().loginLogs.filter((l) => new Date(l.logged_in_at) >= monthStart).length
  },

  dailyConnectionsChart: () => {
    const logs = get().loginLogs
    const days: Record<string, number> = {}

    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days[key] = 0
    }

    logs.forEach((l) => {
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

    logs.forEach((l) => {
      if (l.organization_id) {
        counts[l.organization_id] = (counts[l.organization_id] || 0) + 1
      }
    })

    return orgs
      .map((org) => ({
        name: org.name.length > 15 ? org.name.substring(0, 15) + '...' : org.name,
        connexions: counts[org.id] || 0,
      }))
      .sort((a, b) => b.connexions - a.connexions)
      .slice(0, 10)
  },

  recentConnections: () => {
    return get().loginLogs.slice(0, 30)
  },
}))
