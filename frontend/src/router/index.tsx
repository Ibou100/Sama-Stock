import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ProtectedRoute } from '@/components/providers/ProtectedRoute'
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ProductsPage } from '@/features/products/pages/ProductsPage'
import { StockPage } from '@/features/stock/pages/StockPage'
import { SuppliersPage } from '@/features/suppliers/pages/SuppliersPage'
import { CustomersPage } from '@/features/customers/pages/CustomersPage'
import { InvoicesPage } from '@/features/invoices/pages/InvoicesPage'
import { OrdersPage } from '@/features/orders/pages/OrdersPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'

import { LandingPage } from '@/features/marketing/pages/LandingPage'
import { SuperAdminPage } from '@/features/superadmin/pages/SuperAdminPage'

import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/super-admin',
    element: <SuperAdminPage />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'stock', element: <StockPage /> },
          { path: 'suppliers', element: <SuppliersPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'invoices', element: <InvoicesPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])
