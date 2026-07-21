/**
 * App.tsx — Composant racine (placeholder de test Tailwind)
 * Ce composant sera remplacé lors du Sprint 1 (Auth) et Sprint 2 (Layout).
 */
function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Sama Stock</h1>
        <p className="text-muted-foreground text-lg">✅ Tailwind CSS v3 opérationnel</p>
        <div className="flex gap-3 justify-center">
          <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
            React 19
          </span>
          <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
            TypeScript 6
          </span>
          <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
            Tailwind v3
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
