import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  product?: { id: string; name: string; sku: string }
}

export interface PurchaseOrder {
  id: string
  organization_id: string
  supplier_id: string | null
  order_number: string
  status: 'pending' | 'confirmed' | 'received' | 'cancelled'
  notes: string | null
  expected_date: string | null
  received_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  supplier?: { id: string; name: string }
  items?: OrderItem[]
}

interface OrderState {
  orders: PurchaseOrder[]
  isLoading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  createOrder: (order: Partial<PurchaseOrder>, items: Partial<OrderItem>[]) => Promise<void>
  updateStatus: (id: string, status: PurchaseOrder['status']) => Promise<void>
  deleteOrder: (id: string) => Promise<void>
  receiveOrder: (id: string) => Promise<void>
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name),
          items:purchase_order_items(*, product:products(id, name, sku))
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ orders: data as PurchaseOrder[] })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  createOrder: async (order, items) => {
    set({ isLoading: true, error: null })
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id, id').single()
      const org_id = (profile as any)?.organization_id
      const user_id = (profile as any)?.id

      // Generate order number
      const orderNum = `BC-${Date.now().toString().slice(-6)}`

      const { data: newOrder, error: orderErr } = await supabase
        .from('purchase_orders')
        .insert({
          ...order,
          organization_id: org_id,
          created_by: user_id,
          order_number: orderNum,
        })
        .select()
        .single()
      if (orderErr) throw orderErr

      // Insert items
      if (items.length > 0) {
        const { error: itemsErr } = await supabase
          .from('purchase_order_items')
          .insert(items.map(i => ({ ...i, order_id: (newOrder as any).id })))
        if (itemsErr) throw itemsErr
      }

      await get().fetchOrders()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  updateStatus: async (id, status) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      set(state => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  receiveOrder: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data: profile } = await supabase.from('profiles').select('organization_id, id').single()
      const org_id = (profile as any)?.organization_id
      const user_id = (profile as any)?.id

      // Get order with items
      const order = get().orders.find(o => o.id === id)
      if (!order || !order.items) throw new Error('Commande introuvable')

      // Create IN movements for each item
      const movements = order.items.map(item => ({
        product_id: item.product_id,
        movement_type: 'IN',
        quantity: item.quantity,
        reason: `Réception commande ${order.order_number}`,
        organization_id: org_id,
        created_by: user_id,
      }))

      if (movements.length > 0) {
        const { error: movErr } = await supabase.from('inventory_movements').insert(movements)
        if (movErr) throw movErr
      }

      // Mark as received
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: 'received', received_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error

      await get().fetchOrders()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  deleteOrder: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
      if (error) throw error
      set(state => ({ orders: state.orders.filter(o => o.id !== id) }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },
}))
