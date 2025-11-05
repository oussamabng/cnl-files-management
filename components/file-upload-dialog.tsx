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

interface KeywordItem {
  id: string;
  name: string;
}

interface KeywordGroup {
  id: string;
  name: string;
  keywords: KeywordItem[];
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywords: KeywordItem[];
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
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [dateTexte, setDateTexte] = useState<Date | undefined>(undefined);
  const [commentaire, setCommentaire] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && currentFolderId) setSelectedFolderId(currentFolderId);
    if (open) fetchKeywordGroups();
  }, [open, currentFolderId]);

  const fetchKeywordGroups = async () => {
    try {
      const res = await fetch("/api/keyword-groups");
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Erreur chargement groupes");
      const normalized = (json || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        keywords: g.keywords || [],
      }));
      setKeywordGroups(normalized);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur chargement groupes");
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => {
      const extensionMatch = file.name.match(/(\.[^/.]+)$/);
      const extension = extensionMatch ? extensionMatch[1] : "";
      const nameWithoutExt = extension
        ? file.name.slice(0, -extension.length)
        : file.name;
      return { file, nameWithoutExtension: nameWithoutExt, extension };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const updateFileName = (index: number, newName: string) =>
    setFiles((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, nameWithoutExtension: newName.trim() } : item
      )
    );

  const toggleKeyword = (keywordId: string) =>
    setSelectedKeywords((prev) =>
      prev.includes(keywordId)
        ? prev.filter((id) => id !== keywordId)
        : [...prev, keywordId]
    );

  const toggleGroup = (groupId: string) =>
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );

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

      files.forEach((fileItem) => formData.append("files", fileItem.file));

      const customNames = files.reduce((acc, fileItem, index) => {
        acc[index] = fileItem.nameWithoutExtension + fileItem.extension;
        return acc;
      }, {} as Record<number, string>);

      formData.append("keywordIds", JSON.stringify(selectedKeywords));
      formData.append("groupIds", JSON.stringify(selectedGroupIds));
      formData.append("customNames", JSON.stringify(customNames));
      formData.append("folderId", selectedFolderId || "");

      if (dateTexte) formData.append("dateTexte", dateTexte.toISOString());
      if (commentaire.trim())
        formData.append("commentaire", commentaire.trim());

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
    } catch (err) {
      console.error(err);
      setError("Une erreur s'est produite");
    } finally {
      setIsUploading(false);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setSelectedKeywords([]);
    setSelectedGroupIds([]);
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
            Téléchargez un ou plusieurs fichiers et assignez-leur des mots-clés
            ou des groupes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Folder Selector */}
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
          </div>

          {/* Dropzone */}
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
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                {keywords.map((keyword) => (
                  <div key={keyword.id} className="flex items-center space-x-2">
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
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun mot-clé disponible
              </p>
            )}
          </div>

          {/* Keyword Groups Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Assigner des groupes de mots-clés (optionnel)
            </Label>
            {keywordGroups.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                {keywordGroups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroupIds.includes(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                    />
                    <Label
                      htmlFor={`group-${group.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {group.name}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun groupe disponible
              </p>
            )}
          </div>

          {/* Date & Commentaire */}
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <SimpleDatePicker
                selected={dateTexte}
                onSelect={setDateTexte}
                placeholder="Sélectionner une date"
                className="w-full"
                buttonClassName="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label>Commentaire</Label>
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                disabled={isUploading}
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
          <Button onClick={handleUpload} disabled={isUploading || isLoading}>
            {isUploading ? "Téléchargement..." : "Télécharger"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
