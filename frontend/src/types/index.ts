export interface Profile {
  id: string
  organization_id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

export interface Category {
  id: string
  organization_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  organization_id: string
  category_id: string | null
  name: string
  sku: string
  barcode: string | null
  description: string | null
  price: number
  cost: number
  min_stock: number
  current_stock: number
  created_at: string
  updated_at: string
  
  // Relations
  categories?: Category
}

export interface InventoryMovement {
  id: string
  organization_id: string
  product_id: string
  created_by: string | null
  movement_type: 'IN' | 'OUT'
  quantity: number
  reason: string | null
  created_at: string
  
  // Joins (optional)
  product?: Product
  creator?: Pick<Profile, 'id' | 'full_name'>
}
