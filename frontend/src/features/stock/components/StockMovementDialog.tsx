import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useStockStore } from '@/stores/useStockStore'
import { useProductStore } from '@/stores/useProductStore'
import { useAuthStore } from '@/stores/useAuthStore'
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

const movementSchema = z.object({
  product_id: z.string().min(1, 'Veuillez sélectionner un produit'),
  movement_type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(1, 'La quantité doit être supérieure à 0'),
  reason: z.string().optional(),
})

type MovementFormValues = z.infer<typeof movementSchema>

interface StockMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockMovementDialog({ open, onOpenChange }: StockMovementDialogProps) {
  const { addMovement, isLoading: isSaving } = useStockStore()
  const { products } = useProductStore()
  const { profile } = useAuthStore()

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      product_id: '',
      movement_type: 'IN',
      quantity: 1,
      reason: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        product_id: '',
        movement_type: 'IN',
        quantity: 1,
        reason: '',
      })
    }
  }, [open, form])

  const onSubmit = async (values: MovementFormValues) => {
    if (!profile?.organization_id || !profile?.id) return
    
    try {
      await addMovement({
        ...values,
        organization_id: profile.organization_id,
        created_by: profile.id
      })
      onOpenChange(false)
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'enregistrement du mouvement')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 text-foreground">
        <DialogHeader>
          <DialogTitle>Enregistrer un mouvement de stock</DialogTitle>
          <DialogDescription>
            Saisissez une entrée (ex: livraison) ou une sortie (ex: vente, perte).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produit *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Sélectionner le produit..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Stock actuel: {p.current_stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="movement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IN" className="text-green-500 font-medium">Entrée (Ajout)</SelectItem>
                        <SelectItem value="OUT" className="text-red-500 font-medium">Sortie (Retrait)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} className="bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif / Client (Optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Vente comptoir, Livraison fournisseur..." 
                      className="resize-none bg-background/50" 
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
              <Button type="submit" disabled={isSaving} className="glow-primary">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
