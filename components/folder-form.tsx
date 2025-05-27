/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const folderSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du dossier est requis")
    .max(100, "Le nom du dossier est trop long"),
});

type FolderFormValues = z.infer<typeof folderSchema>;

interface FolderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: { id: string; name: string } | null;
  parentId?: string | null;
  onSuccess: () => void;
}

export function FolderForm({
  open,
  onOpenChange,
  folder,
  parentId,
  onSuccess,
}: FolderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: folder?.name || "",
    },
  });

  const onSubmit = async (values: FolderFormValues) => {
    setIsLoading(true);
    setError("");

    try {
      const url = folder ? `/api/folders/${folder.id}` : "/api/folders";
      const method = folder ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          parentId: parentId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        setError(data.error || "Une erreur s'est produite");
      }
    } catch (err) {
      setError("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {folder ? "Modifier le dossier" : "Créer un dossier"}
          </DialogTitle>
          <DialogDescription>
            {folder
              ? "Mettre à jour le nom du dossier."
              : "Créer un nouveau dossier pour organiser vos fichiers."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du dossier</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Saisissez le nom du dossier"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Enregistrement..."
                  : folder
                  ? "Mettre à jour"
                  : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
