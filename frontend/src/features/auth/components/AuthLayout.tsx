import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center space-y-2 mb-8 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
            SS
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sama Stock</h1>
          <p className="text-sm text-muted-foreground">
            La gestion de stock moderne et simplifiée
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
