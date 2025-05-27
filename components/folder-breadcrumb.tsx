"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Home, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface FolderBreadcrumbProps {
  currentFolderId: string | null;
  onFolderClick: (folderId: string | null) => void;
  className?: string;
}

export function FolderBreadcrumb({
  currentFolderId,
  onFolderClick,
  className,
}: FolderBreadcrumbProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBreadcrumbs = async (folderId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/folders/${folderId}/path`);
      if (response.ok) {
        const data = await response.json();
        setBreadcrumbs(data);
      }
    } catch (err) {
      console.error("Échec du chargement du chemin des dossiers :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentFolderId) {
      fetchBreadcrumbs(currentFolderId);
    } else {
      setBreadcrumbs([]);
    }
  }, [currentFolderId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-8 w-16" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-8 w-24" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-8 w-20" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onFolderClick(null)}
        className={`h-8 px-3 ${!currentFolderId ? "bg-muted" : ""}`}
      >
        <Home className="h-4 w-4 mr-1" />
        Racine {/* changed from "Root" to "Racine" */}
      </Button>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFolderClick(crumb.id)}
            className={`h-8 px-3 ${
              index === breadcrumbs.length - 1 ? "bg-muted" : ""
            }`}
          >
            <Folder className="h-4 w-4 mr-1 text-blue-600" />
            {crumb.name}
          </Button>
        </div>
      ))}
    </div>
  );
}
