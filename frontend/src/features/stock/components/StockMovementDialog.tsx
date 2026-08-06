import { useEffect, useState } from 'react'
import { useStockStore } from '@/stores/useStockStore'
import { useProductStore } from '@/stores/useProductStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

interface StockMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockMovementDialog({ open, onOpenChange }: StockMovementDialogProps) {
  const { addMovement, isLoading: isSaving } = useStockStore()
  const { products } = useProductStore()
  const { profile } = useAuthStore()

  const [productId, setProductId] = useState('')
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setProductId('')
      setMovementType('IN')
      setQuantity(1)
      setReason('')
      setError('')
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!productId) {
      setError('Veuillez sélectionner un produit.')
      return
    }
    if (quantity < 1) {
      setError('La quantité doit être supérieure à 0.')
      return
    }
    if (!profile?.organization_id || !profile?.id) {
      setError('Profil introuvable. Reconnectez-vous.')
      return
    }

    try {
      await addMovement({
        product_id: productId,
        movement_type: movementType as any,
        quantity,
        reason: reason || undefined,
        organization_id: profile.organization_id,
        created_by: profile.id,
      })
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement.')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md glass border border-border/50 rounded-2xl shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
            <div>
              <h2 className="text-base font-semibold gradient-text">Mouvement de stock</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enregistrez une entrée ou une sortie
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Type de mouvement */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de mouvement *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMovementType('IN')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    movementType === 'IN'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                      : 'border-border/50 text-muted-foreground hover:bg-accent/30'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Entrée
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('OUT')}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    movementType === 'OUT'
                      ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                      : 'border-border/50 text-muted-foreground hover:bg-accent/30'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Sortie
                </button>
              </div>
            </div>

            {/* Produit */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Produit *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">— Sélectionner un produit —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock : {p.current_stock})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantité */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Quantité *</label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="bg-background/50"
              />
            </div>

            {/* Motif */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Motif (optionnel)</label>
              <Textarea
                placeholder="Ex: Vente comptoir, Livraison fournisseur, Perte..."
                className="resize-none bg-background/50"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className={`glow-primary ${movementType === 'OUT' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
