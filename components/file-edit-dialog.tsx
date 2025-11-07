"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { FolderSelector } from "@/components/folder-selector";
import { SimpleDatePicker } from "@/components/simple-date-picker";

import {
  useKeywordGroupSelection,
  type KeywordGroup,
  type KeywordItem,
} from "@/hooks/useKeywordGroupSelection";
import { KeywordGroupKeywordSelector } from "./keyword-group-keyword-selector";

const fileSchema = z.object({
  nameWithoutExtension: z
    .string()
    .min(1, "Le nom du fichier est requis")
    .max(200, "Le nom du fichier est trop long"),
});

type FileFormValues = z.infer<typeof fileSchema>;

interface FileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    id: string;
    name: string;
    keywords: KeywordItem[];
    folder?: { id: string; name: string } | null;
    dateTexte?: string | null;
    commentaire?: string | null;
  } | null;
  keywords: KeywordItem[];
  onSuccess: () => void;
}

export function FileEditDialog({
  open,
  onOpenChange,
  file,
  keywords,
  onSuccess,
}: FileEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileExtension, setFileExtension] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [dateTexte, setDateTexte] = useState<Date | undefined>(undefined);
  const [commentaire, setCommentaire] = useState("");

  const form = useForm<FileFormValues>({
    resolver: zodResolver(fileSchema),
    defaultValues: { nameWithoutExtension: "" },
  });

  const {
    groups: keywordGroups,
    setGroups: setKeywordGroups,
    selectedKeywordIds,
    setSelectedKeywordIds,
    toggleKeyword,
    toggleGroup,
    isKeywordDisabled,
    isGroupFullySelected,
    isGroupPartiallySelected,
  } = useKeywordGroupSelection([]);

  useEffect(() => {
    if (!open) return;

    const fetchKeywordGroups = async () => {
      try {
        const res = await fetch("/api/keyword-groups/hierarchy");
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.message || "Erreur chargement groupes");

        const normalizeGroups = (groups: any[]): KeywordGroup[] =>
          groups.map((g) => ({
            id: g.id,
            name: g.name,
            keywords: g.keywords || [],
            children: g.children ? normalizeGroups(g.children) : [],
          }));

        setKeywordGroups(normalizeGroups(json || []));
      } catch (err: any) {
        setError(err.message || "Erreur chargement groupes");
      }
    };

    fetchKeywordGroups();
  }, [open, setKeywordGroups]);

  useEffect(() => {
    if (!file || !keywordGroups.length) return;

    const extensionMatch = file.name.match(/(\.[^/.]+)$/);
    const extension = extensionMatch ? extensionMatch[1] : "";
    const nameWithoutExt = extension
      ? file.name.slice(0, -extension.length)
      : file.name;

    const keywordIds = file.keywords.map((k) => k.id);
    setSelectedKeywordIds(keywordIds);

    setFileExtension(extension);
    form.setValue("nameWithoutExtension", nameWithoutExt);
    setSelectedFolderId(file.folder?.id || null);
    setDateTexte(file.dateTexte ? new Date(file.dateTexte) : undefined);
    setCommentaire(file.commentaire || "");
  }, [file, form, keywordGroups, setSelectedKeywordIds]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setSelectedKeywordIds([]);
      setSelectedFolderId(null);
      setDateTexte(undefined);
      setCommentaire("");
      setError("");
      setFileExtension("");
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (values: FileFormValues) => {
    if (!file) return;

    setIsLoading(true);
    setError("");

    try {
      const finalName = values.nameWithoutExtension.trim() + fileExtension;

      const response = await fetch(`/api/files/${file.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          keywordIds: selectedKeywordIds,
          folderId: selectedFolderId,
          dateTexte: dateTexte ? dateTexte.toISOString() : null,
          commentaire: commentaire.trim() || null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        onSuccess();
        handleOpenChange(false);
      } else {
        setError(data.message || "Une erreur s'est produite");
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le fichier</DialogTitle>
          <DialogDescription>
            Mettre à jour le nom du fichier, l'emplacement, les mots-clés et les
            groupes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nameWithoutExtension"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du fichier</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Entrer le nom du fichier"
                        {...field}
                        disabled={isLoading}
                        className="flex-1"
                      />
                      {fileExtension && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {fileExtension}
                        </Badge>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Emplacement du fichier
              </Label>
              <FolderSelector
                selectedFolderId={selectedFolderId}
                onFolderSelect={setSelectedFolderId}
                placeholder="Déplacer vers un dossier ou garder à la racine"
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date document</Label>
                <SimpleDatePicker
                  selected={dateTexte}
                  onSelect={setDateTexte}
                  placeholder="Sélectionner une date"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Commentaire</Label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="min-h-[80px] max-h-[200px] resize-none overflow-y-auto break-words"
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>

            <KeywordGroupKeywordSelector
              keywords={keywords}
              groups={keywordGroups}
              selectedKeywordIds={selectedKeywordIds}
              selectedGroupIds={[]}
              onKeywordToggle={toggleKeyword}
              onGroupToggle={toggleGroup}
              isKeywordDisabled={isKeywordDisabled}
              isGroupFullySelected={isGroupFullySelected}
              isGroupPartiallySelected={isGroupPartiallySelected}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sauvegarde..." : "Sauvegarder les modifications"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
