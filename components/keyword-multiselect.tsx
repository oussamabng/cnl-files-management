"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface Item {
  id: string;
  name: string;
  type?: "keyword" | "group";
}

interface KeywordMultiselectProps {
  items: Item[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  placeholder?: string;
  isCompact?: boolean;
}

export function KeywordMultiselect({
  items,
  selectedIds,
  onSelectionChange,
  placeholder = "Sélectionner...",
  isCompact = true,
}: KeywordMultiselectProps) {
  const [open, setOpen] = useState(false);

  const groupedItems = items.reduce((acc, item) => {
    const type = item.type || "keyword";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  const toggleItem = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            isCompact ? "h-8 text-xs" : ""
          )}
        >
          <span className="truncate">
            {selectedItems.length > 0
              ? `${selectedItems.length} sélectionné(s)`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn("w-full p-0", isCompact ? "max-w-xs" : "max-w-md")}
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Rechercher..."
            className={isCompact ? "text-xs" : ""}
          />
          <CommandEmpty>Aucun élément trouvé</CommandEmpty>
          <CommandList
            className={isCompact ? "max-h-[200px]" : "max-h-[300px]"}
          >
            {Object.entries(groupedItems).map(([type, typeItems]) => (
              <CommandGroup
                key={type}
                heading={type === "keyword" ? "Mots-clés" : "Groupes"}
              >
                {typeItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => toggleItem(item.id)}
                    className={isCompact ? "text-xs" : ""}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.includes(item.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>

      {isCompact && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="text-xs"
              onClick={() => toggleItem(item.id)}
            >
              {item.name}
              <X className="ml-1 h-3 w-3 cursor-pointer" />
            </Badge>
          ))}
        </div>
      )}
    </Popover>
  );
}
