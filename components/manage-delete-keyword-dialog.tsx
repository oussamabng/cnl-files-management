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
import { Trash2, Tag } from "lucide-react";

interface ManageDeleteKeywordDialogProps {
  groupName: string;
  keywordName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ManageDeleteKeywordDialog({
  groupName,
  keywordName,
  open,
  onOpenChange,
  onSuccess,
}: ManageDeleteKeywordDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise((resolve) => setTimeout(resolve, 800));

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Une erreur est survenue lors de la suppression");
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

          <AlertDialogDescription asChild>
            {isLoading ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span>
                    Suppression de « {keywordName} » du groupe « {groupName}{" "}
                    »...
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loading variant="dots" size="sm" />
                  <span>Cela peut prendre quelques instants</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  Êtes-vous sûr de vouloir supprimer le mot-clé « {keywordName}{" "}
                  » du groupe « {groupName} » ?
                </p>
                <p className="block mt-2 text-sm text-muted-foreground">
                  Cette action est irréversible.
                </p>
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
            disabled={isLoading}
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
