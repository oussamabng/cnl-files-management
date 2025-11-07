"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check } from "lucide-react";

const keywordSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du mot-clé est requis")
    .max(100, "Le nom du mot-clé est trop long"),
  groups: z.array(z.string()).optional(), // array of group IDs
});

type KeywordFormValues = z.infer<typeof keywordSchema>;

interface KeywordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyword?: {
    id: string;
    name: string;
    groups?: { id: string; name: string }[];
  } | null;
  onSuccess: () => void;
}

interface KeywordGroup {
  id: string;
  name: string;
}

export function KeywordForm({
  open,
  onOpenChange,
  keyword,
  onSuccess,
}: KeywordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  const [fetchingGroups, setFetchingGroups] = useState(true);

  const form = useForm<KeywordFormValues>({
    resolver: zodResolver(keywordSchema),
    defaultValues: {
      name: keyword?.name || "",
      groups: keyword?.groups?.map((g) => g.id) || [],
    },
  });

  // Fetch all keyword groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setFetchingGroups(true);
        const res = await fetch("/api/keyword-groups");
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error("Failed to fetch groups", err);
      } finally {
        setFetchingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  const onSubmit = async (values: KeywordFormValues) => {
    setIsLoading(true);
    setError("");

    try {
      const url = keyword ? `/api/keywords/${keyword.id}` : "/api/keywords";
      const method = keyword ? "PUT" : "POST";

      // Send "groups" as "groupIds" for backend
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          groupIds: values.groups || [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        handleOpenChange(false);
      } else {
        setError(data.message || "Une erreur est survenue");
      }
    } catch (err) {
      console.error("KeywordForm submit error:", err);
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      form.reset({
        name: keyword?.name || "",
        groups: keyword?.groups?.map((g) => g.id) || [],
      });
      setError("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {keyword ? "Modifier le mot-clé" : "Créer un mot-clé"}
          </DialogTitle>
          <DialogDescription>
            {keyword
              ? "Mettre à jour le mot-clé et ses groupes associés."
              : "Ajouter un nouveau mot-clé et l’assigner à des groupes."}
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

            
            <FormField
              control={form.control}
              name="groups"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Groupes associés</FormLabel>
                  <FormControl>
                    <Command>
                      <CommandInput placeholder="Sélectionner des groupes..." />
                      <CommandList>
                        <CommandEmpty>Aucun groupe trouvé</CommandEmpty>
                        <CommandGroup>
                          {groups.map((group) => (
                            <CommandItem
                              key={group.id}
                              onSelect={() => {
                                const newValue = field.value.includes(group.id)
                                  ? field.value.filter((id) => id !== group.id)
                                  : [...field.value, group.id];
                                field.onChange(newValue);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  field.value.includes(group.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {group.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
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

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading || fetchingGroups}>
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
