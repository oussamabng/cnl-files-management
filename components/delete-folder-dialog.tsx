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
import { Trash2, Folder } from "lucide-react";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: {
    id: string;
    name: string;
    _count: { children: number; files: number };
  } | null;
  onSuccess: () => void;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folder,
  onSuccess,
}: DeleteFolderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!folder) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await response.json();
        setError(data.error || "Échec de la suppression du dossier");
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
    folder && (folder._count.children > 0 || folder._count.files > 0);

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
            {isLoading ? "Suppression du dossier..." : "Supprimer le dossier"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLoading ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-blue-600" />
                  <span>Suppression du dossier « {folder?.name} »...</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loading variant="dots" size="sm" />
                  <span>Suppression du dossier du système</span>
                </div>
              </div>
            ) : (
              <>
                Êtes-vous sûr de vouloir supprimer le dossier « {folder?.name} »
                ?
                {hasContent && (
                  <span className="block mt-2 text-orange-600">
                    Ce dossier contient {folder._count.files} fichier(s) et{" "}
                    {folder._count.children} sous-dossier(s). Veuillez d'abord
                    déplacer ou supprimer le contenu.
                  </span>
                )}
                {!hasContent && (
                  <span className="block mt-2">
                    Cette action est irréversible.
                  </span>
                )}
              </>
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
