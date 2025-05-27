"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/date-input";
import { Separator } from "@/components/ui/separator";

interface SimpleDatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleDatePicker({
  selected,
  onSelect,
  placeholder = "Sélectionner une date",
  className,
}: SimpleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(selected);

  useEffect(() => {
    setTempDate(selected);
  }, [selected]);

  const clearDate = () => {
    onSelect?.(undefined);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {selected
              ? format(selected, "dd MMMM yyyy", { locale: fr })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            {/* Manual Date Input */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Saisie manuelle :</p>
              <DateInput
                value={tempDate}
                onChange={(date) => {
                  setTempDate(date);
                  onSelect?.(date);
                  if (date) {
                    setOpen(false);
                  }
                }}
              />
            </div>

            <Separator />

            {/* Calendar Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Sélection calendrier :</p>
              <CalendarComponent
                mode="single"
                selected={tempDate}
                onSelect={(date) => {
                  setTempDate(date);
                  onSelect?.(date);
                  if (date) {
                    setOpen(false);
                  }
                }}
                initialFocus
                locale={fr}
              />
            </div>
          </div>

          {selected && (
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDate}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Effacer la date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
