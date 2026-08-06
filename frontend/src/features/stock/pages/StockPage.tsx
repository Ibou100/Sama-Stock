import { useEffect, useState } from 'react'
import { useStockStore } from '@/stores/useStockStore'
import { useProductStore } from '@/stores/useProductStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { StockMovementDialog } from '../components/StockMovementDialog'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function StockPage() {
  const { movements, isLoading: isLoadingStock, fetchMovements } = useStockStore()
  const { fetchData: fetchProducts, isLoading: isLoadingProducts } = useProductStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchMovements()
    fetchProducts()
  }, [fetchMovements, fetchProducts])

  const isLoading = isLoadingStock || isLoadingProducts

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mouvements de Stock
          </h1>
          <p className="text-muted-foreground mt-1">
            Historique des entrées et sorties de votre inventaire.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="glow-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Mouvement
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-md overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Auteur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chargement de l'historique...
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                        <ArrowUpRight className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p>Aucun mouvement de stock pour le moment.</p>
                      <Button variant="outline" onClick={() => setDialogOpen(true)}>
                        Faire une première entrée
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                      {format(new Date(movement.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {movement.product?.name || 'Produit supprimé'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {movement.product?.sku}
                      </div>
                    </TableCell>
                    <TableCell>
                      {movement.movement_type === 'IN' ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <ArrowDownRight className="w-3 h-3 mr-1" />
                          Entrée
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          Sortie
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {movement.movement_type === 'IN' ? '+' : '-'}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[200px]">
                      {movement.reason || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.creator?.full_name || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <StockMovementDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
