/* eslint-disable react/no-unescaped-entities */
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { FolderSelector } from "@/components/folder-selector";
import { SimpleDatePicker } from "@/components/simple-date-picker";

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
    keywords: Array<{ id: string; name: string }>;
    folder?: { id: string; name: string } | null;
    dateTexte?: string | null;
    commentaire?: string | null;
  } | null;
  keywords: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export function FileEditDialog({
  open,
  onOpenChange,
  file,
  keywords,
  onSuccess,
}: FileEditDialogProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileExtension, setFileExtension] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [dateTexte, setDateTexte] = useState<Date | undefined>(undefined);
  const [commentaire, setCommentaire] = useState("");

  const form = useForm<FileFormValues>({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      nameWithoutExtension: "",
    },
  });

  useEffect(() => {
    if (file) {
      // Extract name and extension
      const extensionMatch = file.name.match(/(\.[^/.]+)$/);
      const extension = extensionMatch ? extensionMatch[1] : "";
      const nameWithoutExt = extension
        ? file.name.slice(0, -extension.length)
        : file.name;

      setFileExtension(extension);
      form.setValue("nameWithoutExtension", nameWithoutExt);
      setSelectedKeywords(file.keywords.map((k) => k.id));
      setSelectedFolderId(file.folder?.id || null);
      setDateTexte(file.dateTexte ? new Date(file.dateTexte) : undefined);
      setCommentaire(file.commentaire || "");
    }
  }, [file, form]);

  const toggleKeyword = (keywordId: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keywordId)
        ? prev.filter((id) => id !== keywordId)
        : [...prev, keywordId]
    );
  };

  const onSubmit = async (values: FileFormValues) => {
    if (!file) return;

    setIsLoading(true);
    setError("");

    try {
      // Combine name with extension
      const finalName = values.nameWithoutExtension.trim() + fileExtension;

      const response = await fetch(`/api/files/${file.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: finalName,
          keywordIds: selectedKeywords,
          folderId: selectedFolderId,
          dateTexte: dateTexte ? dateTexte.toISOString() : null,
          commentaire: commentaire.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(data.error || "Une erreur s'est produite");
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setSelectedKeywords([]);
      setSelectedFolderId(null);
      setDateTexte(undefined);
      setCommentaire("");
      setError("");
      setFileExtension("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le fichier</DialogTitle>
          <DialogDescription>
            Mettre à jour le nom du fichier, l'emplacement et les mots-clés.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Name */}
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
                  <div className="text-xs text-muted-foreground">
                    {fileExtension ? (
                      <p>
                        Nom final:{" "}
                        <span className="font-medium">
                          {form.watch("nameWithoutExtension") || "nomfichier"}
                          {fileExtension}
                        </span>
                      </p>
                    ) : (
                      <p>Aucune extension de fichier détectée</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Location */}
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
              <p className="text-sm text-muted-foreground">
                Le fichier sera déplacé vers{" "}
                {selectedFolderId
                  ? "le dossier sélectionné"
                  : "le répertoire racine"}
              </p>
            </div>

            {/* Additional Fields */}
            <div className="flex flex-col gap-4">
              {/* Date Texte */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date document</Label>
                <SimpleDatePicker
                  selected={dateTexte}
                  onSelect={setDateTexte}
                  placeholder="Sélectionner une date"
                />
              </div>

              {/* Commentaire */}
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

            {/* Keywords */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Mots-clés</Label>
              {keywords.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                    {keywords.map((keyword) => (
                      <div
                        key={keyword.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`edit-${keyword.id}`}
                          checked={selectedKeywords.includes(keyword.id)}
                          onCheckedChange={() => toggleKeyword(keyword.id)}
                          disabled={isLoading}
                        />
                        <Label
                          htmlFor={`edit-${keyword.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {keyword.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedKeywords.map((keywordId) => {
                        const keyword = keywords.find(
                          (k) => k.id === keywordId
                        );
                        return keyword ? (
                          <Badge key={keywordId} variant="secondary">
                            {keyword.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun mot-clé disponible.
                </p>
              )}
            </div>

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
                {isLoading ? "Sauvegarde..." : "Sauvegarder les modifications"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
