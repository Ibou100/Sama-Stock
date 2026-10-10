import { useEffect, useMemo, useState } from 'react'
import { useSuperAdminStore, type TenantProfile } from '@/stores/useSuperAdminStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Navigate, Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Crown,
  Activity,
  Loader2,
  LogIn,
  TrendingUp,
  Shield,
  ArrowLeft,
  Search,
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Check,
  Server,
  Trash2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 border border-border/50 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1 font-medium">{label}</p>
      <p className="text-sm font-bold text-primary">
        {payload[0].value} connexion{payload[0].value > 1 ? 's' : ''}
      </p>
    </div>
  )
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

export function SuperAdminPage() {
  const { profile, isLoading: authLoading } = useAuthStore()
  const store = useSuperAdminStore()
  const {
    organizations,
    profiles,
    loginLogs,
    totalProductsCount,
    totalInvoicesCount,
    totalGMV,
    isLoading,
    fetchPlatformData,
    toggleSuperAdmin,
    deleteUser,
    updateOrgPlan,
    updateOrgStatus,
    connectionsToday,
    connectionsThisWeek,
    connectionsThisMonth,
    dailyConnectionsChart,
    orgConnectionsChart,
    recentConnections,
  } = store

  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'users' | 'system'>('overview')
  const [tenantSearch, setTenantSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile?.is_super_admin) {
      fetchPlatformData()
    }
  }, [profile, fetchPlatformData])

  // Computed values
  const todayCount = useMemo(() => connectionsToday(), [loginLogs])
  const weekCount = useMemo(() => connectionsThisWeek(), [loginLogs])
  const monthCount = useMemo(() => connectionsThisMonth(), [loginLogs])
  const dailyChart = useMemo(() => dailyConnectionsChart(), [loginLogs])
  const orgChart = useMemo(() => orgConnectionsChart(), [loginLogs, organizations])
  const recent = useMemo(() => recentConnections(), [loginLogs])

  const activeUsersCount = useMemo(() => {
    const uniqueUsers = new Set(loginLogs.map((l) => l.user_id))
    return uniqueUsers.size
  }, [loginLogs])

  const formatFCFA = (val: number) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA'
  }

  // Filtered organizations
  const filteredOrgs = useMemo(() => {
    return organizations.filter((o) =>
      o.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      o.id.toLowerCase().includes(tenantSearch.toLowerCase())
    )
  }, [organizations, tenantSearch])

  // Filtered users
  const filteredUsers = useMemo(() => {
    return profiles.filter((p) =>
      p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (p.full_name && p.full_name.toLowerCase().includes(userSearch.toLowerCase()))
    )
  }, [profiles, userSearch])

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return 'Sans entreprise'
    return organizations.find((o) => o.id === orgId)?.name || 'Inconnue'
  }

  const handleToggleAdmin = async (u: TenantProfile) => {
    const newStatus = !u.is_super_admin
    const confirmMsg = newStatus
      ? `Accorder les droits Super Admin complets à ${u.email} ?`
      : `Révoquer les droits Super Admin de ${u.email} ?`

    if (!window.confirm(confirmMsg)) return

    setActionLoading(u.id)
    try {
      await toggleSuperAdmin(u.id, newStatus)
      setNotification({
        type: 'success',
        text: `Droits mis à jour pour ${u.email} !`,
      })
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Erreur lors de la modification des droits.',
      })
    } finally {
      setActionLoading(null)
      setTimeout(() => setNotification(null), 4000)
    }
  }

  const handleDeleteUser = async (u: TenantProfile) => {
    if (u.id === profile?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte Super Admin actif.')
      return
    }

    const confirmMsg = `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${u.email} (${u.full_name || 'Sans nom'}) ?\n\nCette action est irréversible et supprimera son accès.`
    if (!window.confirm(confirmMsg)) return

    setActionLoading(u.id)
    try {
      await deleteUser(u.id)
      setNotification({
        type: 'success',
        text: `Le compte ${u.email} a été supprimé définitivement.`,
      })
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err.message || 'Erreur lors de la suppression du compte.',
      })
    } finally {
      setActionLoading(null)
      setTimeout(() => setNotification(null), 4000)
    }
  }

  const handleExportCSV = (dataType: 'users' | 'organizations') => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    if (dataType === 'users') {
      csvContent += 'ID,Email,Nom,Role,Organisation,SuperAdmin,DateCreation\n'
      profiles.forEach((p) => {
        csvContent += `"${p.id}","${p.email}","${p.full_name || ''}","${p.role}","${getOrgName(p.organization_id)}","${p.is_super_admin ? 'OUI' : 'NON'}","${p.created_at}"\n`
      })
    } else {
      csvContent += 'ID,Nom,Plan,Statut,DateCreation\n'
      organizations.forEach((o) => {
        csvContent += `"${o.id}","${o.name}","${o.plan || 'Essai'}","${o.status || 'actif'}","${o.created_at}"\n`
      })
    }
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `samastock_${dataType}_export.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile?.is_super_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ═══════════ TOP HEADER SAAS ═══════════ */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between glass p-6 rounded-3xl border border-border/50 gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2.5 rounded-2xl bg-accent/40 hover:bg-accent text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
              title="Retour au magasin"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-7 h-7 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold gradient-text">SaaS Super Admin</h1>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                  GOD MODE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilotage central de la plateforme multi-tenant Sama Stock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Plateforme active
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPlatformData()}
              disabled={isLoading}
              className="glass hover:bg-accent text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>

            <Link to="/dashboard">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs">
                Accéder au magasin
              </Button>
            </Link>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-2xl text-sm font-medium border flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {notification.text}
          </div>
        )}

        {/* ═══════════ NAVIGATION TABS ═══════════ */}
        <div className="flex items-center gap-2 border-b border-border/50 pb-px overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d’ensemble & Analytics', icon: Activity },
            { id: 'tenants', label: `Entreprises / Tenants (${organizations.length})`, icon: Building2 },
            { id: 'users', label: `Utilisateurs (${profiles.length})`, icon: Users },
            { id: 'system', label: 'Santé Système & Exports', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ═══════════ GLOBAL KPIS ROW ═══════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* GMV Volume d'affaires */}
          <div className="glass p-5 rounded-2xl border border-border/50 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                GMV Plateforme
              </span>
            </div>
            <p className="text-xl font-black text-foreground truncate">{formatFCFA(totalGMV)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{totalInvoicesCount} factures émises</p>
          </div>

          {/* Entreprises */}
          <div className="glass p-5 rounded-2xl border border-border/50 hover:border-violet-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full">
                Tenants
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{organizations.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Commerces inscrits</p>
          </div>

          {/* Utilisateurs */}
          <div className="glass p-5 rounded-2xl border border-border/50 hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                Utilisateurs
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activeUsersCount} actifs (30j)</p>
          </div>

          {/* Connexions du jour */}
          <div className="glass p-5 rounded-2xl border border-border/50 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                <LogIn className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                Aujourd'hui
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{todayCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{weekCount} sem. · {monthCount} mois</p>
          </div>

          {/* Produits Globaux */}
          <div className="glass p-5 rounded-2xl border border-border/50 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">
                Catalogue
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalProductsCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Articles en gestion</p>
          </div>
        </div>

        {/* ═══════════ TAB 1: OVERVIEW & ANALYTICS ═══════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Daily Connections Chart */}
              <div className="xl:col-span-2 glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-foreground">Évolution de l'activité (30 jours)</h2>
                  </div>
                  <span className="text-xs text-muted-foreground bg-accent/40 px-2.5 py-1 rounded-full">
                    {loginLogs.length} sessions
                  </span>
                </div>
                <div className="p-5" style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConnexions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 34%, 17%)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(216, 34%, 17%)' }}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="connexions"
                        stroke="hsl(210, 100%, 56%)"
                        strokeWidth={2}
                        fill="url(#colorConnexions)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* By Organization */}
              <div className="glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border/50 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-violet-400" />
                  <h2 className="font-bold text-foreground">Top Commerces Actifs</h2>
                </div>
                <div className="p-5" style={{ height: 280 }}>
                  {orgChart.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Aucune donnée de connexion
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orgChart} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 34%, 17%)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="connexions" fill="hsl(263, 70%, 58%)" radius={[0, 6, 6, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Login Feed */}
            <div className="glass rounded-2xl border border-border/50 overflow-hidden">
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-bold text-foreground">Flux en direct des connexions</h2>
                </div>
                <span className="text-xs text-muted-foreground">30 dernières connexions</span>
              </div>
              <div className="divide-y divide-border/30 max-h-[350px] overflow-y-auto">
                {recent.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-accent/20 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {log.email.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{log.email}</p>
                      <p className="text-xs text-muted-foreground">{getOrgName(log.organization_id)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-foreground">{formatTimeAgo(log.logged_in_at)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(log.logged_in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ TAB 2: TENANTS MANAGEMENT ═══════════ */}
        {activeTab === 'tenants' && (
          <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une entreprise..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="pl-9 bg-background/50 border-border/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportCSV('organizations')} className="glass">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/40">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-accent/30 border-b border-border/50 uppercase">
                  <tr>
                    <th className="px-5 py-3">Commerce / Entreprise</th>
                    <th className="px-5 py-3">Employés</th>
                    <th className="px-5 py-3">Formule / Plan</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Inscrit le</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredOrgs.map((org) => {
                    const membersCount = profiles.filter((p) => p.organization_id === org.id).length
                    return (
                      <tr key={org.id} className="hover:bg-accent/20 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-foreground">
                          <div>
                            <p>{org.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{org.id.slice(0, 8)}...</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className="bg-accent/40 text-foreground font-medium">
                            {membersCount} utilisateur{membersCount > 1 ? 's' : ''}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={org.plan || 'Essai Pro'}
                            onChange={(e) => updateOrgPlan(org.id, e.target.value)}
                            className="h-8 rounded-lg border border-border/50 bg-background/50 px-2 text-xs font-semibold text-primary focus:outline-none"
                          >
                            <option value="Essai Gratuit">Essai Gratuit</option>
                            <option value="Starter (10k/m)">Starter (10k/m)</option>
                            <option value="Pro (25k/m)">Pro (25k/m)</option>
                            <option value="Entreprise (50k/m)">Entreprise (50k/m)</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              org.status === 'suspended'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {org.status === 'suspended' ? 'Suspendu' : 'Actif'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {new Date(org.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateOrgStatus(org.id, org.status === 'suspended' ? 'active' : 'suspended')
                            }
                            className={`text-xs ${
                              org.status === 'suspended'
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-rose-400 hover:bg-rose-500/10'
                            }`}
                          >
                            {org.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════ TAB 3: USERS & ROLES MANAGEMENT ═══════════ */}
        {activeTab === 'users' && (
          <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 bg-background/50 border-border/50"
                />
              </div>

              <Button variant="outline" size="sm" onClick={() => handleExportCSV('users')} className="glass">
                <Download className="w-4 h-4 mr-2" />
                Exporter CSV
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/40">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-accent/30 border-b border-border/50 uppercase">
                  <tr>
                    <th className="px-5 py-3">Utilisateur</th>
                    <th className="px-5 py-3">Organisation rattachée</th>
                    <th className="px-5 py-3">Rôle Métier</th>
                    <th className="px-5 py-3">Statut Super Admin</th>
                    <th className="px-5 py-3 text-right">Gestion des privilèges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {u.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.full_name || 'Sans nom'}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground font-medium">
                        {getOrgName(u.organization_id)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'owner'
                              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                              : u.role === 'admin'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {u.role === 'owner' ? 'Propriétaire' : u.role === 'admin' ? 'Admin' : 'Employé'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.is_super_admin ? (
                          <span className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                            <Crown className="w-3.5 h-3.5" /> Super Admin
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Utilisateur standard</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === u.id || u.id === profile?.id}
                            onClick={() => handleToggleAdmin(u)}
                            className={`text-xs ${
                              u.is_super_admin
                                ? 'text-rose-400 border-rose-500/30 hover:bg-rose-500/10'
                                : 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                            }`}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : u.is_super_admin ? (
                              'Révoquer Super Admin'
                            ) : (
                              'Nommer Super Admin'
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading === u.id || u.id === profile?.id}
                            onClick={() => handleDeleteUser(u)}
                            title="Supprimer définitivement l'utilisateur"
                            className="h-8 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════ TAB 4: SYSTEM HEALTH & EXPORTS ═══════════ */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-2xl border border-border/50 space-y-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base">État des Services Cloud</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/30">
                  <span className="font-medium">PostgreSQL & Supabase DB</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> En ligne
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/30">
                  <span className="font-medium">Supabase Auth & Sessions</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Opérationnel
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/30">
                  <span className="font-medium">Vercel Edge Network</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Global CDN Déployé
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-border/30">
                  <span className="font-medium">Row-Level Security (RLS)</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Strictement Activé
                  </span>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-border/50 space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Sauvegardes & Exports Données</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Exportez les tables complètes pour vos sauvegardes comptables ou analyses dans Excel / Google Sheets.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="glass text-xs h-12" onClick={() => handleExportCSV('organizations')}>
                  <Building2 className="w-4 h-4 mr-2 text-violet-400" />
                  Exporter Entreprises
                </Button>
                <Button variant="outline" className="glass text-xs h-12" onClick={() => handleExportCSV('users')}>
                  <Users className="w-4 h-4 mr-2 text-emerald-400" />
                  Exporter Utilisateurs
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
