import { useEffect, useState } from 'react'
import { useSupplierStore } from '@/stores/useSupplierStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Supplier } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin, User, X, Truck, Loader2 } from 'lucide-react'

const EMPTY = { name: '', contact_name: '', email: '', phone: '', address: '', notes: '' }

function SupplierFormDialog({ open, onOpenChange, supplier }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: Supplier
}) {
  const { createSupplier, updateSupplier, isLoading } = useSupplierStore()
  const { profile } = useAuthStore()
  const isEditing = !!supplier
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(supplier ? {
        name: supplier.name,
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      } : EMPTY)
      setError('')
    }
  }, [open, supplier])

  if (!open) return null

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || form.name.length < 2) { setError('Le nom est requis (min. 2 caractères).'); return }
    if (!profile?.organization_id) { setError('Profil introuvable. Reconnectez-vous.'); return }
    try {
      const payload = { ...form, organization_id: profile.organization_id }
      if (isEditing && supplier) {
        await updateSupplier(supplier.id, payload)
      } else {
        await createSupplier(payload)
      }
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-lg glass border border-border/50 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40 sticky top-0 glass z-10">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <div>
                <h2 className="text-base font-semibold gradient-text">
                  {isEditing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Coordonnées du fournisseur</p>
              </div>
            </div>
            <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="text-sm font-medium">Nom du fournisseur *</label>
                <Input placeholder="Ex: Pharma Dakar SARL" value={form.name} onChange={e => set('name', e.target.value)} className="bg-background/50" />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="text-sm font-medium">Nom du contact</label>
                <Input placeholder="Ex: Moussa Diop" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Téléphone</label>
                <Input placeholder="+221 77 000 00 00" value={form.phone} onChange={e => set('phone', e.target.value)} className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" placeholder="contact@fournisseur.com" value={form.email} onChange={e => set('email', e.target.value)} className="bg-background/50" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Adresse</label>
                <Input placeholder="Ex: Rue 10, Médina, Dakar" value={form.address} onChange={e => set('address', e.target.value)} className="bg-background/50" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Textarea placeholder="Conditions de paiement, délais de livraison..." className="resize-none bg-background/50" value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
              <Button type="submit" disabled={isLoading} className="glow-primary">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Fournisseurs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {suppliers.length} fournisseur{suppliers.length > 1 ? 's' : ''} enregistré{suppliers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleNew} className="glow-primary gap-2">
          <Plus className="w-4 h-4" /> Nouveau fournisseur
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un fournisseur..." className="pl-9 bg-background/50" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="glass rounded-xl border border-border/50 overflow-hidden">
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
                  <div className="flex flex-col items-center gap-3">
                    <Truck className="w-8 h-8" />
                    <p className="text-sm">{search ? 'Aucun résultat.' : 'Aucun fournisseur pour le moment.'}</p>
                    {!search && <Button variant="outline" size="sm" onClick={handleNew}>Ajouter le premier fournisseur</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(s => (
                <TableRow key={s.id} className="border-border/50 hover:bg-accent/20 transition-colors">
                  <TableCell className="font-medium">{s.name}</TableCell>
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
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(s)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
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
