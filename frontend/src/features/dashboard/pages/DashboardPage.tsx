import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export function DashboardPage() {
  const { user } = useAuthStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Tableau de bord</h1>
      <p className="mb-8 text-muted-foreground">
        Bienvenue, {user?.email}. Ceci est votre espace isolé (Tenant).
      </p>
      
      <Button onClick={handleLogout} variant="destructive">
        Se déconnecter
      </Button>
    </div>
  )
}
