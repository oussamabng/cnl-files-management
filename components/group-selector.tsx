"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Layers, Check, X } from "lucide-react";
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

interface GroupData {
  id: string;
  name: string;
  parentId: string | null;
  _count: {
    children: number;
    keywords: number;
    groups?: number;
  };
  children?: GroupData[];
  fullPath?: string;
}

interface SelectGroupProps {
  selectedGroupIds: string[];
  onGroupSelect: (groupIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  showCounts?: boolean;
  showSelected?: boolean;
}

export function SelectGroup({
  selectedGroupIds,
  onGroupSelect,
  placeholder = "Sélectionner un groupe...",
  disabled = false,
  showCounts = true,
  showSelected = true,
}: SelectGroupProps) {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    void fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/groups?includeHierarchy=true");
      if (!res.ok) return;
      const data: GroupData[] = await res.json();
      const tree = buildGroupTreeWithPaths(data);
      setGroups(tree);
    } catch (err) {
      console.error("Error loading groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const buildGroupTreeWithPaths = (flatGroups: GroupData[]): GroupData[] => {
    const map = new Map<string, GroupData>();
    const roots: GroupData[] = [];

    flatGroups.forEach((g) => map.set(g.id, { ...g, children: [] }));

    flatGroups.forEach((g) => {
      const node = map.get(g.id)!;
      node.fullPath = calculateGroupPath(g.id, map);
      if (g.parentId) {
        const parent = map.get(g.parentId);
        if (parent) parent.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortTree = (list: GroupData[]) => {
      list.sort((a, b) => a.name.localeCompare(b.name));
      list.forEach((n) => {
        if (n.children && n.children.length > 0) sortTree(n.children);
      });
    };
    sortTree(roots);

    return roots;
  };

  const calculateGroupPath = (
    groupId: string,
    map: Map<string, GroupData>
  ): string => {
    const node = map.get(groupId);
    if (!node) return "";
    if (!node.parentId) return node.name;
    return `${calculateGroupPath(node.parentId, map)} / ${node.name}`;
  };

  const findGroupPath = (groupId: string, list: GroupData[]): string => {
    for (const g of list) {
      if (g.id === groupId) return g.fullPath || g.name;
      if (g.children && g.children.length > 0) {
        const found = findGroupPath(groupId, g.children);
        if (found) return found;
      }
    }
    return "";
  };

  const findGroupName = (groupId: string, list: GroupData[]): string => {
    for (const g of list) {
      if (g.id === groupId) return g.name;
      if (g.children && g.children.length > 0) {
        const found = findGroupName(groupId, g.children);
        if (found) return found;
      }
    }
    return "";
  };

  const handleGroupToggle = (id: string | null) => {
    if (id === null) {
      onGroupSelect([]);
      return;
    }

    const updated = selectedGroupIds.includes(id)
      ? selectedGroupIds.filter((gId) => gId !== id)
      : [...selectedGroupIds, id];

    onGroupSelect(updated);
  };

  const handleRemoveGroup = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = selectedGroupIds.filter((gId) => gId !== id);
    onGroupSelect(updated);
  };

  const toggleExpanded = (id: string) => {
    setExpandedGroups((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const renderGroupTree = (list: GroupData[], depth = 0) => {
    return list.map((g) => (
      <div key={g.id}>
        <DropdownMenuItem
          asChild
          className="flex items-center gap-2 cursor-pointer"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={(e) => {
            handleGroupToggle(g.id);
          }}
        >
          <div
            className="flex items-center gap-2 cursor-pointer w-full"
            onClick={(e) => {
              e.preventDefault();
              handleGroupToggle(g.id);
            }}
          >
            {g.children && g.children.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center h-6 w-6 p-1 bg-gray-100 cursor-pointer rounded-xl transition-colors duration-150 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(g.id);
                }}
                aria-label={
                  expandedGroups.has(g.id) ? "Collapse group" : "Expand group"
                }
              >
                {expandedGroups.has(g.id) ? (
                  <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                )}
              </Button>
            ) : (
              <div className="w-4" />
            )}
            <Layers className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{g.name}</div>
            </div>
            {showCounts && (
              <div className="flex gap-1 flex-shrink-0">
                <Badge variant="outline" className="text-xs">
                  {g._count.keywords}
                </Badge>
                {g._count.groups !== undefined && g._count.groups > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {g._count.groups}
                  </Badge>
                )}
              </div>
            )}
            {selectedGroupIds.includes(g.id) && (
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            )}
          </div>
        </DropdownMenuItem>
        {g.children &&
          g.children.length > 0 &&
          expandedGroups.has(g.id) &&
          renderGroupTree(g.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="w-full space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {selectedGroupIds.length > 0 ? (
                <>
                  <Layers className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {selectedGroupIds.length}{" "}
                    {selectedGroupIds.length === 1 ? "groupe" : "groupes"}{" "}
                    sélectionnés
                  </span>
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4 text-muted-foreground" />
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
                text="Chargement des groupes..."
              />
            </div>
          ) : (
            <>
              {showSelected && selectedGroupIds.length > 0 && (
                <>
                  <div className="px-2 py-2 flex flex-wrap gap-2 bg-blue-50 dark:bg-blue-950/30 border-b">
                    {selectedGroupIds.map((id) => (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="px-3 py-1 flex items-center gap-1.5 pr-1"
                      >
                        <span className="truncate text-xs font-medium">
                          {findGroupName(id, groups)}
                        </span>
                        <button
                          onClick={(e) => handleRemoveGroup(id, e)}
                          className="ml-1 hover:bg-black/10 rounded p-0.5 transition-colors"
                          aria-label={`Remove ${findGroupName(id, groups)}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <DropdownMenuSeparator className="my-1" />
                </>
              )}

              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer font-medium"
                onClick={() => handleGroupToggle(null)}
              >
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span>Groupe racine</span>
                {selectedGroupIds.length === 0 && (
                  <Badge variant="default" className="text-xs ml-auto">
                    Actuel
                  </Badge>
                )}
              </DropdownMenuItem>
              {groups.length > 0 && <DropdownMenuSeparator />}
              {renderGroupTree(groups)}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showSelected && selectedGroupIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGroupIds.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="px-3 py-1 flex items-center gap-1.5 pr-1"
            >
              <span className="truncate text-xs font-medium">
                {findGroupName(id, groups)}
              </span>
              <button
                onClick={(e) => handleRemoveGroup(id, e)}
                className="ml-1 hover:bg-black/10 rounded p-0.5 transition-colors"
                aria-label={`Remove ${findGroupName(id, groups)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
