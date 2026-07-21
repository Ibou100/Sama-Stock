import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    // We will add child routes here during Sprint 1 (Auth) and Sprint 2 (Dashboard)
  },
])
