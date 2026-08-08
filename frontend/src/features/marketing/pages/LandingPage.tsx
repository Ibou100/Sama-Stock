import { Link } from 'react-router-dom'
import {
  Package,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Users,
  ShieldCheck,
  Smartphone,
  MessageCircle,
} from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">Sama Stock</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Se connecter
            </Link>
            <Link
              to="/auth/register"
              className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-neutral-200 transition-all shadow-lg hover:shadow-white/20"
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-40"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Nouvelle génération
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Gérez votre stock avec une <span className="gradient-text">précision absolue.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            La solution tout-en-un pour les entreprises exigeantes. Centralisez vos achats, 
            vos ventes, et suivez votre inventaire en temps réel sans prise de tête.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/register"
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-semibold text-lg hover:bg-primary/90 glow-primary transition-all hover:scale-105"
            >
              Créer mon espace <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-4 rounded-full glass border border-border/50 text-foreground font-semibold text-lg hover:bg-accent/50 transition-all"
            >
              Découvrir les fonctions
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-accent/5 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Conçu pour votre croissance</h2>
            <p className="text-muted-foreground">Tout ce dont vous avez besoin pour piloter votre entreprise de la gestion des fournisseurs jusqu'à la facturation client.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Package,
                title: 'Inventaire en temps réel',
                desc: 'Ne soyez plus jamais en rupture de stock. Suivez chaque mouvement avec précision.'
              },
              {
                icon: ShieldCheck,
                title: 'Multi-boutiques sécurisé',
                desc: 'Vos données sont cryptées et totalement isolées des autres entreprises sur la plateforme.'
              },
              {
                icon: BarChart3,
                title: 'Rapports & Statistiques',
                desc: 'Analysez votre chiffre d\'affaires et la valeur de votre stock en un coup d\'œil.'
              },
              {
                icon: Users,
                title: 'Clients & Fournisseurs',
                desc: 'Gérez votre base de contacts facilement pour fluidifier vos commandes.'
              },
              {
                icon: TrendingUp,
                title: 'Commandes automatisées',
                desc: 'Réceptionnez vos commandes fournisseurs pour incrémenter le stock automatiquement.'
              },
              {
                icon: Smartphone,
                title: 'Accessible partout',
                desc: 'Utilisez Sama Stock sur votre ordinateur, votre tablette ou votre téléphone.'
              }
            ].map((feature, i) => (
              <div key={i} className="glass p-6 rounded-2xl border border-border/50 hover:border-primary/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à digitaliser votre stock ?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Rejoignez le programme de test gratuit de Sama Stock et aidez-nous à construire l'outil parfait pour vous.
          </p>
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold text-lg hover:bg-neutral-200 transition-all shadow-xl hover:shadow-white/20"
          >
            Commencer l'essai gratuit
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <div className="h-6 w-6 rounded flex items-center justify-center bg-primary">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold">Sama Stock</span>
            </div>
            
            <div className="flex items-center gap-4">
              <a 
                href="https://wa.me/221774559026" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors bg-accent/50 px-4 py-2 rounded-full border border-border/50"
              >
                <MessageCircle className="w-4 h-4" />
                Support WhatsApp : +221 77 455 90 26
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground opacity-60">
            © {new Date().getFullYear()} Sama Stock. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
