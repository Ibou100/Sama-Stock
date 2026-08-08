import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id: string
  quantity: number
  unit_price: number
  product?: { id: string; name: string; sku: string }
}

export interface Invoice {
  id: string
  organization_id: string
  customer_id: string | null
  invoice_number: string
  status: 'draft' | 'paid' | 'cancelled'
  notes: string | null
  total_amount: number
  created_by: string | null
  created_at: string
  updated_at: string
  customer?: { id: string; name: string }
  items?: InvoiceItem[]
}

interface InvoiceState {
  invoices: Invoice[]
  isLoading: boolean
  error: string | null
  fetchInvoices: () => Promise<void>
  createInvoice: (invoice: Partial<Invoice>, items: Partial<InvoiceItem>[]) => Promise<void>
  updateStatus: (id: string, status: Invoice['status']) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,

  fetchInvoices: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(id, name, email, phone, address),
          items:invoice_items(*, product:products(id, name, sku))
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ invoices: data as Invoice[] })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ isLoading: false })
    }
  },

  createInvoice: async (invoicePayload, itemsPayload) => {
    set({ isLoading: true, error: null })
    try {
      const userRes = await supabase.auth.getUser()
      if (userRes.error) throw userRes.error

      const profileRes = await supabase.from('profiles').select('organization_id').eq('id', userRes.data.user.id).single()
      if (profileRes.error) throw profileRes.error
      const orgId = profileRes.data.organization_id

      // Get next invoice number
      const seqRes = await supabase.rpc('get_next_sequence_value', { seq_name: 'invoice_seq' }).single()
      const seqVal = seqRes.data || Math.floor(Math.random() * 10000)
      const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(seqVal).padStart(4, '0')}`

      // Create invoice
      const total_amount = itemsPayload.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0)
      
      const { data: invData, error: invErr } = await supabase
        .from('invoices')
        .insert({
          ...invoicePayload,
          invoice_number: invoiceNumber,
          organization_id: orgId,
          total_amount,
          status: 'paid' // Automatically paid to trigger stock reduction immediately for simplicity
        })
        .select()
        .single()
      if (invErr) throw invErr

      const invoiceId = invData.id

      // Insert items
      const itemsToInsert = itemsPayload.map(i => ({
        ...i,
        invoice_id: invoiceId
      }))
      const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsToInsert)
      if (itemsErr) throw itemsErr

      // Generate stock OUT movements automatically
      const movements = itemsToInsert.map(item => ({
        organization_id: orgId,
        product_id: item.product_id,
        movement_type: 'OUT',
        quantity: item.quantity,
        reason: `Vente - Facture ${invoiceNumber}`
      }))
      const { error: moveErr } = await supabase.from('inventory_movements').insert(movements)
      if (moveErr) throw moveErr

      await get().fetchInvoices()
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  updateStatus: async (id, status) => {
    try {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', id)
      if (error) throw error
      await get().fetchInvoices()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  deleteInvoice: async (id) => {
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      await get().fetchInvoices()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },
}))
