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

const keywordSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du mot-clé est requis")
    .max(100, "Le nom du mot-clé est trop long"),
});

type KeywordFormValues = z.infer<typeof keywordSchema>;

interface KeywordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyword?: { id: string; name: string } | null;
  onSuccess: () => void;
}

export function KeywordForm({
  open,
  onOpenChange,
  keyword,
  onSuccess,
}: KeywordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<KeywordFormValues>({
    resolver: zodResolver(keywordSchema),
    defaultValues: {
      name: keyword?.name || "",
    },
  });

  const onSubmit = async (values: KeywordFormValues) => {
    setIsLoading(true);
    setError("");

    try {
      const url = keyword ? `/api/keywords/${keyword.id}` : "/api/keywords";
      const method = keyword ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        setError(data.error || "Une erreur est survenue");
      }
    } catch {
      setError("Une erreur est survenue");
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
            {keyword ? "Modifier le mot-clé" : "Créer un mot-clé"}
          </DialogTitle>
          <DialogDescription>
            {keyword
              ? "Mettre à jour le nom du mot-clé."
              : "Ajouter un nouveau mot-clé pour filtrer les fichiers."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du mot-clé</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Entrer le nom du mot-clé"
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
                  : keyword
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
