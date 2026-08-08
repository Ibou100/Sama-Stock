import { useEffect, useState } from 'react'
import { useOrderStore, type PurchaseOrder } from '@/stores/useOrderStore'
import { useSupplierStore } from '@/stores/useSupplierStore'
import { useProductStore } from '@/stores/useProductStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Plus, X, Trash2, PackageCheck, ClipboardList,
  ChevronDown, ChevronUp, Truck, CheckCircle2,
  Clock, XCircle, Search, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ---- Status helpers ----
const STATUS_CONFIG = {
  pending:   { label: 'En attente',  color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  confirmed: { label: 'Confirmée',   color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  received:  { label: 'Reçue',       color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'Annulée',     color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
}

const STATUS_ICON = {
  pending: Clock,
  confirmed: Truck,
  received: CheckCircle2,
  cancelled: XCircle,
}

// ---- New Order Modal ----
function NewOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createOrder, isLoading } = useOrderStore()
  const { suppliers } = useSupplierStore()
  const { products } = useProductStore()

  const [supplierId, setSupplierId] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ product_id: string; quantity: number; unit_price: number }>>([
    { product_id: '', quantity: 1, unit_price: 0 }
  ])
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setSupplierId(''); setExpectedDate(''); setNotes('')
      setItems([{ product_id: '', quantity: 1, unit_price: 0 }])
      setError('')
    }
  }, [open])

  if (!open) return null

  const addLine = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }])
  const removeLine = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateLine = (i: number, key: string, val: any) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  const totalCost = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (items.some(i => !i.product_id)) { setError('Sélectionnez un produit pour chaque ligne.'); return }
    try {
      await createOrder(
        { supplier_id: supplierId || null, expected_date: expectedDate || null, notes: notes || null },
        items
      )
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création.')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-2xl glass border border-border/50 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40 sticky top-0 glass z-10">
            <div>
              <h2 className="text-base font-semibold gradient-text">Nouvelle commande fournisseur</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Un bon de commande sera généré automatiquement</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fournisseur</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">— Aucun fournisseur —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Date de livraison prévue</label>
                <Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="bg-background/50" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Input placeholder="Remarques, conditions particulières..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background/50" />
              </div>
            </div>

            {/* Lines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Produits commandés *</label>
                <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1 h-7 text-xs">
                  <Plus className="w-3 h-3" /> Ajouter une ligne
                </Button>
              </div>

              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-accent/20">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Produit</th>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-24">Qté</th>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-32">Prix unitaire</th>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-28">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="px-3 py-2">
                          <select
                            value={item.product_id}
                            onChange={e => updateLine(i, 'product_id', e.target.value)}
                            className="w-full h-8 rounded-md border border-border/50 bg-background/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                          >
                            <option value="">— Produit —</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number" min={1} value={item.quantity}
                            onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                            className="h-8 text-xs bg-background/50"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number" min={0} value={item.unit_price}
                            onChange={e => updateLine(i, 'unit_price', Number(e.target.value))}
                            className="h-8 text-xs bg-background/50"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-muted-foreground">
                          {(item.quantity * item.unit_price).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-3 py-2">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeLine(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-accent/10 border-t border-border/30">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-right">Total commande :</td>
                      <td className="px-3 py-2 text-sm font-bold text-primary">{totalCost.toLocaleString('fr-FR')} FCFA</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Annuler</Button>
              <Button type="submit" disabled={isLoading} className="glow-primary">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer la commande
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// ---- Order Row (expandable) ----
function OrderRow({ order }: { order: PurchaseOrder }) {
  const { updateStatus, receiveOrder, deleteOrder } = useOrderStore()
  const [expanded, setExpanded] = useState(false)
  const [receiving, setReceiving] = useState(false)

  const cfg = STATUS_CONFIG[order.status]
  const StatusIcon = STATUS_ICON[order.status]

  const totalCost = order.items?.reduce((s, i) => s + i.quantity * i.unit_price, 0) ?? 0

  const handleReceive = async () => {
    if (!confirm(`Confirmer la réception de la commande ${order.order_number} ?\n\nCela va automatiquement augmenter le stock de tous les produits commandés.`)) return
    setReceiving(true)
    try {
      await receiveOrder(order.id)
    } finally {
      setReceiving(false)
    }
  }

  return (
    <TableBody>
      <TableRow className="border-border/50 hover:bg-accent/20 transition-colors">
        <TableCell>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </TableCell>
        <TableCell className="font-mono text-sm font-semibold text-primary">{order.order_number}</TableCell>
        <TableCell className="font-medium">{order.supplier?.name ?? <span className="text-muted-foreground italic">Aucun</span>}</TableCell>
        <TableCell>
          <Badge className={`${cfg.color} border text-xs gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </Badge>
        </TableCell>
        <TableCell className="text-sm font-semibold">{totalCost.toLocaleString('fr-FR')} FCFA</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {order.expected_date ? format(new Date(order.expected_date), 'dd MMM yyyy', { locale: fr }) : '—'}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            {order.status === 'pending' && (
              <>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                  onClick={() => updateStatus(order.id, 'confirmed')}>
                  <CheckCircle2 className="w-3 h-3" /> Confirmer
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                  onClick={() => updateStatus(order.id, 'cancelled')}>
                  <XCircle className="w-3 h-3" /> Annuler
                </Button>
              </>
            )}
            {order.status === 'confirmed' && (
              <Button size="sm" className="h-7 text-xs gap-1 glow-primary" onClick={handleReceive} disabled={receiving}>
                {receiving ? <Loader2 className="w-3 h-3 animate-spin" /> : <PackageCheck className="w-3 h-3" />}
                Réceptionner
              </Button>
            )}
            {(order.status === 'cancelled' || order.status === 'received') && (
              <Button size="sm" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive p-0"
                onClick={() => confirm('Supprimer cette commande ?') && deleteOrder(order.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded items */}
      {expanded && (
        <TableRow className="bg-accent/5">
          <TableCell colSpan={8} className="py-0">
            <div className="px-8 py-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Détail de la commande</p>
              <div className="space-y-1">
                {order.items?.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b border-border/20 last:border-0">
                    <span className="font-medium">{item.product?.name ?? 'Produit supprimé'}</span>
                    <div className="flex items-center gap-6 text-muted-foreground text-xs">
                      <span>{item.quantity} unités</span>
                      <span>{item.unit_price.toLocaleString('fr-FR')} FCFA / unité</span>
                      <span className="font-semibold text-foreground">{(item.quantity * item.unit_price).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
              {order.notes && (
                <p className="text-xs text-muted-foreground mt-2 italic">📝 {order.notes}</p>
              )}
              {order.received_at && (
                <p className="text-xs text-emerald-400 mt-1">
                  ✅ Réceptionné le {format(new Date(order.received_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

// ---- Main Page ----
export function OrdersPage() {
  const { orders, isLoading, fetchOrders } = useOrderStore()
  const { fetchSuppliers } = useSupplierStore()
  const { fetchData } = useProductStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
    fetchSuppliers()
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = orders.filter(o => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.supplier?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    received: orders.filter(o => o.status === 'received').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Commandes fournisseurs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 glow-primary">
          <Plus className="w-4 h-4" /> Nouvelle commande
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: ClipboardList, color: 'text-primary' },
          { label: 'En attente', value: stats.pending, icon: Clock, color: 'text-amber-400' },
          { label: 'Confirmées', value: stats.confirmed, icon: Truck, color: 'text-blue-400' },
          { label: 'Reçues', value: stats.received, icon: PackageCheck, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="N° commande, fournisseur..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/50" />
        </div>
        <div className="flex gap-1">
          {(['all', 'pending', 'confirmed', 'received', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === s
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:bg-accent/30'
              }`}
            >
              {s === 'all' ? 'Toutes' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead>N° Commande</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Livraison prévue</TableHead>
              <TableHead>Créée le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading && (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Chargement...
                </TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isLoading && filtered.length === 0 && (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ClipboardList className="w-8 h-8" />
                    <p className="text-sm">Aucune commande trouvée</p>
                    <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
                      Créer la première commande
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isLoading && filtered.length > 0 && (
            filtered.map(order => <OrderRow key={order.id} order={order} />)
          )}
        </Table>
      </div>

      <NewOrderModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
