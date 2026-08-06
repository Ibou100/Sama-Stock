import { useEffect, useMemo } from 'react'
import { useProductStore } from '@/stores/useProductStore'
import { useStockStore } from '@/stores/useStockStore'
import { useSupplierStore } from '@/stores/useSupplierStore'
import { useCustomerStore } from '@/stores/useCustomerStore'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  Truck,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'
import { format, subDays, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass border border-border/50 rounded-lg p-3 text-sm shadow-xl">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="text-xs">
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ReportsPage() {
  const { products, categories, fetchData } = useProductStore()
  const { movements, fetchMovements } = useStockStore()
  const { suppliers, fetchSuppliers } = useSupplierStore()
  const { customers, fetchCustomers } = useCustomerStore()

  useEffect(() => {
    fetchData()
    fetchMovements()
    fetchSuppliers()
    fetchCustomers()
  }, [fetchData, fetchMovements, fetchSuppliers, fetchCustomers])

  // Mouvements des 30 derniers jours par jour
  const movementsPerDay = useMemo(() => {
    const days: Record<string, { date: string; entrees: number; sorties: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'dd/MM')
      days[d] = { date: d, entrees: 0, sorties: 0 }
    }
    movements.forEach((m) => {
      const d = format(new Date(m.created_at), 'dd/MM')
      if (days[d]) {
        if (m.movement_type?.toUpperCase() === 'IN') days[d].entrees += m.quantity
        else days[d].sorties += m.quantity
      }
    })
    return Object.values(days)
  }, [movements])

  // Répartition par catégorie
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    products.forEach((p) => {
      const name = (p as any).categories?.name ?? 'Sans catégorie'
      map[name] = (map[name] ?? 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [products])

  // Top produits par valeur de stock
  const topByValue = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.current_stock * b.price) - (a.current_stock * a.price))
      .slice(0, 8)
      .map((p) => ({ name: p.name.substring(0, 16), valeur: p.current_stock * p.price }))
  }, [products])

  // Stock faible
  const lowStock = products.filter((p) => p.current_stock <= p.min_stock)

  const totalValue = products.reduce((sum, p) => sum + p.current_stock * p.price, 0)
  const totalIn = movements.filter((m) => m.movement_type?.toUpperCase() === 'IN').reduce((s, m) => s + m.quantity, 0)
  const totalOut = movements.filter((m) => m.movement_type?.toUpperCase() === 'OUT').reduce((s, m) => s + m.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold gradient-text">Rapports & Statistiques</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Vue d'ensemble de votre activité</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Valeur du stock', value: `${totalValue.toLocaleString('fr-FR')} FCFA`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Entrées (total)', value: `+${totalIn} unité${totalIn > 1 ? 's' : ''}`, icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Sorties (total)', value: `-${totalOut} unité${totalOut > 1 ? 's' : ''}`, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Stock faible', value: `${lowStock.length} produit${lowStock.length > 1 ? 's' : ''}`, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass rounded-xl p-4 border border-border/50">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Mouvements 30 jours — Area Chart */}
      <div className="glass rounded-xl border border-border/50 p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Mouvements de stock — 30 derniers jours</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={movementsPerDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="entrees" name="Entrées" stroke="#6366f1" fill="url(#colorIn)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="sorties" name="Sorties" stroke="#f43f5e" fill="url(#colorOut)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row — Bar + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top produits par valeur */}
        <div className="glass rounded-xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold">Top produits par valeur</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topByValue} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} formatter={(v: number) => [`${v.toLocaleString('fr-FR')} FCFA`, 'Valeur']} />
              <Bar dataKey="valeur" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par catégorie */}
        <div className="glass rounded-xl border border-border/50 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Package className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold">Produits par catégorie</h3>
          </div>
          {byCategory.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
              Aucune donnée disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {byCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Produits', value: products.length, icon: Package, color: 'text-primary' },
          { label: 'Catégories', value: categories.length, icon: BarChart3, color: 'text-violet-400' },
          { label: 'Fournisseurs', value: suppliers.length, icon: Truck, color: 'text-emerald-400' },
          { label: 'Clients', value: customers.length, icon: Users, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-xl p-4 border border-border/50 flex items-center gap-4">
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
