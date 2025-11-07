"use client";

import { useCallback, useState } from "react";

export type KeywordItem = {
  id: string;
  name: string;
  keywordId?: string | null;
  keyword?: { name?: string } | null;
  groups?: KeywordGroup[];
};

export type KeywordGroup = {
  id: string;
  name: string;
  keywords?: Array<Pick<KeywordItem, "id" | "name" | "keywordId" | "keyword">>;
  children?: KeywordGroup[];
};

type UseKeywordGroupSelectionReturn = {
  groups: KeywordGroup[];
  setGroups: (g: KeywordGroup[]) => void;
  selectedKeywordIds: string[];
  setSelectedKeywordIds: (ids: string[]) => void;
  selectedGroupIds: string[];
  setSelectedGroupIds: (ids: string[]) => void;
  toggleKeyword: (id: string, disabled?: boolean) => void;
  toggleGroup: (group: KeywordGroup) => void;
  isKeywordDisabled: (id: string) => boolean;
  isGroupFullySelected: (group: KeywordGroup) => boolean;
  isGroupPartiallySelected: (group: KeywordGroup) => boolean;
};

const collectGroupKeywordIds = (group: KeywordGroup): string[] => {
  const ids: string[] = [];
  if (group.keywords) {
    group.keywords.forEach((k) => {
      ids.push(k.keywordId ?? k.id);
    });
  }
  if (group.children) {
    group.children.forEach((c) => {
      ids.push(...collectGroupKeywordIds(c));
    });
  }
  return ids;
};

export function useKeywordGroupSelection(
  initialGroups: KeywordGroup[] = []
): UseKeywordGroupSelectionReturn {
  const [groupsState, setGroupsState] = useState<KeywordGroup[]>(initialGroups);
  const [selectedKeywordIds, setSelectedKeywordIdsState] = useState<string[]>(
    []
  );
  const [selectedGroupIds, setSelectedGroupIdsState] = useState<string[]>([]);

  const isKeywordDisabled = useCallback(() => false, []);

  const toggleKeyword = useCallback((id: string, disabled?: boolean) => {
    if (disabled) return;
    setSelectedKeywordIdsState((prev) => {
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, []);

  const toggleGroup = useCallback((group: KeywordGroup) => {
    setSelectedGroupIdsState((prev) => {
      return prev.includes(group.id)
        ? prev.filter((x) => x !== group.id)
        : [...prev, group.id];
    });
  }, []);

  const isGroupFullySelected = useCallback(
    (group: KeywordGroup): boolean => {
      const allKeywordIds = collectGroupKeywordIds(group);
      return (
        allKeywordIds.length > 0 &&
        allKeywordIds.every((id) => selectedKeywordIds.includes(id))
      );
    },
    [selectedKeywordIds]
  );

  const isGroupPartiallySelected = useCallback(
    (group: KeywordGroup): boolean => {
      const allKeywordIds = collectGroupKeywordIds(group);
      return (
        allKeywordIds.some((id) => selectedKeywordIds.includes(id)) &&
        !isGroupFullySelected(group)
      );
    },
    [selectedKeywordIds, isGroupFullySelected]
  );

  return {
    groups: groupsState,
    setGroups: useCallback((g: KeywordGroup[]) => setGroupsState(g), []),
    selectedKeywordIds,
    setSelectedKeywordIds: useCallback(
      (ids: string[]) => setSelectedKeywordIdsState([...ids]),
      []
    ),
    selectedGroupIds,
    setSelectedGroupIds: useCallback(
      (ids: string[]) => setSelectedGroupIdsState([...ids]),
      []
    ),
    toggleKeyword,
    toggleGroup,
    isKeywordDisabled,
    isGroupFullySelected,
    isGroupPartiallySelected,
  };
}
