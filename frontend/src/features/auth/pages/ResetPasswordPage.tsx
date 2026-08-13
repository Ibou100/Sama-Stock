import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Lock, Loader2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase sends the recovery token in the URL hash.
    // The onAuthStateChange listener picks it up and creates a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery session is active — user can now set a new password
        setIsReady(true)
        setIsCheckingSession(false)
        setError(null)
      } else if (event === 'SIGNED_IN' && session) {
        // Sometimes Supabase fires SIGNED_IN instead of PASSWORD_RECOVERY
        setIsReady(true)
        setIsCheckingSession(false)
        setError(null)
      }
    })

    // Timeout: if no event fires within 3 seconds, the link is expired or invalid
    const timeout = setTimeout(() => {
      setIsCheckingSession(false)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
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
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la mise à jour du mot de passe.")
    } finally {
      setIsLoading(false)
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="glass p-8 rounded-2xl border border-border/50 shadow-2xl text-center">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Mot de passe mis à jour !</h2>
        <p className="text-muted-foreground mb-6">
          Votre mot de passe a été changé avec succès.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-primary text-white rounded-lg px-6 py-2.5 font-medium hover:bg-primary/90 transition-all"
        >
          Aller au tableau de bord
        </button>
      </div>
    )
  }

  // Loading state — waiting for Supabase to process the token
  if (isCheckingSession) {
    return (
      <div className="glass p-8 rounded-2xl border border-border/50 shadow-2xl text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Vérification en cours...</h2>
        <p className="text-muted-foreground text-sm">
          Nous vérifions votre lien de réinitialisation.
        </p>
      </div>
    )
  }

  // Error state — link expired or invalid
  if (!isReady) {
    return (
      <div className="glass p-8 rounded-2xl border border-border/50 shadow-2xl text-center">
        <div className="w-16 h-16 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Lien expiré</h2>
        <p className="text-muted-foreground mb-6">
          Ce lien de réinitialisation a expiré ou est invalide.<br />
          Veuillez en demander un nouveau.
        </p>
        <Link
          to="/auth/forgot-password"
          className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-6 py-2.5 font-medium hover:bg-primary/90 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Demander un nouveau lien
        </Link>
      </div>
    )
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
