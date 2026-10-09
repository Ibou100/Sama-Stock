import { useEffect, useState } from 'react'
import { useProductStore } from '@/stores/useProductStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Product } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit2, Trash2, Tag, Box, AlertTriangle } from 'lucide-react'
import { ProductFormDialog } from '../components/ProductFormDialog'
import { CategoryManagerDialog } from '../components/CategoryManagerDialog'

export function ProductsPage() {
  const { products, isLoading, fetchData, deleteProduct } = useProductStore()
  const { profile, organization } = useAuthStore()
  const bType = organization?.business_type || 'general'
  const showExpiry = bType === 'pharmacy' || bType === 'supermarket' || !!organization?.enable_expiry_tracking
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | undefined>()

  const [filterType, setFilterType] = useState<'all' | 'low-stock' | 'expiring'>('all')

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getExpiryStatus = (expiryDate?: string | null) => {
    if (!expiryDate) return null
    const diff = new Date(expiryDate).getTime() - new Date().setHours(0, 0, 0, 0)
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Périmé', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', days }
    if (days <= 30) return { label: `Périme ds ${days}j`, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', days }
    if (days <= 90) return { label: `Périme ds ${days}j`, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', days }
    return { label: `Exp: ${new Date(expiryDate).toLocaleDateString('fr-FR')}`, color: 'bg-muted/40 text-muted-foreground border-border/40', days }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.batch_number && p.batch_number.toLowerCase().includes(searchTerm.toLowerCase()))

    if (!matchesSearch) return false

    if (filterType === 'low-stock') {
      return p.current_stock <= p.min_stock
    }

    if (filterType === 'expiring') {
      if (!p.expiry_date) return false
      const status = getExpiryStatus(p.expiry_date)
      return status && status.days <= 90
    }

    return true
  })

  const lowStockCount = products.filter(p => p.current_stock <= p.min_stock).length
  const expiringCount = products.filter(p => {
    if (!p.expiry_date) return false
    const status = getExpiryStatus(p.expiry_date)
    return status && status.days <= 90
  }).length

  const handleEdit = (product: Product) => {
    setProductToEdit(product)
    setIsProductDialogOpen(true)
  }

  const handleAdd = () => {
    setProductToEdit(undefined)
    setIsProductDialogOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le produit "${name}" ?`)) {
      await deleteProduct(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Catalogue Produits</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez votre inventaire, unités de mesure et traçabilité des lots
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="glass hover:bg-accent"
            onClick={() => setIsCategoryDialogOpen(true)}
          >
            <Tag className="w-4 h-4 mr-2" />
            Catégories
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white glow-primary"
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 glass p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher nom, SKU, code-barres, lot..." 
            className="pl-9 bg-background/50 border-border/50 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-primary text-white'
                : 'bg-accent/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            Tous ({products.length})
          </button>
          <button
            onClick={() => setFilterType('low-stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterType === 'low-stock'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Stock faible ({lowStockCount})
          </button>
          {showExpiry && (
            <button
              onClick={() => setFilterType('expiring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterType === 'expiring'
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              Péremptions ({expiringCount})
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="glass rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-accent/30">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Produit</TableHead>
                <TableHead>{showExpiry ? 'SKU & Lot' : 'SKU'}</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Prix (FCFA)</TableHead>
                <TableHead className="text-right">Stock & Unité</TableHead>
                {showExpiry && <TableHead className="text-center">Statut Péremption</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showExpiry ? 7 : 6} className="h-24 text-center text-muted-foreground">
                    Chargement des produits...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showExpiry ? 7 : 6} className="h-24 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Box className="w-8 h-8 text-muted-foreground/50" />
                      <p>Aucun produit trouvé.</p>
                      {searchTerm && (
                        <Button variant="link" onClick={() => setSearchTerm('')}>
                          Effacer la recherche
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.current_stock <= product.min_stock
                  const expiryStatus = getExpiryStatus(product.expiry_date)
                  return (
                    <TableRow key={product.id} className="border-border/30 hover:bg-accent/20 transition-colors">
                      <TableCell className="font-medium">
                        <div>
                          <p className="text-foreground">{product.name}</p>
                          {product.barcode && <p className="text-[10px] text-muted-foreground">Code: {product.barcode}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <p>{product.sku}</p>
                        {product.batch_number && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-foreground/70">
                            Lot: {product.batch_number}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-accent/30 text-muted-foreground border-border/50">
                          {product.categories?.name || 'Sans catégorie'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {product.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant="secondary" 
                          className={isLowStock 
                            ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25' 
                            : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {product.current_stock} {product.unit || 'pièce(s)'}
                        </Badge>
                      </TableCell>
                      {showExpiry && (
                        <TableCell className="text-center">
                          {expiryStatus ? (
                            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${expiryStatus.color}`}>
                              {expiryStatus.label}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="h-8 w-8 hover:text-primary">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {((profile as any)?.role === 'owner' || (profile as any)?.role === 'admin') && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id, product.name)} className="h-8 w-8 hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialogs */}
      <ProductFormDialog 
        open={isProductDialogOpen} 
        onOpenChange={setIsProductDialogOpen} 
        product={productToEdit} 
      />
      <CategoryManagerDialog 
        open={isCategoryDialogOpen} 
        onOpenChange={setIsCategoryDialogOpen} 
      />
    </div>
  )
}
