import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Lock, Loader2 } from 'lucide-react'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if the user is actually in a password recovery session
    supabase.auth.onAuthStateChange(async (event) => {
      if (event == "PASSWORD_RECOVERY") {
        console.log("Password recovery session detected")
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password: password })
      if (error) throw error
      
      // Success - redirect to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la mise à jour du mot de passe.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass p-8 rounded-2xl border border-border/50 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Nouveau mot de passe</h2>
        <p className="text-muted-foreground text-sm">
          Veuillez choisir un nouveau mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Nouveau mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmer le mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white rounded-lg py-2.5 font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mettre à jour le mot de passe"}
        </button>
      </form>
    </div>
  )
}
