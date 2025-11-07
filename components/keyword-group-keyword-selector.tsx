"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { X, FolderOpen, ChevronDown } from "lucide-react";
import React from "react";
import type {
  KeywordGroup,
  KeywordItem,
} from "@/hooks/useKeywordGroupSelection";

interface Props {
  groups: KeywordGroup[];
  keywords: KeywordItem[];
  selectedGroupIds: string[];
  selectedKeywordIds: string[];
  onGroupToggle: (group: KeywordGroup) => void;
  onKeywordToggle: (keywordId: string, isDisabled?: boolean) => void;
  isGroupFullySelected: (group: KeywordGroup) => boolean;
  isGroupPartiallySelected: (group: KeywordGroup) => boolean;
  isKeywordDisabled: (keywordId: string) => boolean;
}

export const KeywordGroupKeywordSelector: React.FC<Props> = ({
  groups,
  keywords,
  selectedGroupIds,
  selectedKeywordIds,
  onGroupToggle,
  onKeywordToggle,
  isKeywordDisabled,
}) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set()
  );

  const allSelectedItems = React.useMemo(() => {
    const items: Array<KeywordItem & { source: "group" | "standalone" }> = [];

    groups.forEach((group) => {
      group.keywords?.forEach((k) => {
        const keywordId = k.keywordId ?? k.id;
        if (selectedKeywordIds.includes(keywordId)) {
          items.push({ ...k, source: "group" });
        }
      });
    });

    keywords.forEach((k) => {
      if (selectedKeywordIds.includes(k.id)) {
        items.push({ ...k, source: "standalone" });
      }
    });

    return items;
  }, [groups, keywords, selectedKeywordIds]);

  const unassignedKeywords = React.useMemo(() => {
    return keywords.filter((k) => !k.groups || k.groups.length === 0);
  }, [keywords]);

  const toggleGroupExpanded = React.useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupId)) newExpanded.delete(groupId);
      else newExpanded.add(groupId);
      return newExpanded;
    });
  }, []);

  const hasNestedContent = (group: KeywordGroup): boolean => {
    return !!(group.keywords?.length || group.children?.length);
  };

  const getAllKeywordIdsInGroup = (group: KeywordGroup): string[] => {
    const ids: string[] = [];
    group.keywords?.forEach((k) => ids.push(k.keywordId ?? k.id));
    group.children?.forEach((child) =>
      ids.push(...getAllKeywordIdsInGroup(child))
    );
    return ids;
  };

  const renderGroups = (groupList: KeywordGroup[], level = 0) => {
    return groupList.map((group) => {
      const allKeywordIds = getAllKeywordIdsInGroup(group);
      const isExpanded = expandedGroups.has(group.id);
      const hasContent = hasNestedContent(group);

      // ✅ Only use group selection state, independent of keywords
      const checkedState = selectedGroupIds.includes(group.id);

      const handleGroupCheckboxToggle = () => {
        onGroupToggle(group);
      };

      return (
        <div key={group.id} style={{ marginLeft: `${level * 8}px` }}>
          <Collapsible
            open={isExpanded}
            onOpenChange={() => toggleGroupExpanded(group.id)}
          >
            <div className="flex items-center space-x-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center w-4 h-4 hover:bg-muted rounded"
                  disabled={!hasContent}
                >
                  {hasContent ? (
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  ) : (
                    <div className="w-4 h-4" />
                  )}
                </button>
              </CollapsibleTrigger>

              <Checkbox
                id={`group-${group.id}`}
                checked={checkedState}
                onCheckedChange={handleGroupCheckboxToggle}
              />
              <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <Label
                htmlFor={`group-${group.id}`}
                className="text-sm font-medium cursor-pointer flex-1"
              >
                {group.name}
              </Label>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {allKeywordIds.length} mot
                {allKeywordIds.length !== 1 ? "s" : ""}
              </span>
            </div>

            <CollapsibleContent className="mt-1 pl-4">
              {group.keywords?.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {group.keywords.map((k) => {
                    const keywordId = k.keywordId ?? k.id;
                    const isSelected = selectedKeywordIds.includes(keywordId);
                    const isDisabled = isKeywordDisabled(keywordId);

                    return (
                      <div
                        key={`${group.id}-${keywordId}`}
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded border transition-colors ${
                          isSelected
                            ? "border-blue-400 bg-blue-50 hover:bg-blue-100"
                            : "border-gray-300 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <Checkbox
                          id={`keyword-${keywordId}`}
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={() =>
                            onKeywordToggle(keywordId, isDisabled)
                          }
                          className="h-3.5 w-3.5"
                        />
                        <Label
                          htmlFor={`keyword-${keywordId}`}
                          className="text-xs cursor-pointer flex-1 truncate leading-tight"
                          title={k.keyword?.name ?? k.name ?? "Unknown"}
                        >
                          {k.keyword?.name ?? k.name ?? "Unknown"}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

              {group.children?.length > 0 && (
                <div>{renderGroups(group.children, level + 1)}</div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {allSelectedItems.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Sélectionnés ({allSelectedItems.length})
          </Label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-blue-50/50 border-blue-200">
            {allSelectedItems.map((item) => {
              const itemId = `${item.source}-${item.keywordId ?? item.id}`;
              const itemName = item.keyword?.name ?? item.name ?? "Unknown";

              return (
                <Badge
                  key={itemId}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 hover:bg-blue-200 border-blue-300"
                >
                  <span className="max-w-[150px] truncate">{itemName}</span>
                  <button
                    onClick={() => onKeywordToggle(item.keywordId ?? item.id)}
                    className="rounded-full hover:bg-blue-300/50 p-0.5 flex-shrink-0"
                    aria-label={`Remove ${itemName}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Mots-clés disponibles</Label>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FolderOpen className="w-3 h-3 text-blue-500" />
              Dans un groupe
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300"></div>
              Non assigné
            </span>
          </div>
        </div>

        <div className="p-4 border rounded-lg max-h-96 overflow-y-auto bg-background">
          {groups.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pl-3">
                Groupes de mots-clés
              </div>
              <div className="space-y-0">{renderGroups(groups)}</div>
            </div>
          )}

          {groups.length > 0 && unassignedKeywords.length > 0 && (
            <div className="my-4 border-t border-muted"></div>
          )}

          {unassignedKeywords.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pl-3">
                Mots-clés non assignés
              </div>
              <div className="grid grid-cols-4 gap-2">
                {unassignedKeywords.map((keyword) => {
                  const isDisabled = isKeywordDisabled(keyword.id);
                  const isSelected = selectedKeywordIds.includes(keyword.id);

                  return (
                    <div
                      key={`unassigned-${keyword.id}`}
                      className={`flex items-center space-x-2 px-2 py-1.5 rounded border transition-colors ${
                        isSelected
                          ? "border-blue-400 bg-blue-50 hover:bg-blue-100"
                          : "border-gray-300 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <Checkbox
                        id={`keyword-${keyword.id}`}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() =>
                          onKeywordToggle(keyword.id, isDisabled)
                        }
                        className="h-3.5 w-3.5"
                      />
                      <Label
                        htmlFor={`keyword-${keyword.id}`}
                        className="text-xs cursor-pointer flex-1 truncate leading-tight"
                        title={keyword.name}
                      >
                        {keyword.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {groups.length === 0 && unassignedKeywords.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun mot-clé disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
