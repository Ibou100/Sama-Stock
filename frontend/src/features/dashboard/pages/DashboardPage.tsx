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

// --- KPI Card Component ---
interface KpiCardProps {
  title: string
  value: string
  change: string
  changeType: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color: string
  bgColor: string
}

function KpiCard({ title, value, change, changeType, icon: Icon, color, bgColor }: KpiCardProps) {
  return (
    <div className="glass rounded-2xl p-5 border border-border/50 hover:border-border transition-all duration-300 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <span
          className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            changeType === 'up' && 'text-emerald-400 bg-emerald-400/10',
            changeType === 'down' && 'text-red-400 bg-red-400/10',
            changeType === 'neutral' && 'text-muted-foreground bg-muted/50'
          )}
        >
          {changeType === 'up' && <TrendingUp className="w-3 h-3" />}
          {changeType === 'down' && <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{title}</p>
    </div>
  )
}

// --- Stock Alert Row ---
interface AlertRowProps {
  name: string
  sku: string
  stock: number
  min: number
  category: string
}

function AlertRow({ name, sku, stock, min, category }: AlertRowProps) {
  const isOut = stock === 0
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0 group hover:bg-accent/20 rounded-lg px-3 transition-all">
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isOut ? 'bg-red-500' : 'bg-amber-500')} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{sku} · {category}</p>
      </div>
      <div className="text-right">
        <p className={cn('text-sm font-bold', isOut ? 'text-red-400' : 'text-amber-400')}>
          {stock} unités
        </p>
        <p className="text-xs text-muted-foreground">min: {min}</p>
      </div>
    </div>
  )
}

// --- Recent Activity Row ---
interface ActivityRowProps {
  type: 'in' | 'out'
  product: string
  qty: number
  time: string
  user: string
}

function ActivityRow({ type, product, qty, time, user }: ActivityRowProps) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0 hover:bg-accent/20 rounded-lg px-3 transition-all">
      <div className={cn(
        'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
        type === 'in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
      )}>
        {type === 'in' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{product}</p>
        <p className="text-xs text-muted-foreground">{user} · {time}</p>
      </div>
      <span className={cn('text-sm font-bold', type === 'in' ? 'text-emerald-400' : 'text-red-400')}>
        {type === 'in' ? '+' : '-'}{qty}
      </span>
    </div>
  )
}

// --- Main Dashboard Page ---
export function DashboardPage() {
  const kpis: KpiCardProps[] = [
    {
      title: 'Valeur totale du stock',
      value: '4 250 000 FCFA',
      change: '+12.5%',
      changeType: 'up',
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/15',
    },
    {
      title: 'Références en stock',
      value: '284',
      change: '+8 ce mois',
      changeType: 'up',
      icon: Package,
      color: 'text-violet-400',
      bgColor: 'bg-violet-400/15',
    },
    {
      title: 'Mouvements ce mois',
      value: '1 342',
      change: '-3.2%',
      changeType: 'down',
      icon: ArrowLeftRight,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/15',
    },
    {
      title: 'Alertes stock faible',
      value: '7',
      change: '2 ruptures',
      changeType: 'neutral',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/15',
    },
  ]

  const alerts: AlertRowProps[] = [
    { name: 'Paracétamol 500mg', sku: 'MED-001', stock: 0, min: 50, category: 'Médicaments' },
    { name: 'Amoxicilline 250mg', sku: 'MED-042', stock: 8, min: 30, category: 'Médicaments' },
    { name: 'Gants chirurgicaux L', sku: 'MAT-015', stock: 12, min: 100, category: 'Matériel' },
    { name: 'Ibuprofène 400mg', sku: 'MED-018', stock: 5, min: 40, category: 'Médicaments' },
  ]

  const activities: ActivityRowProps[] = [
    { type: 'in', product: 'Doliprane 1000mg', qty: 200, time: 'Il y a 15 min', user: 'Ibrahima G.' },
    { type: 'out', product: 'Efferalgan 500mg', qty: 24, time: 'Il y a 1h', user: 'Fatou D.' },
    { type: 'in', product: 'Vitamine C 500mg', qty: 500, time: 'Il y a 3h', user: 'Ibrahima G.' },
    { type: 'out', product: 'Paracétamol 500mg', qty: 48, time: 'Hier 17h30', user: 'Moussa S.' },
    { type: 'out', product: 'Gants L', qty: 50, time: 'Hier 14h00', user: 'Fatou D.' },
  ]

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
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all glow-primary hover:glow-primary">
          <ShoppingCart className="w-4 h-4" />
          Nouvelle vente
        </button>
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
              <span className="bg-amber-400/20 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            </div>
            <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            {alerts.map((alert) => (
              <AlertRow key={alert.sku} {...alert} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-foreground text-sm">Activité Récente</h3>
            </div>
            <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            {activities.map((activity, idx) => (
              <ActivityRow key={idx} {...activity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
