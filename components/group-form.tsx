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

const GroupSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du groupe est requis")
    .max(100, "Le nom du groupe est trop long"),
});

type GroupFormValues = z.infer<typeof GroupSchema>;

interface GroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: { id: string; name: string } | null;
  parentId?: string | null;
  onSuccess: () => void;
}

export function GroupForm({
  open,
  onOpenChange,
  group,
  parentId,
  onSuccess,
}: GroupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(GroupSchema),
    defaultValues: {
      name: group?.name || "",
    },
  });

  const onSubmit = async (values: GroupFormValues) => {
    setIsLoading(true);
    setError("");

    try {
      const url = group ? `/api/groups/${group.id}` : "/api/groups";
      const method = group ? "PUT" : "POST";

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
        setError(data.message || "Une  s'est produite");
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
            {group ? "Modifier le groupe" : "Créer un groupe"}
          </DialogTitle>
          <DialogDescription>
            {group
              ? "Mettre à jour le nom du groupe."
              : "Créer un nouveau groupe pour organiser vos fichiers."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du groupe</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Saisissez le nom du groupe"
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
                  : group
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
