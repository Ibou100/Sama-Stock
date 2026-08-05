import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProductStore } from '@/stores/useProductStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Product } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const productSchema = z.object({
  name: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  sku: z.string().min(2, 'Le SKU est requis'),
  category_id: z.string().optional().nullable(),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0, 'Le prix ne peut pas être négatif'),
  cost: z.coerce.number().min(0, 'Le coût ne peut pas être négatif'),
  min_stock: z.coerce.number().min(0, 'Le stock minimum ne peut pas être négatif'),
  description: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { categories, createProduct, updateProduct, isLoading } = useProductStore()
  const { profile } = useAuthStore()
  const isEditing = !!product

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category_id: 'none',
      barcode: '',
      price: 0,
      cost: 0,
      min_stock: 10,
      description: '',
    },
  })

  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        sku: product.sku,
        category_id: product.category_id || 'none',
        barcode: product.barcode || '',
        price: product.price,
        cost: product.cost,
        min_stock: product.min_stock,
        description: product.description || '',
      })
    } else if (open) {
      form.reset({
        name: '',
        sku: '',
        category_id: 'none',
        barcode: '',
        price: 0,
        cost: 0,
        min_stock: 10,
        description: '',
      })
    }
  }, [product, open, form])

  const onSubmit = async (values: ProductFormValues) => {
    if (!profile?.organization_id) return
    
    // Convert 'none' back to null for database
    const payload = {
      ...values,
      category_id: values.category_id === 'none' ? null : values.category_id,
      organization_id: profile.organization_id
    }

    try {
      if (isEditing && product) {
        await updateProduct(product.id, payload)
      } else {
        await createProduct(payload)
      }
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to save product', error)
      alert(error.message || 'Une erreur est survenue lors de la sauvegarde du produit.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-border/50 text-foreground">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</DialogTitle>
          <DialogDescription>
            Remplissez les détails du produit. Cliquez sur sauvegarder une fois terminé.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Nom du produit *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Paracétamol 500mg" className="bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>SKU (Code Interne) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: MED-001" className="bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'none'} value={field.value || 'none'}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune catégorie</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Code-barres</FormLabel>
                    <FormControl>
                      <Input placeholder="Scanner ou taper..." className="bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de Vente</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coût d'Achat</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="min_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Min (Alerte)</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Détails supplémentaires..." 
                      className="resize-none bg-background/50 h-20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading} className="glow-primary">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Mettre à jour' : 'Créer le produit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
