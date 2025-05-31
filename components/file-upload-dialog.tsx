"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FolderSelector } from "@/components/folder-selector";
import { SimpleDatePicker } from "@/components/simple-date-picker";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywords: Array<{ id: string; name: string }>;
  currentFolderId?: string | null;
  onSuccess: () => void;
}

interface FileWithName {
  file: File;
  nameWithoutExtension: string;
  extension: string;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  keywords,
  currentFolderId,
  onSuccess,
}: FileUploadDialogProps) {
  const [files, setFiles] = useState<FileWithName[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [dateTexte, setDateTexte] = useState<Date | undefined>(undefined);
  const [commentaire, setCommentaire] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && currentFolderId) {
      setSelectedFolderId(currentFolderId);
    }
  }, [open, currentFolderId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => {
      // Extract name and extension
      const extensionMatch = file.name.match(/(\.[^/.]+)$/);
      const extension = extensionMatch ? extensionMatch[1] : "";
      const nameWithoutExt = extension
        ? file.name.slice(0, -extension.length)
        : file.name;

      return {
        file,
        nameWithoutExtension: nameWithoutExt,
        extension,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileName = (index: number, newName: string) => {
    setFiles((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, nameWithoutExtension: newName.trim() } : item
      )
    );
  };

  const toggleKeyword = (keywordId: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keywordId)
        ? prev.filter((id) => id !== keywordId)
        : [...prev, keywordId]
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Veuillez sélectionner au moins un fichier");
      return;
    }

    setIsUploading(true);
    setError("");
    setIsLoading(true);

    try {
      const formData = new FormData();

      files.forEach((fileItem) => {
        formData.append("files", fileItem.file);
      });

      const customNames = files.reduce((acc, fileItem, index) => {
        // Combine name with extension
        acc[index] = fileItem.nameWithoutExtension + fileItem.extension;
        return acc;
      }, {} as Record<number, string>);

      formData.append("keywordIds", JSON.stringify(selectedKeywords));
      formData.append("customNames", JSON.stringify(customNames));
      formData.append("folderId", selectedFolderId || "");

      if (dateTexte) {
        formData.append("dateTexte", dateTexte.toISOString());
      }

      if (commentaire.trim()) {
        formData.append("commentaire", commentaire.trim());
      }

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        onSuccess();
        handleClose();
      } else {
        const data = await response.json();
        setError(data.error || "Échec du téléchargement");
      }
    } catch {
      setError("Une erreur s'est produite");
    } finally {
      setIsUploading(false);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setSelectedKeywords([]);
    setSelectedFolderId(currentFolderId || null);
    setDateTexte(undefined);
    setCommentaire("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Télécharger des fichiers</DialogTitle>
          <DialogDescription>
            Téléchargez un ou plusieurs fichiers et assignez-leur des mots-clés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Location */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Emplacement de téléchargement
            </Label>
            <FolderSelector
              selectedFolderId={selectedFolderId}
              onFolderSelect={setSelectedFolderId}
              placeholder="Choisir un dossier ou rester à la racine"
              disabled={isUploading}
            />
            <p className="text-sm text-muted-foreground">
              Les fichiers seront téléchargés dans{" "}
              {selectedFolderId
                ? "le dossier sélectionné"
                : "le répertoire racine"}
            </p>
          </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p>Déposez les fichiers ici...</p>
            ) : (
              <div>
                <p className="text-lg font-medium">
                  Déposez des fichiers ici ou cliquez pour sélectionner
                </p>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez télécharger plusieurs fichiers à la fois
                </p>
              </div>
            )}
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Fichiers sélectionnés ({files.length})
              </Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                  >
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <Input
                          value={fileItem.nameWithoutExtension}
                          onChange={(e) =>
                            updateFileName(index, e.target.value)
                          }
                          placeholder="Nom du fichier"
                          className="h-8 flex-1"
                        />
                        {fileItem.extension && (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs flex-shrink-0"
                          >
                            {fileItem.extension}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        Original: {fileItem.file.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Assigner des mots-clés (optionnel)
            </Label>
            {keywords.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`upload-${keyword.id}`}
                        checked={selectedKeywords.includes(keyword.id)}
                        onCheckedChange={() => toggleKeyword(keyword.id)}
                      />
                      <Label
                        htmlFor={`upload-${keyword.id}`}
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
                      const keyword = keywords.find((k) => k.id === keywordId);
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
                Aucun mot-clé disponible. Les fichiers seront téléchargés sans
                étiquettes.
              </p>
            )}
          </div>

          {/* Additional Fields */}
          <div className="flex flex-col gap-4">
            {/* Date Texte */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Date document (Optionnelle)
              </Label>
              <SimpleDatePicker
                selected={dateTexte}
                onSelect={setDateTexte}
                placeholder="Sélectionner une date"
              />
            </div>

            {/* Commentaire */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Commentaire (Optionnelle)
              </Label>
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
          >
            {isUploading
              ? "Téléchargement..."
              : `Télécharger ${files.length} fichier(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
