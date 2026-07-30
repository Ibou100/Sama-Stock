import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types'

interface ProductState {
  products: Product[]
  categories: Category[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchData: () => Promise<void>
  createProduct: (product: Partial<Product>) => Promise<void>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  
  createCategory: (category: Partial<Category>) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null })
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*, categories(*)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
      ])

      if (productsRes.error) throw productsRes.error
      if (categoriesRes.error) throw categoriesRes.error

      set({ 
        products: productsRes.data as unknown as Product[], 
        categories: categoriesRes.data as Category[],
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createProduct: async (product) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.from('products').insert(product).select('*, categories(*)').single()
      if (error) throw error
      set((state) => ({ products: [data as unknown as Product, ...state.products], isLoading: false }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  updateProduct: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.from('products').update(updates).eq('id', id).select('*, categories(*)').single()
      if (error) throw error
      set((state) => ({
        products: state.products.map(p => p.id === id ? data as unknown as Product : p),
        isLoading: false
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      set((state) => ({
        products: state.products.filter(p => p.id !== id),
        isLoading: false
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  createCategory: async (category) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.from('categories').insert(category).select().single()
      if (error) throw error
      set((state) => ({ categories: [...state.categories, data as Category], isLoading: false }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  updateCategory: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single()
      if (error) throw error
      set((state) => ({
        categories: state.categories.map(c => c.id === id ? data as Category : c),
        isLoading: false
      }))
      // Also trigger a full fetch to update the categories in the products list
      get().fetchData()
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      set((state) => ({
        categories: state.categories.filter(c => c.id !== id),
        isLoading: false
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  }
}))
