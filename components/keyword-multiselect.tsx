"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Keyword {
  id: string;
  name: string;
}

interface KeywordMultiselectProps {
  keywords: Keyword[];
  selectedKeywords: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function KeywordMultiselect({
  keywords,
  selectedKeywords,
  onSelectionChange,
  placeholder = "Sélectionner des mots-clés...",
  disabled = false,
}: KeywordMultiselectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedKeywordNames = keywords
    .filter((keyword) => selectedKeywords.includes(keyword.id))
    .map((keyword) => keyword.name);

  const filteredKeywords = keywords.filter((keyword) =>
    keyword.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const toggleKeyword = (keywordId: string) => {
    const newSelection = selectedKeywords.includes(keywordId)
      ? selectedKeywords.filter((id) => id !== keywordId)
      : [...selectedKeywords, keywordId];
    onSelectionChange(newSelection);
  };

  const removeKeyword = (keywordId: string) => {
    onSelectionChange(selectedKeywords.filter((id) => id !== keywordId));
  };

  const removeAll = () => {
    onSelectionChange([]);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {selectedKeywords.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <span className="truncate">
                  {selectedKeywords.length} mot
                  {selectedKeywords.length > 1 ? "s" : ""}-clé
                  {selectedKeywords.length > 1 ? "s" : ""} sélectionné
                  {selectedKeywords.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start" side="bottom">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Rechercher des mots-clés..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList>
              <CommandEmpty>Aucun mot-clé trouvé.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-60">
                  {filteredKeywords.map((keyword) => (
                    <CommandItem
                      key={keyword.id}
                      value={keyword.name}
                      onSelect={() => toggleKeyword(keyword.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedKeywords.includes(keyword.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {keyword.name}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
            {selectedKeywords.length > 0 && (
              <>
                <Separator />
                <div className="p-2 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeAll}
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer tout
                  </Button>
                </div>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Keywords Display */}
      {selectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 border rounded-md bg-muted/30">
          {selectedKeywordNames.map((name) => {
            const keywordId = keywords.find((k) => k.name === name)?.id;
            return keywordId ? (
              <Badge key={keywordId} variant="secondary" className="text-xs">
                {name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeKeyword(keywordId)}
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
