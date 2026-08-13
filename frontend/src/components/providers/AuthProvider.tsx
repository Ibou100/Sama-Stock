import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setLoading, setProfile } = useAuthStore()

  useEffect(() => {
    const fetchProfile = async (session: any) => {
      if (session?.user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (error) {
          console.error("Erreur AuthProvider fetchProfile:", error)
          alert("Erreur lors du chargement de votre profil: " + error.message)
        }
        setProfile(data)
      } else {
        setProfile(null)
      }
    }

    // 1. Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      fetchProfile(session).finally(() => setLoading(false))
    })

    // 2. Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      fetchProfile(session).finally(() => setLoading(false))

      // Log connection for analytics (fire-and-forget)
      if (event === 'SIGNED_IN' && session?.user) {
        supabase.rpc('log_user_login').then(({ error }) => {
          if (error) console.warn('Login log failed:', error.message)
        })
      }
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [setSession, setLoading, setProfile])

  return <>{children}</>
}
