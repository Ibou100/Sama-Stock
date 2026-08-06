import { useEffect, useState } from 'react'
import { useCustomerStore, type Customer } from '@/stores/useCustomerStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Mail,
  Phone,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const EMPTY: Partial<Customer> = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  notes: '',
}

export function CustomersPage() {
  const { customers, isLoading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } =
    useCustomerStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<Partial<Customer>>(EMPTY)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '', city: c.city ?? '', notes: c.notes ?? '' })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updateCustomer(editing.id, form)
    } else {
      await createCustomer(form)
    }
    setOpen(false)
  }

  const filtered = customers.filter((c) =>
    `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Clients</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {customers.length} client{customers.length > 1 ? 's' : ''} enregistré{customers.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 glow-primary">
          <Plus className="w-4 h-4" />
          Nouveau client
        </Button>
      </div>

      {/* Custom Modal */}
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="relative w-full max-w-lg glass border border-border/50 rounded-2xl shadow-2xl pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
                <h2 className="text-base font-semibold gradient-text">
                  {editing ? 'Modifier le client' : 'Nouveau client'}
                </h2>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Nom complet *</Label>
                    <Input required placeholder="Ex: Mamadou Diallo" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@exemple.com" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Téléphone</Label>
                    <Input placeholder="+221 77 000 00 00" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-background/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ville</Label>
                    <Input placeholder="Dakar" value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-background/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Adresse</Label>
                    <Input placeholder="Rue 10, Médina" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="bg-background/50" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Notes</Label>
                    <Input placeholder="Remarques optionnelles..." value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-background/50" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button type="submit" className="glow-primary">{editing ? 'Mettre à jour' : 'Créer'}</Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}


      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total clients', value: customers.length, icon: Users, color: 'text-primary' },
          { label: 'Avec email', value: customers.filter((c) => c.email).length, icon: Mail, color: 'text-emerald-400' },
          { label: 'Avec téléphone', value: customers.filter((c) => c.phone).length, icon: Phone, color: 'text-violet-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-accent/30 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Nom</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Date d'ajout</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="w-8 h-8" />
                    <p className="text-sm">Aucun client trouvé</p>
                    <Button variant="outline" size="sm" onClick={openCreate}>
                      Ajouter votre premier client
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="border-border/50 hover:bg-accent/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-violet-500/60 flex items-center justify-center text-xs font-bold text-white">
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {c.email && (
                        <p className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(c.city || c.address) && (
                      <p className="text-xs flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {[c.city, c.address].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(c.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteCustomer(c.id)}
                      >
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
    </div>
  )
}
