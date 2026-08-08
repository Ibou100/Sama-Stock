import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from './components/providers/AuthProvider'
import { AppErrorBoundary } from './components/providers/AppErrorBoundary'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </AppErrorBoundary>
)
