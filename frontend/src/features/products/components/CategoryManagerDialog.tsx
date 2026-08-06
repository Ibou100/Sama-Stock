import { useState } from 'react'
import { useProductStore } from '@/stores/useProductStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Plus, X, Tag } from 'lucide-react'

interface CategoryManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryManagerDialog({ open, onOpenChange }: CategoryManagerDialogProps) {
  const { categories, createCategory, updateCategory, deleteCategory, isLoading } = useProductStore()
  const { profile } = useAuthStore()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!newCategoryName.trim()) return
    if (!profile?.organization_id) {
      setError('Profil introuvable. Reconnectez-vous.')
      return
    }
    try {
      await createCategory({ name: newCategoryName.trim(), organization_id: profile.organization_id })
      setNewCategoryName('')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création.')
    }
  }

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) { setEditingId(null); return }
    try {
      await updateCategory(id, { name: editName.trim() })
      setEditingId(null)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Supprimer la catégorie "${name}" ?`)) {
      try {
        await deleteCategory(id)
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la suppression.')
      }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md glass border border-border/50 rounded-2xl shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <div>
                <h2 className="text-base font-semibold gradient-text">Gestion des catégories</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organisez vos produits par catégorie
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            {/* Add form */}
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                placeholder="Nom de la catégorie..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-background/50 flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={!newCategoryName.trim() || isLoading} className="glow-primary">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </form>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucune catégorie pour le moment.
                </p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-accent/10 hover:bg-accent/20 transition-colors"
                  >
                    {editingId === category.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 bg-background/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate(category.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleUpdate(category.id)}>
                          OK
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-sm">{category.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary"
                            onClick={() => startEdit(category.id, category.name)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(category.id, category.name)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
