import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setLoading, setProfile, setOrganization } = useAuthStore()

  useEffect(() => {
    const fetchUserData = async (session: any) => {
      if (session?.user) {
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profError) {
          console.error("Erreur AuthProvider fetchProfile:", profError)
          setProfile(null)
          setOrganization(null)
          return
        }

        setProfile(profData)

        if (profData?.organization_id) {
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profData.organization_id)
            .single()

          if (!orgError && orgData) {
            const bType = orgData.business_type || 'general'
            setOrganization({
              ...orgData,
              business_type: bType,
              enable_expiry_tracking: orgData.enable_expiry_tracking ?? (bType === 'pharmacy' || bType === 'supermarket'),
              enable_extended_units: orgData.enable_extended_units ?? (bType === 'quincaillerie'),
              enable_serial_numbers: orgData.enable_serial_numbers ?? false,
            })
          } else {
            setOrganization(null)
          }
        } else {
          setOrganization(null)
        }
      } else {
        setProfile(null)
        setOrganization(null)
      }
    }

    // 1. Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      fetchUserData(session).finally(() => setLoading(false))
    })

    // 2. Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      fetchUserData(session).finally(() => setLoading(false))

      // Log connection for analytics (fire-and-forget)
      if (event === 'SIGNED_IN' && session?.user) {
        supabase.rpc('log_user_login').then(({ error }) => {
          if (error) console.warn('Login log failed:', error.message)
        })
      }
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [setSession, setLoading, setProfile, setOrganization])

  return <>{children}</>
}
