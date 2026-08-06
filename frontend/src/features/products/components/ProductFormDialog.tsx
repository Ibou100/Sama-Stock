import { useEffect, useState } from 'react'
import { useProductStore } from '@/stores/useProductStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Product } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, X } from 'lucide-react'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}

const EMPTY = {
  name: '',
  sku: '',
  category_id: '',
  barcode: '',
  price: 0,
  cost: 0,
  min_stock: 10,
  description: '',
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { categories, createProduct, updateProduct, isLoading } = useProductStore()
  const { profile } = useAuthStore()
  const isEditing = !!product

  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (product) {
        setForm({
          name: product.name,
          sku: product.sku,
          category_id: product.category_id ?? '',
          barcode: product.barcode ?? '',
          price: product.price,
          cost: product.cost,
          min_stock: product.min_stock,
          description: product.description ?? '',
        })
      } else {
        setForm(EMPTY)
      }
      setError('')
    }
  }, [open, product])

  if (!open) return null

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name || form.name.length < 2) { setError('Le nom doit faire au moins 2 caractères.'); return }
    if (!form.sku || form.sku.length < 2) { setError('Le SKU est requis.'); return }
    if (!profile?.organization_id) { setError('Profil introuvable. Reconnectez-vous.'); return }

    const payload = {
      ...form,
      category_id: form.category_id === '' ? null : form.category_id,
      price: Number(form.price),
      cost: Number(form.cost),
      min_stock: Number(form.min_stock),
      organization_id: profile.organization_id,
    }

    try {
      if (isEditing && product) {
        await updateProduct(product.id, payload)
      } else {
        await createProduct(payload)
      }
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
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
          className="relative w-full max-w-xl glass border border-border/50 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40 sticky top-0 glass z-10">
            <div>
              <h2 className="text-base font-semibold gradient-text">
                {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Remplissez les informations du produit
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
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Nom + SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="text-sm font-medium">Nom du produit *</label>
                <Input
                  placeholder="Ex: Paracétamol 500mg"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="text-sm font-medium">SKU (Code Interne) *</label>
                <Input
                  placeholder="Ex: MED-001"
                  value={form.sku}
                  onChange={(e) => set('sku', e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Catégorie + Code-barres */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Catégorie</label>
                <select
                  value={form.category_id}
                  onChange={(e) => set('category_id', e.target.value)}
                  className="w-full h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="">— Aucune catégorie —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Code-barres</label>
                <Input
                  placeholder="Scanner ou taper..."
                  value={form.barcode}
                  onChange={(e) => set('barcode', e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Prix + Coût + Stock min */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Prix de vente (FCFA)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Coût d'achat (FCFA)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.cost}
                  onChange={(e) => set('cost', e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Stock min (alerte)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_stock}
                  onChange={(e) => set('min_stock', e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Détails supplémentaires..."
                className="resize-none bg-background/50 h-20"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
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
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading} className="glow-primary">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Mettre à jour' : 'Créer le produit'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
