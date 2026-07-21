import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'

export function ProtectedRoute() {
  const { session, isLoading } = useAuthStore()

  if (isLoading) {
    // A simple loading screen while checking Supabase session
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If there is no session, redirect to the login page
  if (!session) {
    return <Navigate to="/auth/login" replace />
  }

  // If authenticated, render the child routes (e.g., Dashboard Layout)
  return <Outlet />
}
