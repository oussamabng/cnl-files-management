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
import { Trash2, FileText } from "lucide-react";

interface DeleteFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: { id: string; name: string } | null;
  onSuccess: () => void;
}

export function DeleteFileDialog({
  open,
  onOpenChange,
  file,
  onSuccess,
}: DeleteFileDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!file) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await response.json();
        setError(data.error || "Échec de la suppression du fichier");
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
            {isLoading ? "Suppression du fichier..." : "Supprimer le fichier"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLoading ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Suppression de « {file?.name} »...</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loading variant="dots" size="sm" />
                  <span>
                    Suppression du fichier de la base de données et du stockage
                  </span>
                </div>
              </div>
            ) : (
              <>
                Êtes-vous sûr de vouloir supprimer « {file?.name} » ? Cette
                action est irréversible.
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
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loading variant="spinner" size="sm" />
                Suppression...
              </div>
            ) : (
              <div className="flex items-center gap-2">
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
