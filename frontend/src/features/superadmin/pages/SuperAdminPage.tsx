import { useEffect, useMemo } from 'react'
import { useSuperAdminStore } from '@/stores/useSuperAdminStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Navigate } from 'react-router-dom'
import {
  Building2,
  Users,
  Crown,
  Calendar,
  Activity,
  Loader2,
  LogIn,
  TrendingUp,
  Clock,
  BarChart3,
  Shield,
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

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 border border-border/50 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-primary">
        {payload[0].value} connexion{payload[0].value > 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function SuperAdminPage() {
  const { profile, isLoading: authLoading } = useAuthStore()
  const store = useSuperAdminStore()
  const {
    organizations,
    profiles,
    loginLogs,
    isLoading,
    fetchPlatformData,
    connectionsToday,
    connectionsThisWeek,
    connectionsThisMonth,
    dailyConnectionsChart,
    orgConnectionsChart,
    recentConnections,
  } = store

  useEffect(() => {
    if (profile?.is_super_admin) {
      fetchPlatformData()
    }
  }, [profile, fetchPlatformData])

  // Memoize computed values
  const todayCount = useMemo(() => connectionsToday(), [loginLogs])
  const weekCount = useMemo(() => connectionsThisWeek(), [loginLogs])
  const monthCount = useMemo(() => connectionsThisMonth(), [loginLogs])
  const dailyChart = useMemo(() => dailyConnectionsChart(), [loginLogs])
  const orgChart = useMemo(() => orgConnectionsChart(), [loginLogs, organizations])
  const recent = useMemo(() => recentConnections(), [loginLogs])

  // Get last connection for each user
  const userLastConnection = useMemo(() => {
    const map: Record<string, string> = {}
    loginLogs.forEach(l => {
      if (!map[l.user_id] || new Date(l.logged_in_at) > new Date(map[l.user_id])) {
        map[l.user_id] = l.logged_in_at
      }
    })
    return map
  }, [loginLogs])

  // Unique active users (connected at least once in 30 days)
  const activeUsersCount = useMemo(() => {
    const uniqueUsers = new Set(loginLogs.map(l => l.user_id))
    return uniqueUsers.size
  }, [loginLogs])

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

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Il y a ${hours}h`
    const days = Math.floor(hours / 24)
    return `Il y a ${days}j`
  }

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return '—'
    return organizations.find(o => o.id === orgId)?.name || 'Inconnue'
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ═══════════ HEADER ═══════════ */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between glass p-6 rounded-2xl border border-border/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text">Backoffice God Mode</h1>
                <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme Sama Stock</p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">{activeUsersCount} actifs (30j)</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Super Admin</p>
              <p className="text-sm font-semibold">{profile?.email}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Chargement des analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ═══════════ KPI CARDS ═══════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Entreprises */}
              <div className="glass p-5 rounded-2xl border border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-violet-400 bg-violet-400/10">
                    <Shield className="w-3 h-3" />
                    Tenants
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{organizations.length}</p>
                <p className="text-xs text-muted-foreground">Entreprises inscrites</p>
              </div>

              {/* Utilisateurs */}
              <div className="glass p-5 rounded-2xl border border-border/50 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-emerald-400 bg-emerald-400/10">
                    <TrendingUp className="w-3 h-3" />
                    Total
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{profiles.length}</p>
                <p className="text-xs text-muted-foreground">Utilisateurs inscrits</p>
              </div>

              {/* Connexions aujourd'hui */}
              <div className="glass p-5 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-primary" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-primary bg-primary/10">
                    <Clock className="w-3 h-3" />
                    Aujourd'hui
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{todayCount}</p>
                <p className="text-xs text-muted-foreground">{weekCount} cette semaine</p>
              </div>

              {/* Connexions ce mois */}
              <div className="glass p-5 rounded-2xl border border-border/50 hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-cyan-400 bg-cyan-400/10">
                    <Calendar className="w-3 h-3" />
                    Ce mois
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground mb-1">{monthCount}</p>
                <p className="text-xs text-muted-foreground">{loginLogs.length} sur 30 jours</p>
              </div>
            </div>

            {/* ═══════════ CHARTS ROW ═══════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Area Chart — Daily Connections (takes 2 cols) */}
              <div className="xl:col-span-2 glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-foreground">Évolution des connexions</h2>
                  </div>
                  <span className="text-xs text-muted-foreground bg-accent/50 px-2.5 py-1 rounded-full">30 derniers jours</span>
                </div>
                <div className="p-5" style={{ height: 300 }}>
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
                        activeDot={{ r: 5, fill: 'hsl(210, 100%, 56%)', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart — By Organization (takes 1 col) */}
              <div className="glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border/50 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-violet-400" />
                  <h2 className="font-bold text-foreground">Par entreprise</h2>
                </div>
                <div className="p-5" style={{ height: 300 }}>
                  {orgChart.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-muted-foreground">Aucune donnée</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orgChart} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 34%, 17%)" horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={100}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="connexions"
                          fill="hsl(263, 70%, 58%)"
                          radius={[0, 6, 6, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* ═══════════ BOTTOM ROW: RECENT CONNECTIONS + USERS TABLE ═══════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* Recent Connections */}
              <div className="glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h2 className="font-bold text-foreground">Connexions récentes</h2>
                    {recent.length > 0 && (
                      <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                        {recent.length}
                      </span>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
                  {recent.length === 0 ? (
                    <div className="p-8 text-center">
                      <LogIn className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Aucune connexion enregistrée</p>
                    </div>
                  ) : (
                    recent.map((log) => (
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
                    ))
                  )}
                </div>
              </div>

              {/* Users Table */}
              <div className="glass rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-5 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-bold text-foreground">Tous les utilisateurs</h2>
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {profiles.length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-accent/30 border-b border-border/50 uppercase sticky top-0">
                      <tr>
                        <th className="px-5 py-3 font-medium">Utilisateur</th>
                        <th className="px-5 py-3 font-medium">Rôle</th>
                        <th className="px-5 py-3 font-medium">Dernière connexion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {profiles.map((p) => (
                        <tr key={p.id} className="hover:bg-accent/20 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                                {p.email.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{p.full_name || p.email}</p>
                                <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              p.role === 'owner' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' :
                              p.role === 'admin' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {p.role === 'owner' ? 'Propriétaire' : p.role === 'admin' ? 'Admin' : 'Employé'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {userLastConnection[p.id]
                              ? formatTimeAgo(userLastConnection[p.id])
                              : 'Jamais'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ═══════════ ORGANIZATIONS TABLE ═══════════ */}
            <div className="glass rounded-2xl border border-border/50 overflow-hidden">
              <div className="p-5 border-b border-border/50 flex items-center gap-3">
                <Building2 className="w-5 h-5 text-violet-400" />
                <h2 className="font-bold text-foreground">Détail des Entreprises</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-accent/30 border-b border-border/50 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">Nom de l'entreprise</th>
                      <th className="px-6 py-4 font-medium">ID (Tenant)</th>
                      <th className="px-6 py-4 font-medium">Création</th>
                      <th className="px-6 py-4 font-medium">Utilisateurs</th>
                      <th className="px-6 py-4 font-medium">Connexions (30j)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {organizations.map((org) => {
                      const orgUsers = profiles.filter(p => p.organization_id === org.id)
                      const orgConnections = loginLogs.filter(l => l.organization_id === org.id).length
                      return (
                        <tr key={org.id} className="hover:bg-accent/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-violet-400" />
                              </div>
                              <span className="font-semibold text-foreground">{org.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {org.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(org.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                              {orgUsers.length}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                              {orgConnections}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
