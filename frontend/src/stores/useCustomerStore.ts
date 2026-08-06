import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Customer {
  id: string
  organization_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  notes: string | null
  total_orders: number
  created_at: string
}

interface CustomerState {
  customers: Customer[]
  isLoading: boolean
  error: string | null
  fetchCustomers: () => Promise<void>
  createCustomer: (c: Partial<Customer>) => Promise<void>
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ customers: data as Customer[] })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  createCustomer: async (customer) => {
    set({ isLoading: true, error: null })
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single()
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, organization_id: (profile as any)?.organization_id })
        .select()
        .single()
      if (error) throw error
      set((state) => ({ customers: [data as Customer, ...state.customers] }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  updateCustomer: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? (data as Customer) : c)),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
      set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },
}))
