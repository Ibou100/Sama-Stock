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
