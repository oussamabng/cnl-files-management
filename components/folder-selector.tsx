"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Folder, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";

interface FolderData {
  id: string;
  name: string;
  parentId: string | null;
  _count: {
    children: number;
    files: number;
    folders?: number;
  };
  children?: FolderData[];
  fullPath?: string;
}

interface FolderSelectorProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showCounts?: boolean;
}

export function FolderSelector({
  selectedFolderId,
  onFolderSelect,
  placeholder = "Sélectionner un dossier...",
  disabled = false,
  showCounts = true,
}: FolderSelectorProps) {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/folders?includeHierarchy=true");
      if (response.ok) {
        const data = await response.json();
        const foldersWithPaths = buildFolderTreeWithPaths(data);
        setFolders(foldersWithPaths);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des dossiers :", err);
    } finally {
      setLoading(false);
    }
  };

  const buildFolderTreeWithPaths = (
    flatFolders: FolderData[]
  ): FolderData[] => {
    const folderMap = new Map<string, FolderData>();
    const rootFolders: FolderData[] = [];

    flatFolders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    flatFolders.forEach((folder) => {
      const folderWithChildren = folderMap.get(folder.id)!;
      const path = calculateFolderPath(folder.id, folderMap);
      folderWithChildren.fullPath = path;

      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children!.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders.sort((a, b) => a.name.localeCompare(b.name));
  };

  const calculateFolderPath = (
    folderId: string,
    folderMap: Map<string, FolderData>
  ): string => {
    const folder = folderMap.get(folderId);
    if (!folder) return "";
    if (!folder.parentId) return folder.name;

    const parentPath = calculateFolderPath(folder.parentId, folderMap);
    return `${parentPath} / ${folder.name}`;
  };

  const findFolderPath = (
    folderId: string,
    folderList: FolderData[]
  ): string => {
    for (const folder of folderList) {
      if (folder.id === folderId) return folder.fullPath || folder.name;
      if (folder.children) {
        const found = findFolderPath(folderId, folder.children);
        if (found) return found;
      }
    }
    return "";
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (selectedFolderId && folders.length > 0) {
      const path = findFolderPath(selectedFolderId, folders);
      setSelectedFolderPath(path);
    } else {
      setSelectedFolderPath("");
    }
  }, [selectedFolderId, folders]);

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderTree = (folderList: FolderData[], depth = 0) => {
    return folderList.map((folder) => (
      <div key={folder.id}>
        <DropdownMenuItem
          className="flex items-center gap-2 cursor-pointer"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onFolderSelect(folder.id)}
        >
          {folder.children && folder.children.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(folder.id);
              }}
            >
              {expandedFolders.has(folder.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}
          <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{folder.name}</div>
            {depth > 0 && (
              <div className="text-xs text-muted-foreground truncate">
                {folder.fullPath}
              </div>
            )}
          </div>
          {showCounts && (
            <div className="flex gap-1 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                {folder._count.files}
              </Badge>
              {folder._count.folders !== undefined &&
                folder._count.folders > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {folder._count.folders}
                  </Badge>
                )}
            </div>
          )}
        </DropdownMenuItem>
        {folder.children &&
          folder.children.length > 0 &&
          expandedFolders.has(folder.id) &&
          renderFolderTree(folder.children, depth + 1)}
      </div>
    ));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedFolderId ? (
              <>
                <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="truncate" title={selectedFolderPath}>
                  {selectedFolderPath}
                </span>
              </>
            ) : (
              <>
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <Loading
              variant="spinner"
              size="sm"
              text="Chargement des dossiers..."
            />
          </div>
        ) : (
          <>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer font-medium"
              onClick={() => onFolderSelect(null)}
            >
              <Home className="h-4 w-4 text-muted-foreground" />
              <span>Dossier racine</span>
              {selectedFolderId === null && (
                <Badge variant="default" className="text-xs ml-auto">
                  Actuel
                </Badge>
              )}
            </DropdownMenuItem>
            {folders.length > 0 && <DropdownMenuSeparator />}
            {renderFolderTree(folders)}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
