"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Home, Folder } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface FolderBreadcrumbDisplayProps {
  currentFolderId: string | null;
  className?: string;
}

export function FolderBreadcrumbDisplay({
  currentFolderId,
  className,
}: FolderBreadcrumbDisplayProps) {
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

  if (!currentFolderId) return null;

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-6 w-16" />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-6 w-24" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}
    >
      <Home className="h-4 w-4" />
      <span>Racine</span>

      {breadcrumbs.map((crumb) => (
        <div key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          <Folder className="h-4 w-4 text-blue-600" />
          <span>{crumb.name}</span>
        </div>
      ))}
    </div>
  );
}
