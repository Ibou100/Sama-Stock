import { useEffect, useMemo } from 'react'
import {
  Package,
  ArrowLeftRight,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Eye,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProductStore } from '@/stores/useProductStore'
import { useStockStore } from '@/stores/useStockStore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from 'react-router-dom'

// --- KPI Card Component ---
interface KpiCardProps {
  title: string
  value: string
  sub: string
  subType: 'up' | 'down' | 'neutral' | 'warn'
  icon: React.ElementType
  color: string
  bgColor: string
}

function KpiCard({ title, value, sub, subType, icon: Icon, color, bgColor }: KpiCardProps) {
  return (
    <div className="glass rounded-2xl p-5 border border-border/50 hover:border-border transition-all duration-300 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <span
          className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            subType === 'up' && 'text-emerald-400 bg-emerald-400/10',
            subType === 'down' && 'text-red-400 bg-red-400/10',
            subType === 'warn' && 'text-amber-400 bg-amber-400/10',
            subType === 'neutral' && 'text-muted-foreground bg-muted/50'
          )}
        >
          {subType === 'up' && <TrendingUp className="w-3 h-3" />}
          {subType === 'down' && <TrendingDown className="w-3 h-3" />}
          {subType === 'warn' && <AlertTriangle className="w-3 h-3" />}
          {sub}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{title}</p>
    </div>
  )
}

// --- Main Dashboard Page ---
export function DashboardPage() {
  const { products, fetchData } = useProductStore()
  const { movements, fetchMovements } = useStockStore()

  useEffect(() => {
    fetchData()
    fetchMovements()
  }, [fetchData, fetchMovements])

  // --- Compute KPIs from real data ---
  const kpis = useMemo(() => {
    const totalStockValue = products.reduce((sum, p) => sum + p.price * p.current_stock, 0)
    const totalRefs = products.length
    const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock)
    
    // Movements this month
    const now = new Date()
    const thisMonthMovements = movements.filter(m => {
      const d = new Date(m.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const formatFCFA = (n: number) =>
      new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

    return [
      {
        title: 'Valeur totale du stock',
        value: formatFCFA(totalStockValue),
        sub: `${totalRefs} références`,
        subType: 'neutral' as const,
        icon: DollarSign,
        color: 'text-primary',
        bgColor: 'bg-primary/15',
      },
      {
        title: 'Références en stock',
        value: String(totalRefs),
        sub: totalRefs > 0 ? 'Produits actifs' : 'Aucun produit',
        subType: 'up' as const,
        icon: Package,
        color: 'text-violet-400',
        bgColor: 'bg-violet-400/15',
      },
      {
        title: 'Mouvements ce mois',
        value: String(thisMonthMovements.length),
        sub: `${thisMonthMovements.filter(m => m.movement_type === 'IN').length} entrées · ${thisMonthMovements.filter(m => m.movement_type === 'OUT').length} sorties`,
        subType: 'neutral' as const,
        icon: ArrowLeftRight,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-400/15',
      },
      {
        title: 'Alertes stock faible',
        value: String(lowStockProducts.length),
        sub: lowStockProducts.filter(p => p.current_stock === 0).length + ' ruptures',
        subType: lowStockProducts.length > 0 ? 'warn' as const : 'up' as const,
        icon: AlertTriangle,
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/15',
      },
    ]
  }, [products, movements])

  const lowStockProducts = useMemo(
    () => products.filter(p => p.current_stock <= p.min_stock).slice(0, 5),
    [products]
  )

  const recentMovements = useMemo(() => movements.slice(0, 5), [movements])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          to="/dashboard/stock"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all glow-primary"
        >
          <ShoppingCart className="w-4 h-4" />
          Nouveau mouvement
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Bottom section: Alerts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Alerts */}
        <div className="glass rounded-2xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-foreground text-sm">Alertes Stock</h3>
              {lowStockProducts.length > 0 && (
                <span className="bg-amber-400/20 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full">
                  {lowStockProducts.length}
                </span>
              )}
            </div>
            <Link to="/dashboard/products" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">✅ Tous les stocks sont suffisants !</p>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0 group hover:bg-accent/20 rounded-lg px-3 transition-all">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', p.current_stock === 0 ? 'bg-red-500' : 'bg-amber-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', p.current_stock === 0 ? 'text-red-400' : 'text-amber-400')}>
                      {p.current_stock} unités
                    </p>
                    <p className="text-xs text-muted-foreground">min: {p.min_stock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-foreground text-sm">Activité Récente</h3>
            </div>
            <Link to="/dashboard/stock" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {recentMovements.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Aucune activité récente.</p>
            ) : (
              recentMovements.map((m) => (
                <div key={m.id} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0 hover:bg-accent/20 rounded-lg px-3 transition-all">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    m.movement_type === 'IN' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  )}>
                    {m.movement_type === 'IN' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.product?.name || 'Produit supprimé'}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.reason || (m.movement_type === 'IN' ? 'Entrée' : 'Sortie')} · {format(new Date(m.created_at), 'dd MMM HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <span className={cn('text-sm font-bold', m.movement_type === 'IN' ? 'text-emerald-400' : 'text-red-400')}>
                    {m.movement_type === 'IN' ? '+' : '-'}{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
