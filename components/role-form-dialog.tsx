"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

interface RoleFormDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleUpdated: () => void
}

const AVAILABLE_PERMISSIONS = [
  { id: "read_files", name: "Lire les fichiers", category: "Fichiers" },
  { id: "write_files", name: "Écrire les fichiers", category: "Fichiers" },
  { id: "delete_files", name: "Supprimer les fichiers", category: "Fichiers" },
  { id: "manage_folders", name: "Gérer les dossiers", category: "Dossiers" },
  { id: "manage_users", name: "Gérer les utilisateurs", category: "Administration" },
  { id: "manage_roles", name: "Gérer les rôles", category: "Administration" },
  { id: "view_dashboard", name: "Voir le tableau de bord", category: "Dashboard" },
  { id: "manage_keywords", name: "Gérer les mots-clés", category: "Métadonnées" },
]

export function RoleFormDialog({ role, open, onOpenChange, onRoleUpdated }: RoleFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        permissions: [],
      })
    }
  }, [role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = role ? `/api/roles/${role.id}` : "/api/roles"
      const method = role ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onRoleUpdated()
      }
    } catch (error) {
      console.error("Error saving role:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked ? [...prev.permissions, permissionId] : prev.permissions.filter((p) => p !== permissionId),
    }))
  }

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    },
    {} as Record<string, typeof AVAILABLE_PERMISSIONS>,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? "Modifier le rôle" : "Créer un nouveau rôle"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du rôle</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Administrateur, Éditeur..."
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description du rôle et de ses responsabilités"
                rows={3}
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="space-y-4 mt-2">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={formData.permissions.includes(permission.id)}
                            onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                          />
                          <Label htmlFor={permission.id} className="text-sm font-normal cursor-pointer">
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {formData.permissions.length > 0 && (
              <div>
                <Label>Permissions sélectionnées</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.permissions.map((permissionId) => {
                    const permission = AVAILABLE_PERMISSIONS.find((p) => p.id === permissionId)
                    return (
                      <Badge key={permissionId} variant="secondary">
                        {permission?.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : role ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
