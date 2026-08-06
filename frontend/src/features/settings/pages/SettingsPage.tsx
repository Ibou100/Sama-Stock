import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Lock, CheckCircle2, Loader2, Building2 } from 'lucide-react'

export function SettingsPage() {
  const { user, profile } = useAuthStore()

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' }); return }
    if (newPwd.length < 6) { setPwdMsg({ type: 'error', text: 'Le mot de passe doit faire au moins 6 caractères.' }); return }
    setPwdLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      setPwdMsg({ type: 'success', text: 'Mot de passe mis à jour avec succès !' })
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Erreur lors du changement de mot de passe.' })
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Paramètres</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez votre compte et vos préférences</p>
      </div>

      {/* Profil */}
      <div className="glass rounded-xl border border-border/50 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Mon profil</h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user?.email?.substring(0, 2).toUpperCase() ?? 'SS'}
          </div>
          <div>
            <p className="font-semibold">{user?.email}</p>
            <p className="text-sm text-muted-foreground">Propriétaire · Compte actif</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <Input value={user?.email ?? ''} disabled className="bg-background/30 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Rôle</label>
            <Input value="Propriétaire" disabled className="bg-background/30 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Organisation */}
      <div className="glass rounded-xl border border-border/50 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-violet-400" />
          <h3 className="font-semibold">Organisation</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">ID Organisation</label>
            <Input value={(profile as any)?.organization_id ?? '—'} disabled className="bg-background/30 text-muted-foreground text-xs font-mono" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Membre depuis</label>
            <Input
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
              disabled className="bg-background/30 text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Changer le mot de passe */}
      <div className="glass rounded-xl border border-border/50 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold">Changer le mot de passe</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nouveau mot de passe</label>
            <Input
              type="password"
              placeholder="Min. 6 caractères"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
            <Input
              type="password"
              placeholder="Répéter le mot de passe"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              className="bg-background/50"
            />
          </div>

          {pwdMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
              pwdMsg.type === 'success'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-destructive bg-destructive/10 border-destructive/20'
            }`}>
              {pwdMsg.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {pwdMsg.text}
            </div>
          )}

          <Button type="submit" disabled={pwdLoading || !newPwd || !confirmPwd} className="glow-primary">
            {pwdLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mettre à jour le mot de passe
          </Button>
        </form>
      </div>

      {/* Version */}
      <p className="text-xs text-muted-foreground text-center pt-2">Sama Stock v1.0.0 — Gestion de stock multi-tenant</p>
    </div>
  )
}
