import { create } from 'zustand'

interface AuthState {
  user: null | { id: string; email: string }
  setUser: (user: AuthState['user']) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
