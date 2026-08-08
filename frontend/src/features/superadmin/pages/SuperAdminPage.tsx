import { useEffect } from 'react'
import { useSuperAdminStore } from '@/stores/useSuperAdminStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Navigate } from 'react-router-dom'
import { Building2, Users, Crown, Calendar, Activity, Loader2 } from 'lucide-react'
export function SuperAdminPage() {
  const { profile, isLoading: authLoading } = useAuthStore()
  const { organizations, profiles, isLoading, fetchPlatformData } = useSuperAdminStore()

  useEffect(() => {
    if (profile?.is_super_admin) {
      fetchPlatformData()
    }
  }, [profile, fetchPlatformData])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Security check: if not super admin, kick them out
  if (!profile?.is_super_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between glass p-6 rounded-2xl border border-border/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl font-bold gradient-text">Backoffice God Mode</h1>
            </div>
            <p className="text-muted-foreground">Vue d'ensemble de la plateforme Sama Stock</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Super Admin</p>
            <p className="font-semibold">{profile?.email}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl border border-border/50 flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-violet-400" />
                </div>
                <div>
                  <p className="text-4xl font-bold">{organizations.length}</p>
                  <p className="text-muted-foreground">Entreprises (Tenants)</p>
                </div>
              </div>
              <div className="glass p-6 rounded-2xl border border-border/50 flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <p className="text-4xl font-bold">{profiles.length}</p>
                  <p className="text-muted-foreground">Utilisateurs au total</p>
                </div>
              </div>
            </div>

            {/* Organizations List */}
            <div className="glass rounded-2xl border border-border/50 overflow-hidden">
              <div className="p-6 border-b border-border/50 flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Liste des Entreprises</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-accent/30 border-b border-border/50 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">Nom de l'entreprise</th>
                      <th className="px-6 py-4 font-medium">ID (Tenant)</th>
                      <th className="px-6 py-4 font-medium">Création</th>
                      <th className="px-6 py-4 font-medium">Utilisateurs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {organizations.map((org) => {
                      const orgUsers = profiles.filter(p => p.organization_id === org.id)
                      return (
                        <tr key={org.id} className="hover:bg-accent/20 transition-colors">
                          <td className="px-6 py-4 font-semibold text-foreground">
                            {org.name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {org.id}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(org.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                                {orgUsers.length}
                              </span>
                            </div>
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
