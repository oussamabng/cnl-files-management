"use client";

import { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteDialogProps {
  open: boolean;
  title: string;
  description?: string | ReactNode;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  confirmLabel?: string;
}

export function DeleteDialog({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "Supprimer",
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            {title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="space-x-2">
          <AlertDialogCancel asChild>
            <Button variant="outline">Annuler</Button>
          </AlertDialogCancel>
          <AlertDialogAction
            asChild
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 text-white"
          >
            <Button
              variant="destructive"
              onClick={async () => {
                await onConfirm();
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" />

              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
