import { useEffect, useState } from 'react'
import { useSupplierStore } from '@/stores/useSupplierStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Supplier } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

const supplierSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  contact_name: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})
type SupplierFormValues = z.infer<typeof supplierSchema>

// --- Supplier Form Dialog ---
function SupplierFormDialog({ open, onOpenChange, supplier }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: Supplier
}) {
  const { createSupplier, updateSupplier, isLoading } = useSupplierStore()
  const { profile } = useAuthStore()
  const isEditing = !!supplier

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', contact_name: '', email: '', phone: '', address: '', notes: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset(supplier ? {
        name: supplier.name,
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      } : { name: '', contact_name: '', email: '', phone: '', address: '', notes: '' })
    }
  }, [open, supplier, form])

  const onSubmit = async (values: SupplierFormValues) => {
    if (!profile?.organization_id) return
    try {
      const payload = { ...values, organization_id: profile.organization_id }
      if (isEditing && supplier) {
        await updateSupplier(supplier.id, payload)
      } else {
        await createSupplier(payload)
      }
      onOpenChange(false)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-background/95 backdrop-blur-xl border-border/50 text-foreground">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}</DialogTitle>
          <DialogDescription>Renseignez les coordonnées du fournisseur.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Nom du fournisseur *</FormLabel>
                  <FormControl><Input placeholder="Ex: Pharma Dakar SARL" className="bg-background/50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="contact_name" render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Nom du contact</FormLabel>
                  <FormControl><Input placeholder="Ex: Moussa Diop" className="bg-background/50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl><Input placeholder="+221 77 000 00 00" className="bg-background/50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="contact@fournisseur.com" className="bg-background/50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl><Input placeholder="Ex: Rue 10, Medina, Dakar" className="bg-background/50" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea placeholder="Conditions de paiement, délais de livraison..." className="resize-none bg-background/50" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={isLoading} className="glow-primary">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// --- Main Suppliers Page ---
export function SuppliersPage() {
  const { suppliers, isLoading, fetchSuppliers, deleteSupplier } = useSupplierStore()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>()

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (s: Supplier) => { setEditingSupplier(s); setDialogOpen(true) }
  const handleNew = () => { setEditingSupplier(undefined); setDialogOpen(true) }
  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce fournisseur ?')) await deleteSupplier(id)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Fournisseurs</h1>
          <p className="text-muted-foreground mt-1">Gérez vos contacts fournisseurs et partenaires.</p>
        </div>
        <Button onClick={handleNew} className="glow-primary">
          <Plus className="w-4 h-4 mr-2" /> Nouveau Fournisseur
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un fournisseur..."
          className="pl-9 bg-card/30 border-border/50"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-md overflow-hidden shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>Fournisseur</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <p>{search ? 'Aucun résultat.' : 'Aucun fournisseur pour le moment.'}</p>
                    {!search && <Button variant="outline" onClick={handleNew}>Ajouter le premier fournisseur</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(s => (
                <TableRow key={s.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                  <TableCell className="font-semibold text-foreground">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.contact_name ? <span className="flex items-center gap-1"><User className="w-3 h-3" />{s.contact_name}</span> : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.phone ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span> : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.email ? <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span> : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[180px] truncate">
                    {s.address ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.address}</span> : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => handleEdit(s)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SupplierFormDialog open={dialogOpen} onOpenChange={setDialogOpen} supplier={editingSupplier} />
    </div>
  )
}
