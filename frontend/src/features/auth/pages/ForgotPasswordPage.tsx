import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi de l'email.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="glass p-8 rounded-2xl border border-border/50 text-center shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Vérifiez vos emails</h2>
        <p className="text-muted-foreground mb-6">
          Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. 
          Veuillez cliquer sur ce lien pour choisir votre nouveau mot de passe.
        </p>
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="glass p-8 rounded-2xl border border-border/50 shadow-2xl">
      <div className="mb-6">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <h2 className="text-2xl font-bold mb-2">Mot de passe oublié ?</h2>
        <p className="text-muted-foreground text-sm">
          Entrez l'adresse email associée à votre compte, et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="votre@email.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white rounded-lg py-2.5 font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer le lien"}
        </button>
      </form>
    </div>
  )
}
