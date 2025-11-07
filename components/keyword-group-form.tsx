"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";
import { PlusCircle } from "lucide-react";

const groupSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du groupe est requis")
    .max(100, "Nom trop long"),
  keywordIds: z.array(z.string()).optional(),
  parentId: z.string().nullable().optional(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

interface KeywordItem {
  id: string;
  name: string;
}

interface KeywordGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: {
    id: string;
    name: string;
    keywords?: KeywordItem[];
    isActive?: boolean;
  } | null;
  parentId?: string | null; // NEW: parent id passed from parent
  onSuccess: () => void;
}

export function KeywordGroupForm({
  open,
  onOpenChange,
  group = null,
  parentId = null,
  onSuccess,
}: KeywordGroupFormProps) {
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [creatingKeyword, setCreatingKeyword] = useState(false);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name || "",
      keywordIds: group?.keywords?.map((k) => k.id) || [],
    },
  });

  useEffect(() => {
    if (open) {
      fetchKeywords();
      form.reset({
        name: group?.name || "",
        keywordIds: group?.keywords?.map((k) => k.id) || [],
      });
      setError("");
    }
  }, [open, group]);

  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/keywords");
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Erreur chargement mots-clés");
      setKeywords((json || []).map((k: any) => ({ id: k.id, name: k.name })));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur");
    }
  };

  const onSubmit = async (values: GroupFormValues) => {
    setIsLoading(true);
    setError("");
    try {
      const payload = {
        name: values.name.trim(),
        keywordIds: values.keywordIds || [],
        parentId: parentId || null, // assign parent automatically
      };
      const url = group
        ? `/api/keyword-groups/${group.id}`
        : "/api/keyword-groups";
      const method = group ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Erreur serveur");
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setError("");
    } else {
      form.reset({
        name: group?.name || "",
        keywordIds: group?.keywords?.map((k) => k.id) || [],
      });
    }
    onOpenChange(newOpen);
  };

  const addNewKeyword = async () => {
    if (!newKeyword.trim()) return;
    setCreatingKeyword(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyword }),
      });
      if (res.ok) {
        const keyword = await res.json();
        setKeywords((prev) => [...prev, keyword]);
        form.setValue("keywordIds", [
          ...(form.getValues("keywordIds") || []),
          keyword.id,
        ]);
        setNewKeyword("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingKeyword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {group ? "Modifier un groupe" : "Créer un groupe"}
          </DialogTitle>
          <DialogDescription>
            {group
              ? "Mettre à jour le groupe et ses mots-clés."
              : "Créer un groupe et y attacher des mots-clés."}
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
                      {...field}
                      placeholder="Ex: Document Type"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <FormLabel>Mots-clés assignés</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addNewKeyword}
                  disabled={creatingKeyword || !newKeyword.trim()}
                >
                  {creatingKeyword ? (
                    <Loading variant="spinner" size="sm" />
                  ) : (
                    <PlusCircle className="mr-1 h-4 w-4" />
                  )}
                  Créer
                </Button>
              </div>
              <Input
                placeholder="Nouveau mot-clé"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                disabled={creatingKeyword}
              />
            </div>

            <FormField
              control={form.control}
              name="keywordIds"
              render={({ field }) => (
                <div>
                  <FormLabel className="my-3">Mots-clés à attacher (optionnel)</FormLabel>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/30">
                    {keywords.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        Aucun mot-clé disponible
                      </div>
                    )}
                    {keywords.map((k) => (
                      <div key={k.id} className="flex items-center gap-2">
                        <Controller
                          name="keywordIds"
                          control={form.control}
                          render={({ field: f }) => {
                            const checked = f.value?.includes(k.id) || false;
                            return (
                              <Checkbox
                                id={`group-kw-${k.id}`}
                                checked={checked}
                                onCheckedChange={(val) => {
                                  const newVal = val
                                    ? [...(f.value || []), k.id]
                                    : (f.value || []).filter(
                                        (id) => id !== k.id
                                      );
                                  f.onChange(newVal);
                                }}
                              />
                            );
                          }}
                        />
                        <Label
                          htmlFor={`group-kw-${k.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {k.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
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
