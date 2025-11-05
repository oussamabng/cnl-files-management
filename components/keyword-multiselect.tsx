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

interface KeywordOrGroup {
  id: string;
  name: string;
  type: "keyword" | "group";
}

interface KeywordMultiselectProps {
  items: KeywordOrGroup[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function KeywordMultiselect({
  items,
  selectedIds,
  onSelectionChange,
  placeholder = "Sélectionner des mots-clés ou groupes...",
  disabled = false,
}: KeywordMultiselectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedItemNames = items
    .filter((item) => selectedIds.includes(item.id))
    .map((item) => item.name);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const toggleItem = (itemId: string) => {
    const newSelection = selectedIds.includes(itemId)
      ? selectedIds.filter((id) => id !== itemId)
      : [...selectedIds, itemId];
    onSelectionChange(newSelection);
  };

  const removeItem = (itemId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== itemId));
  };

  const removeAll = () => {
    onSelectionChange([]);
    setOpen(false);
  };

  // Split items into groups and keywords
  const groupsItems = filteredItems.filter((i) => i.type === "group");
  const keywordsItems = filteredItems.filter((i) => i.type === "keyword");

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
              {selectedIds.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <span className="truncate">
                  {selectedIds.length} élément
                  {selectedIds.length > 1 ? "s" : ""} sélectionné
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
                placeholder="Rechercher..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList>
              <CommandEmpty>Aucun élément trouvé.</CommandEmpty>

              {/* Groups */}
              {groupsItems.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Groupes
                  </div>
                  <CommandGroup>
                    <ScrollArea className="max-h-48">
                      {groupsItems.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.name}
                          onSelect={() => toggleItem(item.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedIds.includes(item.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="font-semibold">{item.name}</span>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                  <Separator />
                </>
              )}

              {/* Keywords */}
              {keywordsItems.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Mots-clés
                  </div>
                  <CommandGroup>
                    <ScrollArea className="max-h-48">
                      {keywordsItems.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.name}
                          onSelect={() => toggleItem(item.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedIds.includes(item.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span>{item.name}</span>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </>
              )}
            </CommandList>

            {selectedIds.length > 0 && (
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

      {/* Selected Items Display */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 border rounded-md bg-muted/30">
          {selectedItemNames.map((name) => {
            const item = items.find((k) => k.name === name);
            if (!item) return null;
            return (
              <Badge
                key={item.id}
                variant={item.type === "group" ? "secondary" : "outline"}
                className="text-xs"
              >
                {name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
