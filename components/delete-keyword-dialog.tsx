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
import { Trash2 } from "lucide-react";

interface DeleteKeywordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyword: { id: string; name: string; _count: { files: number } } | null;
  onSuccess: () => void;
}

export function DeleteKeywordDialog({
  open,
  onOpenChange,
  keyword,
  onSuccess,
}: DeleteKeywordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!keyword) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/keywords/${keyword.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await response.json();
        setError(data.error || "Échec de la suppression du mot-clé");
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
            {isLoading ? "Suppression du mot-clé..." : "Supprimer le mot-clé"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isLoading ? (
              <div className="space-y-2">
                <p>
                  Veuillez patienter pendant la suppression du mot-clé «{" "}
                  {keyword?.name} »...
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loading variant="dots" size="sm" />
                  <span>Cela peut prendre quelques instants</span>
                </div>
              </div>
            ) : (
              <>
                Êtes-vous sûr de vouloir supprimer le mot-clé « {keyword?.name}{" "}
                » ?
                {keyword && keyword._count.files > 0 && (
                  <span className="block mt-2 text-orange-600">
                    Ce mot-clé est actuellement associé à {keyword._count.files}{" "}
                    fichier(s).
                  </span>
                )}
                Cette action est irréversible.
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
