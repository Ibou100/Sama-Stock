import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Lock, CheckCircle2, Loader2, Building2, Users, X, Mail, UserPlus, AlertCircle } from 'lucide-react'
import { useTeamStore } from '@/stores/useTeamStore'
import { useEffect } from 'react'

export function SettingsPage() {
  const { user, profile } = useAuthStore()

  const [, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile')

  const { members, fetchMembers, isLoading: teamLoading } = useTeamStore()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'employee' | 'admin'>('employee')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (activeTab === 'team') {
      fetchMembers()
    }
  }, [activeTab, fetchMembers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteMsg(null)
    try {
      // 1. Create user via Supabase Auth admin invite (using signUp as workaround)
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteEmail,
        password: tempPassword,
      })
      if (signUpError) throw signUpError

      const newUserId = signUpData.user?.id
      if (!newUserId) throw new Error("L'utilisateur n'a pas pu être créé.")

      // 2. Update the profile to link to the same organization
      const orgId = (profile as any)?.organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: orgId, role: inviteRole })
        .eq('id', newUserId)
      if (profileError) throw profileError

      // 3. Send password reset so the employee can set their own password
      await supabase.auth.resetPasswordForEmail(inviteEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      setInviteMsg({ type: 'success', text: `Invitation envoyée à ${inviteEmail} ! L'employé recevra un email pour définir son mot de passe.` })
      setInviteEmail('')
      fetchMembers()
    } catch (err: any) {
      setInviteMsg({ type: 'error', text: err.message || "Erreur lors de l'invitation." })
    } finally {
      setInviteLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Propriétaire'
      case 'admin': return 'Administrateur'
      case 'employee': return 'Employé'
      default: return role
    }
  }

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

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border/50 pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Mon profil
        </button>
        {((profile as any)?.role === 'owner' || (profile as any)?.role === 'admin') && (
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Mon équipe
          </button>
        )}
      </div>

      {activeTab === 'profile' ? (
        <div className="space-y-6">
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
            <p className="text-sm text-muted-foreground">{getRoleLabel((profile as any)?.role)} · Compte actif</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <Input value={user?.email ?? ''} disabled className="bg-background/30 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Rôle</label>
            <Input value={getRoleLabel((profile as any)?.role)} disabled className="bg-background/30 text-muted-foreground" />
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
      </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-emerald-400" /> Membres de l'équipe</h3>
              <p className="text-sm text-muted-foreground mt-1">Gérez les accès de vos collaborateurs.</p>
            </div>
            <Button className="glow-primary gap-2" onClick={() => { setInviteOpen(true); setInviteMsg(null) }}>
              <UserPlus className="w-4 h-4" /> Inviter un membre
            </Button>
          </div>

          <div className="glass rounded-xl border border-border/50 overflow-hidden">
            {teamLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-accent/30 border-b border-border/50 uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Utilisateur</th>
                    <th className="px-6 py-4 font-medium">Rôle</th>
                    <th className="px-6 py-4 font-medium">Date d'ajout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-accent/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {member.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{member.full_name || 'Sans nom'}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          member.role === 'owner' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' :
                          member.role === 'admin' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Version */}
      <p className="text-xs text-muted-foreground text-center pt-2">Sama Stock v1.0.0 — Gestion de stock multi-tenant</p>

      {/* Modal Inviter un membre */}
      {inviteOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="relative w-full max-w-md glass border border-border/50 rounded-2xl shadow-2xl pointer-events-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
                <div>
                  <h2 className="text-base font-semibold gradient-text">Inviter un membre</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">L'employé recevra un email pour définir son mot de passe.</p>
                </div>
                <button onClick={() => setInviteOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email de l'employé *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="employe@example.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="pl-10 bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Rôle attribué</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as 'employee' | 'admin')}
                    className="w-full h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="employee">Employé (accès limité)</option>
                    <option value="admin">Administrateur (accès complet)</option>
                  </select>
                </div>

                {inviteMsg && (
                  <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg border ${
                    inviteMsg.type === 'success'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-destructive bg-destructive/10 border-destructive/20'
                  }`}>
                    {inviteMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    <span>{inviteMsg.text}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={inviteLoading || !inviteEmail} className="glow-primary gap-2">
                    {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Envoyer l'invitation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
