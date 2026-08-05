import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setLoading, setProfile } = useAuthStore()

  useEffect(() => {
    const fetchProfile = async (session: any) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      fetchProfile(session).finally(() => setLoading(false))
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [setSession, setLoading, setProfile])

  return <>{children}</>
}
