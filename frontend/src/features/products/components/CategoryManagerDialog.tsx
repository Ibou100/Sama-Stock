import { useState } from 'react'
import { useProductStore } from '@/stores/useProductStore'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Plus } from 'lucide-react'

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim() || !profile?.organization_id) return
    
    try {
      await createCategory({
        name: newCategoryName.trim(),
        organization_id: profile.organization_id
      })
      setNewCategoryName('')
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la création de la catégorie')
    }
  }

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditName(currentName)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null)
      return
    }
    
    try {
      await updateCategory(id, { name: editName.trim() })
      setEditingId(null)
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la mise à jour de la catégorie')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${name}" ? Les produits associés n'auront plus de catégorie.`)) {
      try {
        await deleteCategory(id)
      } catch (error: any) {
        alert(error.message || 'Erreur lors de la suppression de la catégorie')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 text-foreground">
        <DialogHeader>
          <DialogTitle>Gestion des Catégories</DialogTitle>
          <DialogDescription>
            Organisez vos produits en créant des catégories (ex: Médicaments, Cosmétiques).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="Nouvelle catégorie..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="bg-background/50 flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!newCategoryName.trim() || isLoading} className="glow-primary">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </form>

          {/* Categories List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
