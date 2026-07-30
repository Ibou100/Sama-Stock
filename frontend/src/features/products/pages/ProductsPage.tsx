import { useEffect, useState } from 'react'
import { useProductStore } from '@/stores/useProductStore'
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
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | undefined>()

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            Gérez votre inventaire et vos références
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
      <div className="flex items-center gap-4 glass p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom ou SKU..." 
            className="pl-9 bg-background/50 border-border/50 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="glass rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-accent/30">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Produit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Prix (FCFA)</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Chargement des produits...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                  return (
                    <TableRow key={product.id} className="border-border/30 hover:bg-accent/20 transition-colors">
                      <TableCell className="font-medium">
                        <div>
                          <p className="text-foreground">{product.name}</p>
                          {product.barcode && <p className="text-[10px] text-muted-foreground">Code: {product.barcode}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{product.sku}</TableCell>
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
                          {product.current_stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="h-8 w-8 hover:text-primary">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id, product.name)} className="h-8 w-8 hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
