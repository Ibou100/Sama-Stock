import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { InventoryMovement } from '@/types'
import { useProductStore } from './useProductStore'

interface StockState {
  movements: InventoryMovement[]
  isLoading: boolean
  error: string | null
  
  fetchMovements: () => Promise<void>
  addMovement: (movement: Partial<InventoryMovement>) => Promise<void>
}

export const useStockStore = create<StockState>((set, get) => ({
  movements: [],
  isLoading: false,
  error: null,

  fetchMovements: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          product:products(*),
          creator:profiles(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      set({ movements: data as any[] })
    } catch (error: any) {
      console.error('Error fetching movements:', error)
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  addMovement: async (movement) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('inventory_movements')
        .insert(movement)
      
      if (error) throw error
      
      // Refresh movements
      await get().fetchMovements()
      // Also trigger a refresh of products so current_stock updates everywhere
      await useProductStore.getState().fetchData()
    } catch (error: any) {
      console.error('Error adding movement:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  }
}))
