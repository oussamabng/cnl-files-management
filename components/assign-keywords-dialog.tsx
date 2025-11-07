"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Tag, Search, AlertCircle } from "lucide-react";

interface KeywordItem {
  id: string;
  name: string;
  fileCount?: number;
}

interface AssignKeywordsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupId: string | null;
  onSuccess?: () => void;
}

export function AssignKeywordsDialog({
  open,
  onOpenChange,
  groupId,
  onSuccess,
}: AssignKeywordsDialogProps) {
  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ✅ Load all keywords + assigned keywords for group
  useEffect(() => {
    if (!open || !groupId) return;
    (async () => {
      try {
        setFetching(true);
        setError(null);

        const [allRes, assignedRes] = await Promise.all([
          fetch("/api/keywords"),
          fetch(`/api/keyword-groups/${groupId}/keywords`),
        ]);

        const [allKeywords, assignedKeywords] = await Promise.all([
          allRes.json(),
          assignedRes.json(),
        ]);

        if (!allRes.ok)
          throw new Error(
            allKeywords?.message || "Erreur chargement mots-clés"
          );
        if (!assignedRes.ok)
          throw new Error(
            assignedKeywords?.message || "Erreur chargement mots-clés assignés"
          );

        setKeywords(allKeywords);
        setAssignedIds(assignedKeywords.map((k: KeywordItem) => k.id));

        // Pre-select already assigned ones
        const preselected = Object.fromEntries(
          assignedKeywords.map((k: KeywordItem) => [k.id, true])
        );
        setSelected(preselected);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Erreur lors du chargement");
      } finally {
        setFetching(false);
      }
    })();
  }, [open, groupId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return keywords;
    return keywords.filter((k) => k.name.toLowerCase().includes(q));
  }, [keywords, query]);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const totalKeywords = keywords.length;

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const submit = async () => {
    if (!groupId) {
      setError("Aucun groupe sélectionné");
      return;
    }

    const keywordIds = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id);

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/keyword-groups/${groupId}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordIds }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Erreur lors de l'attachement");

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erreur lors de l'attachement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="p-1.5 rounded-md bg-muted/50">
              <Tag className="h-5 w-5" />
            </div>
            <span>Assigner des mots-clés</span>
            {!fetching && keywords.length > 0 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {selectedCount}/{totalKeywords} sélectionné(s)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loading variant="dots" text="Chargement des mots-clés..." />
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher un mot-clé..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 transition-colors focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <div className="max-h-80 overflow-y-auto border rounded-lg p-3 bg-background">
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                      <div className="text-muted-foreground/60">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {query
                          ? "Aucun mot-clé correspondant à votre recherche"
                          : "Aucun mot-clé disponible"}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {filtered.map((k) => {
                      const isAssigned = assignedIds.includes(k.id);
                      const isSelected = !!selected[k.id];
                      return (
                        <label
                          key={k.id}
                          className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? "bg-primary/8 border border-primary/20"
                              : isAssigned
                              ? "bg-muted/40"
                              : "hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggle(k.id)}
                              className="h-4 w-4 rounded cursor-pointer flex-shrink-0 transition-all"
                            />
                            <span className="font-medium text-sm truncate">
                              {k.name}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                              {typeof k.fileCount === "number" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs whitespace-nowrap"
                                >
                                  {k.fileCount}{" "}
                                  {k.fileCount === 1 ? "fichier" : "fichiers"}
                                </Badge>
                              )}
                              {isAssigned && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs whitespace-nowrap"
                                >
                                  Assigné
                                </Badge>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-md bg-destructive/8 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="transition-all"
          >
            Annuler
          </Button>
          <Button
            onClick={submit}
            disabled={loading || fetching || selectedCount === 0}
            className="transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Assignation...
              </span>
            ) : (
              `Assigner (${selectedCount})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
