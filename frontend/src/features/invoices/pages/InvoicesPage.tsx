import { useEffect, useState } from 'react'
import { useInvoiceStore, type Invoice } from '@/stores/useInvoiceStore'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { useProductStore } from '@/stores/useProductStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Plus, X, Trash2, Receipt, Search, Loader2,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, FileText, Download
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'

const STATUS_CONFIG = {
  draft:     { label: 'Brouillon', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  paid:      { label: 'Payée',     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'Annulée',   color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
}

const STATUS_ICON = {
  draft: FileText,
  paid: CheckCircle2,
  cancelled: XCircle,
}

// ---- Modal Nouvelle Facture ----
function NewInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createInvoice, isLoading } = useInvoiceStore()
  const { customers } = useCustomerStore()
  const { products } = useProductStore()

  const [customerId, setCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ product_id: string; quantity: number; unit_price: number }>>([
    { product_id: '', quantity: 1, unit_price: 0 }
  ])
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setCustomerId(''); setNotes('')
      setItems([{ product_id: '', quantity: 1, unit_price: 0 }])
      setError('')
    }
  }, [open])

  if (!open) return null

  const addLine = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }])
  const removeLine = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateLine = (i: number, key: string, val: any) => {
    setItems(items.map((item, idx) => {
      if (idx !== i) return item
      
      // Auto-fill price when product changes
      if (key === 'product_id') {
        const prod = products.find(p => p.id === val)
        return { ...item, product_id: val, unit_price: prod?.price || 0 }
      }
      return { ...item, [key]: val }
    }))
  }

  const totalCost = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (items.some(i => !i.product_id)) { setError('Sélectionnez un produit pour chaque ligne.'); return }
    if (!customerId) { setError('Sélectionnez un client.'); return }
    
    // Check stock availability
    for (const item of items) {
      const prod = products.find(p => p.id === item.product_id)
      if (prod && item.quantity > prod.current_stock) {
        setError(`Stock insuffisant pour ${prod.name} (Stock actuel: ${prod.current_stock})`)
        return
      }
    }

    try {
      await createInvoice({ customer_id: customerId, notes: notes || null }, items)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création.')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-3xl glass border border-border/50 rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40 sticky top-0 glass z-10">
            <div>
              <h2 className="text-base font-semibold gradient-text">Nouvelle Facture</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Le stock sera automatiquement déduit pour chaque produit vendu.</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Client *</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">— Sélectionner un client —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes / Conditions</label>
                <Input placeholder="Remarques..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-background/50" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Produits vendus *</label>
                <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1 h-7 text-xs"><Plus className="w-3 h-3" /> Ajouter</Button>
              </div>

              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-accent/20">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Produit</th>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-24">Qté</th>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-32">Prix de vente</th>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-28">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="px-3 py-2">
                          <select value={item.product_id} onChange={e => updateLine(i, 'product_id', e.target.value)} className="w-full h-8 rounded-md border border-border/50 bg-background/50 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50">
                            <option value="">— Produit —</option>
                            {products.map(p => <option key={p.id} value={p.id} disabled={p.current_stock <= 0}>{p.name} (Stock: {p.current_stock})</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" min={1} value={item.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} className="h-8 text-xs bg-background/50" />
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" min={0} value={item.unit_price} onChange={e => updateLine(i, 'unit_price', Number(e.target.value))} className="h-8 text-xs bg-background/50" />
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-muted-foreground">
                          {(item.quantity * item.unit_price).toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-3 py-2">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeLine(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-accent/10 border-t border-border/30">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-right">Total Facture :</td>
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
              <Button type="submit" disabled={isLoading || items.some(i => !i.product_id)} className="glow-primary">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Créer la facture
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// ---- Ligne de Facture ----
function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const { deleteInvoice } = useInvoiceStore()
  const [expanded, setExpanded] = useState(false)

  const cfg = STATUS_CONFIG[invoice.status]
  const StatusIcon = STATUS_ICON[invoice.status]

  return (
    <TableBody>
      <TableRow className="border-border/50 hover:bg-accent/20 transition-colors">
        <TableCell><button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">{expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</button></TableCell>
        <TableCell className="font-mono text-sm font-semibold text-primary">{invoice.invoice_number}</TableCell>
        <TableCell className="font-medium">{invoice.customer?.name ?? <span className="text-muted-foreground italic">Aucun</span>}</TableCell>
        <TableCell>
          <Badge className={`${cfg.color} border text-xs gap-1`}><StatusIcon className="w-3 h-3" /> {cfg.label}</Badge>
        </TableCell>
        <TableCell className="text-sm font-semibold">{invoice.total_amount.toLocaleString('fr-FR')} FCFA</TableCell>
        <TableCell className="text-sm text-muted-foreground">{format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: fr })}</TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10" onClick={() => generateInvoicePDF(invoice)}>
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-0" onClick={() => confirm('Supprimer cette facture ?') && deleteInvoice(invoice.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-accent/5">
          <TableCell colSpan={7} className="py-0">
            <div className="px-8 py-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Détail de la facture</p>
              <div className="space-y-1">
                {invoice.items?.map(item => (
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
              {invoice.notes && <p className="text-xs text-muted-foreground mt-2 italic">📝 {invoice.notes}</p>}
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

// ---- Page Factures ----
export function InvoicesPage() {
  const { invoices, isLoading, fetchInvoices } = useInvoiceStore()
  const { fetchCustomers } = useCustomerStore()
  const { fetchData } = useProductStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchInvoices()
    fetchCustomers()
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = invoices.filter(i => 
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (i.customer?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: invoices.length,
    revenue: invoices.reduce((s, i) => s + i.total_amount, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Factures Clients</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{invoices.length} facture{invoices.length > 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 glow-primary">
          <Plus className="w-4 h-4" /> Nouvelle facture
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <div className="glass rounded-xl p-4 border border-border/50 flex items-center gap-3">
          <Receipt className="w-6 h-6 text-primary" />
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Factures émises</p>
          </div>
        </div>
        <div className="glass rounded-xl p-4 border border-border/50 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">F</div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{stats.revenue.toLocaleString('fr-FR')} FCFA</p>
            <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="N° facture, client..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/50" />
      </div>

      <div className="glass rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead>N° Facture</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Créée le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          {isLoading && (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Chargement...</TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isLoading && filtered.length === 0 && (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Receipt className="w-8 h-8" />
                    <p className="text-sm">Aucune facture trouvée</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          )}

          {!isLoading && filtered.length > 0 && (
            filtered.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)
          )}
        </Table>
      </div>

      <NewInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
