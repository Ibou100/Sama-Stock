import { useState, useEffect } from 'react'
import { useAuthStore, type BusinessType } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  User,
  Lock,
  CheckCircle2,
  Loader2,
  Building2,
  Users,
  X,
  Mail,
  UserPlus,
  AlertCircle,
  ShoppingBag,
  Pill,
  Wrench,
  Store,
  Layers,
  Save,
  Check,
} from 'lucide-react'
import { useTeamStore } from '@/stores/useTeamStore'

export function SettingsPage() {
  const { user, profile, organization, setOrganization } = useAuthStore()

  const [, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'team'>('profile')

  // Organization settings state
  const [orgName, setOrgName] = useState(organization?.name || '')
  const [bType, setBType] = useState<BusinessType>(organization?.business_type || 'general')
  const [enableExpiry, setEnableExpiry] = useState<boolean>(organization?.enable_expiry_tracking ?? false)
  const [enableUnits, setEnableUnits] = useState<boolean>(organization?.enable_extended_units ?? false)
  const [enableSerial, setEnableSerial] = useState<boolean>(organization?.enable_serial_numbers ?? false)
  const [orgLoading, setOrgLoading] = useState(false)
  const [orgMsg, setOrgMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { members, fetchMembers, isLoading: teamLoading } = useTeamStore()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'employee' | 'admin'>('employee')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '')
      setBType(organization.business_type || 'general')
      setEnableExpiry(organization.enable_expiry_tracking ?? false)
      setEnableUnits(organization.enable_extended_units ?? false)
      setEnableSerial(organization.enable_serial_numbers ?? false)
    }
  }, [organization])

  useEffect(() => {
    if (activeTab === 'team') {
      fetchMembers()
    }
  }, [activeTab, fetchMembers])

  const handleSelectSector = (type: BusinessType) => {
    setBType(type)
    if (type === 'general') {
      setEnableExpiry(false)
      setEnableUnits(false)
      setEnableSerial(true)
    } else if (type === 'pharmacy') {
      setEnableExpiry(true)
      setEnableUnits(false)
      setEnableSerial(false)
    } else if (type === 'quincaillerie') {
      setEnableExpiry(false)
      setEnableUnits(true)
      setEnableSerial(false)
    } else if (type === 'supermarket') {
      setEnableExpiry(true)
      setEnableUnits(false)
      setEnableSerial(false)
    }
  }

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization?.id) return
    setOrgLoading(true)
    setOrgMsg(null)

    try {
      const payload = {
        name: orgName,
        business_type: bType,
        enable_expiry_tracking: enableExpiry,
        enable_extended_units: enableUnits,
        enable_serial_numbers: enableSerial,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('organizations')
        .update(payload)
        .eq('id', organization.id)

      if (error) throw error

      setOrganization({
        ...organization,
        ...payload,
      })

      setOrgMsg({
        type: 'success',
        text: 'Configuration et profil métier enregistrés avec succès ! Les formulaires et tableaux ont été adaptés.',
      })
    } catch (err: any) {
      setOrgMsg({
        type: 'error',
        text: err.message || 'Erreur lors de la sauvegarde.',
      })
    } finally {
      setOrgLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteMsg(null)
    try {
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteEmail,
        password: tempPassword,
      })
      if (signUpError) throw signUpError

      const newUserId = signUpData.user?.id
      if (!newUserId) throw new Error("L'utilisateur n'a pas pu être créé.")

      const orgId = (profile as any)?.organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: orgId, role: inviteRole })
        .eq('id', newUserId)
      if (profileError) throw profileError

      await supabase.auth.resetPasswordForEmail(inviteEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      setInviteMsg({
        type: 'success',
        text: `Invitation envoyée à ${inviteEmail} ! L'employé recevra un email pour définir son mot de passe.`,
      })
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
      case 'owner':
        return 'Propriétaire'
      case 'admin':
        return 'Administrateur'
      case 'employee':
        return 'Employé'
      default:
        return role
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' })
      return
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: 'error', text: 'Le mot de passe doit faire au moins 6 caractères.' })
      return
    }
    setPwdLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      setPwdMsg({ type: 'success', text: 'Mot de passe mis à jour avec succès !' })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Erreur lors du changement de mot de passe.' })
    } finally {
      setPwdLoading(false)
    }
  }

  const canEditOrg = (profile as any)?.role === 'owner' || (profile as any)?.role === 'admin' || (profile as any)?.is_super_admin

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Paramètres</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérez votre profil, votre secteur d'activité métier et votre équipe
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border/50 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Mon profil
        </button>

        <button
          onClick={() => setActiveTab('organization')}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'organization'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Store className="w-4 h-4" />
          Mon Entreprise & Métier
        </button>

        {((profile as any)?.role === 'owner' || (profile as any)?.role === 'admin') && (
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'team'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            Mon équipe
          </button>
        )}
      </div>

      {/* ══════════════ TAB 1: MON PROFIL ══════════════ */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profil */}
          <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Mon profil utilisateur</h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {user?.email?.substring(0, 2).toUpperCase() ?? 'SS'}
              </div>
              <div>
                <p className="font-semibold">{user?.email}</p>
                <p className="text-sm text-muted-foreground">
                  {getRoleLabel((profile as any)?.role)} · Compte actif
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <Input value={user?.email ?? ''} disabled className="bg-background/30 text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Rôle</label>
                <Input
                  value={getRoleLabel((profile as any)?.role)}
                  disabled
                  className="bg-background/30 text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Mot de passe */}
          <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
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
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
                <Input
                  type="password"
                  placeholder="Répéter le mot de passe"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {pwdMsg && (
                <div
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                    pwdMsg.type === 'success'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-destructive bg-destructive/10 border-destructive/20'
                  }`}
                >
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
      )}

      {/* ══════════════ TAB 2: MON ENTREPRISE & SECTEUR D'ACTIVITÉ ══════════════ */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveOrganization} className="space-y-6">
            {/* Informations Générales */}
            <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Informations de l'entreprise</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Ces informations apparaîtront sur vos factures, reçus thermiques et bons de commande.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nom de l'établissement *</label>
                  <Input
                    value={orgName}
                    disabled={!canEditOrg}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex: Boutique Sama Tech, Pharmacie du Port..."
                    className="bg-background/50"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Plan d'abonnement</label>
                  <div className="h-10 px-3 rounded-lg border border-border/50 bg-background/30 flex items-center justify-between text-sm">
                    <span className="font-semibold text-primary">{organization?.plan || 'Essai Pro'}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      Actif
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sélecteur de Métier / Secteur d'activité */}
            <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-amber-400" />
                    <h3 className="font-semibold">Secteur d'activité & Profil Métier</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choisissez votre type de commerce : l'interface s'adaptera automatiquement pour masquer les champs inutiles.
                  </p>
                </div>
              </div>

              {/* 4 Cards de Métier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* 1. Boutique / Commerce Général */}
                <div
                  onClick={() => canEditOrg && handleSelectSector('general')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    bType === 'general'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary'
                      : 'border-border/50 bg-background/40 hover:border-border hover:bg-accent/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          Boutique & Commerce Général
                          {bType === 'general' && <Check className="w-4 h-4 text-primary" />}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Téléphonie, Bagagerie, Prêt-à-porter, Informatique, Chaussures
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30 text-[11px] text-muted-foreground space-y-1">
                    <p className="text-emerald-400 font-medium">✓ Formulaire produit épuré (Nom, Prix, Stock)</p>
                    <p className="text-muted-foreground">✓ Caisse tactile POS & tickets thermiques</p>
                    <p className="text-rose-400/80">✗ Aucune date de péremption inutile affichée</p>
                  </div>
                </div>

                {/* 2. Pharmacie & Santé */}
                <div
                  onClick={() => canEditOrg && handleSelectSector('pharmacy')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    bType === 'pharmacy'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary'
                      : 'border-border/50 bg-background/40 hover:border-border hover:bg-accent/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          Pharmacie & Parapharmacie
                          {bType === 'pharmacy' && <Check className="w-4 h-4 text-primary" />}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Médicaments, Produits de santé, Parapharmacie, Cosmétique médicale
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30 text-[11px] text-muted-foreground space-y-1">
                    <p className="text-emerald-400 font-medium">✓ Suivi des N° de Lot & Dates de péremption</p>
                    <p className="text-emerald-400 font-medium">✓ Alerte Dashboard des médicaments expirés</p>
                    <p className="text-emerald-400 font-medium">✓ Filtre rapide des péremptions dans le catalogue</p>
                  </div>
                </div>

                {/* 3. Quincaillerie & Matériaux */}
                <div
                  onClick={() => canEditOrg && handleSelectSector('quincaillerie')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    bType === 'quincaillerie'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary'
                      : 'border-border/50 bg-background/40 hover:border-border hover:bg-accent/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          Quincaillerie & Matériaux
                          {bType === 'quincaillerie' && <Check className="w-4 h-4 text-primary" />}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          BTP, Outillage, Ferraille, Peinture, Sanitaire, Vrac, Ciment
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30 text-[11px] text-muted-foreground space-y-1">
                    <p className="text-emerald-400 font-medium">✓ Unités industrielles : Mètre, Kg, Sac, Rouleau, Tonne</p>
                    <p className="text-emerald-400 font-medium">✓ Facturation avec métrages et pondérations</p>
                    <p className="text-rose-400/80">✗ Aucune mention pharmaceutique</p>
                  </div>
                </div>

                {/* 4. Alimentation & Supérette */}
                <div
                  onClick={() => canEditOrg && handleSelectSector('supermarket')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    bType === 'supermarket'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary'
                      : 'border-border/50 bg-background/40 hover:border-border hover:bg-accent/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                          Alimentation & Supérette
                          {bType === 'supermarket' && <Check className="w-4 h-4 text-primary" />}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Épicerie, Boissons, Produits frais, Biscuiterie, Libre-service
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30 text-[11px] text-muted-foreground space-y-1">
                    <p className="text-emerald-400 font-medium">✓ Suivi des Dates Limites de Consommation (DLC)</p>
                    <p className="text-emerald-400 font-medium">✓ Caisse POS rapide code-barres</p>
                    <p className="text-emerald-400 font-medium">✓ Conditionnements (Cartons, Packs, Packs de 6)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modules et Réglages fins */}
            <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
              <h3 className="font-semibold text-sm">Personnalisation avancée des modules</h3>
              <p className="text-xs text-muted-foreground">
                Activez ou désactivez ces modules selon vos besoins spécifiques :
              </p>

              <div className="space-y-3 pt-1">
                {/* Module Numéros de série / IMEI */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:bg-accent/20 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={enableSerial}
                    disabled={!canEditOrg}
                    onChange={(e) => setEnableSerial(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Traçabilité Numéros de série & Codes IMEI
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ajoute un champ discret pour renseigner l'IMEI ou numéro de série unique (Recommandé pour smartphones, tablettes, valises avec garantie).
                    </p>
                  </div>
                </label>

                {/* Module Péremption */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:bg-accent/20 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={enableExpiry}
                    disabled={!canEditOrg}
                    onChange={(e) => setEnableExpiry(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Dates d'expiration et alertes de péremption
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active le calendrier d'expiration sur les produits et le bandeau d'alerte sur le tableau de bord.
                    </p>
                  </div>
                </label>

                {/* Module Unités étendues */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:bg-accent/20 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={enableUnits}
                    disabled={!canEditOrg}
                    onChange={(e) => setEnableUnits(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Unités de mesure industrielles (Mètres, Kg, Sacs, Litres, Tonnes)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active le sélecteur d'unités de mesure de quincaillerie et de vrac.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notification */}
            {orgMsg && (
              <div
                className={`flex items-start gap-2 text-sm p-4 rounded-xl border ${
                  orgMsg.type === 'success'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-destructive bg-destructive/10 border-destructive/20'
                }`}
              >
                {orgMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <span>{orgMsg.text}</span>
              </div>
            )}

            {canEditOrg && (
              <div className="flex justify-end">
                <Button type="submit" disabled={orgLoading} className="glow-primary gap-2">
                  {orgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer les paramètres métier
                </Button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ══════════════ TAB 3: MON ÉQUIPE ══════════════ */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Membres de l'équipe
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Gérez les accès de vos collaborateurs.</p>
            </div>
            <Button
              className="glow-primary gap-2"
              onClick={() => {
                setInviteOpen(true)
                setInviteMsg(null)
              }}
            >
              <UserPlus className="w-4 h-4" /> Inviter un membre
            </Button>
          </div>

          <div className="glass rounded-xl border border-border/50 overflow-hidden">
            {teamLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
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
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            member.role === 'owner'
                              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                              : member.role === 'admin'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
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
      <p className="text-xs text-muted-foreground text-center pt-2">
        Sama Stock v1.0.0 — Gestion de stock multi-tenant modulaire
      </p>

      {/* Modal Inviter un membre */}
      {inviteOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="relative w-full max-w-md glass border border-border/50 rounded-2xl shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
                <div>
                  <h2 className="text-base font-semibold gradient-text">Inviter un membre</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    L'employé recevra un email pour définir son mot de passe.
                  </p>
                </div>
                <button
                  onClick={() => setInviteOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
                >
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
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="pl-10 bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Rôle attribué</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'employee' | 'admin')}
                    className="w-full h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="employee">Employé (accès limité)</option>
                    <option value="admin">Administrateur (accès complet)</option>
                  </select>
                </div>

                {inviteMsg && (
                  <div
                    className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg border ${
                      inviteMsg.type === 'success'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-destructive bg-destructive/10 border-destructive/20'
                    }`}
                  >
                    {inviteMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{inviteMsg.text}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
                    Annuler
                  </Button>
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
