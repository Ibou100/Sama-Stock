import { useState, useEffect, useMemo, useRef } from 'react'
import { useProductStore } from '@/stores/useProductStore'
import { useInvoiceStore, type Invoice } from '@/stores/useInvoiceStore'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Printer,
  CheckCircle2,
  Store,
  CreditCard,
  Banknote,
  Smartphone,
  RotateCcw,
  AlertTriangle,
  User,
  Loader2,
} from 'lucide-react'
import { generateReceiptPDF } from '@/lib/generateReceiptPDF'
import type { Product } from '@/types'

interface CartItem {
  product: Product
  quantity: number
  unit_price: number
}

export function POSPage() {
  const { products, categories, fetchData: fetchProducts, isLoading: productsLoading } = useProductStore()
  const { customers, fetchCustomers } = useCustomerStore()
  const { createInvoice, isLoading: invoiceLoading } = useInvoiceStore()
  const { profile } = useAuthStore()

  // Search & Category Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [counterCustomerName] = useState('Client Comptoir')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wave' | 'orange_money' | 'card' | 'transfer'>('cash')
  const [amountReceived, setAmountReceived] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Sale Completion State
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState<Invoice | null>(null)
  const [successModalOpen, setSuccessModalOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
  }, [fetchProducts, fetchCustomers])

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))

      if (!matchesSearch) return false
      if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false

      return true
    })
  }, [products, searchTerm, selectedCategory])

  // Total computation
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }, [cart])

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  // Money change computation
  const numReceived = Number(amountReceived) || 0
  const changeToReturn = paymentMethod === 'cash' && numReceived >= cartTotal ? numReceived - cartTotal : 0

  // Cart actions
  const addToCart = (product: Product) => {
    setErrorMsg('')
    if (product.current_stock <= 0) {
      setErrorMsg(`Le produit "${product.name}" est en rupture de stock !`)
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          setErrorMsg(`Stock maximum atteint (${product.current_stock} ${product.unit || 'pièce(s)'}) pour ${product.name}`)
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1, unit_price: product.price }]
    })
  }

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId)
      return
    }
    const product = products.find((p) => p.id === productId)
    if (product && qty > product.current_stock) {
      setErrorMsg(`Stock disponible insuffisant : ${product.current_stock} ${product.unit || 'pièce(s)'}`)
      return
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setAmountReceived('')
    setErrorMsg('')
  }

  // Quick cash buttons
  const setQuickCash = (amt: number) => {
    setAmountReceived(String(amt))
  }

  // Submit sale
  const handleValidateSale = async () => {
    if (cart.length === 0) {
      setErrorMsg('Le panier est vide.')
      return
    }

    if (paymentMethod === 'cash' && numReceived > 0 && numReceived < cartTotal) {
      setErrorMsg('Le montant reçu est inférieur au total de la vente.')
      return
    }

    setErrorMsg('')

    try {
      const itemsPayload = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))

      const invoicePayload: Partial<Invoice> = {
        customer_id: selectedCustomerId || null,
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'cash' ? (numReceived || cartTotal) : cartTotal,
        change_returned: changeToReturn,
        customer_name_snapshot: selectedCustomerId
          ? customers.find((c) => c.id === selectedCustomerId)?.name || counterCustomerName
          : counterCustomerName,
        notes: `Vente caisse comptoir (${paymentMethod.toUpperCase()})`,
      }

      await createInvoice(invoicePayload, itemsPayload)

      // Create local representation for instant receipt printing
      const completedInvoice: Invoice = {
        id: 'pos-' + Date.now(),
        organization_id: (profile as any)?.organization_id || '',
        customer_id: selectedCustomerId || null,
        invoice_number: `TKT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        status: 'paid',
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'cash' ? (numReceived || cartTotal) : cartTotal,
        change_returned: changeToReturn,
        customer_name_snapshot: invoicePayload.customer_name_snapshot,
        notes: invoicePayload.notes || null,
        total_amount: cartTotal,
        created_by: profile?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: cart.map((c) => ({
          id: 'item-' + c.product.id,
          invoice_id: '',
          product_id: c.product.id,
          quantity: c.quantity,
          unit_price: c.unit_price,
          product: { id: c.product.id, name: c.product.name, sku: c.product.sku },
        })),
      }

      setLastCompletedInvoice(completedInvoice)
      setSuccessModalOpen(true)
      clearCart()
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'encaissement.")
    }
  }

  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA'
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Store className="w-6 h-6 text-primary" />
            Caisse & Point de Vente (POS)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Encaissement rapide au comptoir, gestion des modes de règlement et tickets de caisse
          </p>
        </div>
      </div>

      {/* Main Grid: Left Catalog, Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Left Side: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-h-0 glass rounded-2xl border border-border/50 p-4">
          {/* Search + Barcode Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher nom, code-barres, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50 border-border/50 focus:border-primary text-sm h-10"
                autoFocus
              />
            </div>
            {searchTerm && (
              <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
                Effacer
              </Button>
            )}
          </div>

          {/* Categories Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-accent/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              Tous les articles
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-accent/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {productsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                <p>Aucun produit correspondant.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.current_stock <= 0
                  return (
                    <button
                      key={p.id}
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p)}
                      className={`text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between h-28 relative group ${
                        isOutOfStock
                          ? 'border-border/30 bg-muted/20 opacity-50 cursor-not-allowed'
                          : 'border-border/50 bg-background/50 hover:border-primary/50 hover:bg-accent/30 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-xs text-foreground line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.sku}</p>
                      </div>

                      <div className="flex items-end justify-between mt-2">
                        <span className="text-xs font-bold text-primary">
                          {formatFCFA(p.price)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[9px] px-1.5 py-0 ${
                            isOutOfStock
                              ? 'bg-destructive/15 text-destructive'
                              : p.current_stock <= p.min_stock
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          {p.current_stock} {p.unit || 'pcs'}
                        </Badge>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Current Ticket / Cart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col glass rounded-2xl border border-border/50 p-4 min-h-0">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Ticket en cours ({cartItemsCount})</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Vider
              </button>
            )}
          </div>

          {/* Client Selection */}
          <div className="py-2.5 border-b border-border/30 flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="flex-1 h-8 rounded-lg border border-border/50 bg-background/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">Client Comptoir (Vente directe anonyme)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs space-y-2">
                <ShoppingCart className="w-8 h-8 stroke-1 text-muted-foreground/40" />
                <p>Panier vide. Cliquez sur un article pour l'ajouter.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-background/40 border border-border/30 text-xs gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFCFA(item.unit_price)} × {item.quantity} {item.product.unit || 'pcs'}
                    </p>
                  </div>

                  {/* Quantity Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded flex items-center justify-center bg-accent/50 hover:bg-accent text-foreground"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center bg-accent/50 hover:bg-accent text-foreground"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="w-20 text-right font-bold text-foreground">
                    {formatFCFA(item.quantity * item.unit_price)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Payment & Summary Section */}
          <div className="pt-3 border-t border-border/40 space-y-3">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-5 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-1.5 px-1 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border/40 bg-background/30 text-muted-foreground'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span className="text-[10px]">Espèces</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('wave')}
                className={`py-1.5 px-1 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'wave'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold'
                    : 'border-border/40 bg-background/30 text-muted-foreground'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[10px]">Wave</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('orange_money')}
                className={`py-1.5 px-1 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'orange_money'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-bold'
                    : 'border-border/40 bg-background/30 text-muted-foreground'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[10px]">OM</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-1.5 px-1 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border/40 bg-background/30 text-muted-foreground'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span className="text-[10px]">Carte</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-1.5 px-1 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border/40 bg-background/30 text-muted-foreground'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px]">Virement</span>
              </button>
            </div>

            {/* Cash details if Cash selected */}
            {paymentMethod === 'cash' && (
              <div className="p-2.5 rounded-xl bg-background/50 border border-border/40 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Reçu :</span>
                  <Input
                    type="number"
                    placeholder="Montant reçu..."
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="h-8 text-xs bg-background/80"
                  />
                  {cartTotal > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs whitespace-nowrap"
                      onClick={() => setQuickCash(cartTotal)}
                    >
                      Exact
                    </Button>
                  )}
                </div>

                {/* Quick cash shortcuts */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1000, 2000, 5000, 10000, 20000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickCash(amt)}
                      className="px-2 py-0.5 rounded bg-accent/40 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {changeToReturn > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 font-bold pt-1 border-t border-border/30">
                    <span>Monnaie à rendre :</span>
                    <span className="text-sm">{formatFCFA(changeToReturn)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2 rounded-lg flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {errorMsg}
              </p>
            )}

            {/* Total & Checkout Button */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net à payer</p>
                <p className="text-xl font-black text-foreground">{formatFCFA(cartTotal)}</p>
              </div>

              <Button
                disabled={cart.length === 0 || invoiceLoading}
                onClick={handleValidateSale}
                className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 shadow-lg glow-primary"
              >
                {invoiceLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Encaisser
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Success Modal */}
      {successModalOpen && lastCompletedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass border border-border/50 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground">Encaissement Réussi !</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Vente enregistrée sous la référence {lastCompletedInvoice.invoice_number}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background/50 border border-border/40 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total payé :</span>
                <span className="font-bold text-foreground">{formatFCFA(lastCompletedInvoice.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode :</span>
                <span className="uppercase font-semibold text-primary">{lastCompletedInvoice.payment_method}</span>
              </div>
              {lastCompletedInvoice.change_returned !== undefined && lastCompletedInvoice.change_returned > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Monnaie rendue :</span>
                  <span>{formatFCFA(lastCompletedInvoice.change_returned)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSuccessModalOpen(false)}
              >
                Nouvelle vente
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                onClick={() => generateReceiptPDF(lastCompletedInvoice, (profile as any)?.organizations?.name)}
              >
                <Printer className="w-4 h-4 mr-2" />
                Ticket de caisse
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
