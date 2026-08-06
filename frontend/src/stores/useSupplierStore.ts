import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Supplier } from '@/types'

interface SupplierState {
  suppliers: Supplier[]
  isLoading: boolean
  error: string | null
  fetchSuppliers: () => Promise<void>
  createSupplier: (data: Partial<Supplier>) => Promise<void>
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  isLoading: false,
  error: null,

  fetchSuppliers: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      set({ suppliers: data as Supplier[] })
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  createSupplier: async (data) => {
    const { error } = await supabase.from('suppliers').insert(data)
    if (error) throw error
    await get().fetchSuppliers()
  },

  updateSupplier: async (id, data) => {
    const { error } = await supabase.from('suppliers').update(data).eq('id', id)
    if (error) throw error
    await get().fetchSuppliers()
  },

  deleteSupplier: async (id) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) throw error
    set(state => ({ suppliers: state.suppliers.filter(s => s.id !== id) }))
  },
}))
