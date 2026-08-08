import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AppErrorBoundary } from '@/components/providers/AppErrorBoundary'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Truck,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Menu,
  TrendingUp,
  Receipt,
  X,
} from 'lucide-react'


const navItems = [
  {
    group: 'Principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
      { to: '/dashboard/products', icon: Package, label: 'Produits' },
      { to: '/dashboard/stock', icon: ArrowLeftRight, label: 'Stock' },
    ],
  },
  {
    group: 'Commerce',
    items: [
      { to: '/dashboard/suppliers', icon: Truck, label: 'Fournisseurs' },
      { to: '/dashboard/orders', icon: ShoppingCart, label: 'Commandes' },
      { to: '/dashboard/customers', icon: Users, label: 'Clients' },
      { to: '/dashboard/invoices', icon: Receipt, label: 'Factures' },
    ],
  },
  {
    group: 'Analyse',
    items: [
      { to: '/dashboard/reports', icon: BarChart3, label: 'Rapports' },
    ],
  },
]

export function DashboardLayout() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  const userInitials = user?.email?.substring(0, 2).toUpperCase() ?? 'SS'

  return (
    <div className="flex h-screen bg-gradient-mesh overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col h-full border-r border-border/50 glass transition-all duration-300 flex-shrink-0 z-30',
          sidebarOpen ? 'w-[260px]' : 'w-[72px]'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 glow-primary">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <span className="font-bold text-base gradient-text">Sama Stock</span>
              <p className="text-[10px] text-muted-foreground">Gestion multi-tenant</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {navItems.filter(group => {
            if (group.group === 'Analyse') {
              return (profile as any)?.role === 'owner' || (profile as any)?.role === 'admin';
            }
            return true;
          }).map((group) => (
            <div key={group.group}>
              {sidebarOpen && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                  {group.group}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map(({ to, icon: Icon, label, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                          isActive
                            ? 'bg-primary/20 text-primary border border-primary/30 glow-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {sidebarOpen && <span>{label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Settings + User */}
        <div className="border-t border-border/50 p-2 space-y-1">
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )
            }
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Paramètres</span>}
          </NavLink>

          {/* User profile */}
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userInitials}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground">{(profile as any)?.role === 'owner' ? 'Propriétaire' : (profile as any)?.role === 'admin' ? 'Administrateur' : 'Employé'}</p>
                </div>
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              </>
            )}
          </button>

          {profileOpen && sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border/50 glass flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Bienvenue 👋</h1>
              <p className="text-xs text-muted-foreground">Tableau de bord — Sama Stock</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
            </button>

            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AppErrorBoundary key={location.pathname}>
            <Outlet />
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  )
}
