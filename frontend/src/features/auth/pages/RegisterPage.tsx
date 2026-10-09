import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  const [organizationName, setOrganizationName] = useState('')
  const [businessType, setBusinessType] = useState('general')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    // Using Supabase Auth signUp. We pass organization_name, business_type and full_name 
    // in the metadata so our SQL trigger can create the tenant and profile automatically.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          organization_name: organizationName,
          business_type: businessType,
          full_name: fullName,
        }
      }
    })

    if (error) {
      console.error('Supabase Auth Error:', error)
      const errorMessage = typeof error.message === 'string' && error.message.length > 0 && error.message !== '[]' 
        ? error.message 
        : JSON.stringify(error)
      
      setError(errorMessage)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      if (!data.session) {
        setSuccessMsg("Votre compte a été créé avec succès ! Veuillez vérifier votre boîte email pour confirmer votre inscription.")
      }
    }
  }

  if (successMsg) {
    return (
      <Card className="w-full border-none shadow-xl bg-background/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl text-center text-emerald-500">Compte créé !</CardTitle>
          <CardDescription className="text-center mt-2 text-foreground/80">
            {successMsg}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center border-t p-4 mt-2">
          <Link to="/auth/login" className="w-full">
            <Button className="w-full">Accéder à la connexion</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full border-none shadow-xl bg-background/60 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl text-center">Créer votre espace</CardTitle>
        <CardDescription className="text-center">
          Inscrivez votre commerce pour commencer à gérer vos stocks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Nom de votre établissement *</Label>
            <Input 
              id="orgName" 
              placeholder="Ex: Sama Boutique, Pharmacie Centrale, Quincaillerie Moderne..." 
              required 
              value={organizationName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrganizationName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessType">Secteur d'activité / Métier</Label>
            <select
              id="businessType"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full h-10 rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="general">🛍️ Boutique & Commerce Général (Téléphonie, Bagages, Vêtements...)</option>
              <option value="pharmacy">💊 Pharmacie & Santé (Médicaments, Parapharmacie)</option>
              <option value="quincaillerie">🔨 Quincaillerie & Matériaux (BTP, Outillage, Vrac)</option>
              <option value="supermarket">🛒 Alimentation & Supérette (Épicerie, Libre-service)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Votre Nom Complet</Label>
            <Input 
              id="fullName" 
              placeholder="Amadou Ndiaye" 
              required 
              value={fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email professionnel</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="contact@mon-entreprise.com" 
              required 
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe (6 caractères min)</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              minLength={6}
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Création en cours...' : "Créer mon compte d'essai"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4 mt-2">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link to="/auth/login" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
