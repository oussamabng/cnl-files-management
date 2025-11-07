/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";
import { Trash2, Layers } from "lucide-react";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: string;
    name: string;
    _count: { children: number; keywords: number };
  } | null;
  onSuccess: () => void;
}

export function DeleteGroupDialog({
  open,
  onOpenChange,
  group,
  onSuccess,
}: DeleteFolderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!group) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await response.json();
        setError(data.error || "Échec de la suppression du groupe");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      setError("");
      onOpenChange(newOpen);
    }
  };

  const hasContent =
    group && (group._count.children > 0 || group._count.keywords > 0);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={isLoading ? "pointer-events-none" : ""}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isLoading ? (
              <Loading variant="spinner" size="sm" />
            ) : (
              <Trash2 className="h-4 w-4 text-destructive" />
            )}
            {isLoading ? "Suppression du groupe..." : "Supprimer le groupe"}
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            {isLoading ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span>Suppression du group « {group?.name} »...</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loading variant="dots" size="sm" />
                  <span>Cela peut prendre quelques instants</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  Êtes-vous sûr de vouloir supprimer le group « {group?.name} »
                  ?
                </p>
                {hasContent && (
                  <p className="block mt-2 text-orange-600">
                    Ce groupe contient {group._count.keywords} mot-clé(s) et{" "}
                    {group._count.children} sous-gorups(s). Veuillez d'abord
                    déplacer ou supprimer le contenu.
                  </p>
                )}
                {!hasContent && (
                  <p className="block mt-2">Cette action est irréversible.</p>
                )}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {isLoading ? "Veuillez patienter..." : "Annuler"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || Boolean(hasContent)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loading variant="spinner" size="sm" />
                Suppression...
              </div>
            ) : (
              <div className="flex items-center gap-2 cursor-pointer text-white">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
