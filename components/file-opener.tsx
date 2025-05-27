"use client";

import { useState } from "react";
import { ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loading } from "@/components/ui/loading";

interface FileOpenerProps {
  fileName: string;
  filePath: string;
}

export function FileOpener({ fileName, filePath }: FileOpenerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const canPreviewInBrowser = (filename: string) => {
    const ext = getFileExtension(filename);
    const previewableTypes = [
      "pdf",
      "txt",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "svg",
      "webp",
      "bmp",
      "mp4",
      "webm",
      "ogg",
      "mp3",
      "wav",
      "ogg",
      "html",
      "htm",
      "json",
    ];
    return previewableTypes.includes(ext);
  };

  const handleOpenFile = async () => {
    setIsLoading(true);
    try {
      window.open(filePath, "_blank");
    } catch (error) {
      console.error("Erreur lors de l'ouverture du fichier :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(filePath);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPreviewable = canPreviewInBrowser(fileName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left flex items-center gap-2 h-auto p-0"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loading variant="spinner" size="sm" />
              {fileName}
            </>
          ) : (
            <>
              {fileName}
              <ExternalLink className="h-3 w-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={handleOpenFile}>
          <ExternalLink className="mr-2 h-4 w-4" />
          {isPreviewable
            ? "Aperçu dans un nouvel onglet"
            : "Ouvrir dans un nouvel onglet"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadFile}>
          <Download className="mr-2 h-4 w-4" />
          Télécharger
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
