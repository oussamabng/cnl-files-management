"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EnhancedCalendar } from "@/components/enhanced-calendar";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Sélectionner une période",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(dateRange);

  const clearDateRange = () => {
    onDateRangeChange(undefined);
    setTempRange(undefined);
    setOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!tempRange?.from) {
      // First date selection
      setTempRange({ from: date, to: undefined });
    } else if (!tempRange.to && date >= tempRange.from) {
      // Second date selection (end date)
      const newRange = { from: tempRange.from, to: date };
      setTempRange(newRange);
      onDateRangeChange(newRange);
      setOpen(false);
    } else {
      // Reset and start new selection
      setTempRange({ from: date, to: undefined });
    }
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return placeholder;

    if (range.from && !range.to) {
      return `À partir du ${format(range.from, "dd MMM yyyy", { locale: fr })}`;
    }

    if (range.from && range.to) {
      if (range.from.getTime() === range.to.getTime()) {
        return format(range.from, "dd MMM yyyy", { locale: fr });
      }
      return `${format(range.from, "dd MMM yyyy", { locale: fr })} - ${format(
        range.to,
        "dd MMM yyyy",
        { locale: fr }
      )}`;
    }

    return placeholder;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange?.from && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange(dateRange)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="text-sm font-medium mb-3">
              {!tempRange?.from
                ? "Sélectionnez la date de début"
                : !tempRange.to
                ? "Sélectionnez la date de fin"
                : "Période sélectionnée"}
            </div>

            <EnhancedCalendar
              selected={tempRange?.from}
              onSelect={handleDateSelect}
              initialFocus
              locale={fr}
            />

            {tempRange?.from && (
              <div className="mt-3 p-2 bg-muted rounded text-sm">
                <strong>Sélection :</strong>
                <br />
                Début : {format(tempRange.from, "dd MMM yyyy", { locale: fr })}
                {tempRange.to && (
                  <>
                    <br />
                    Fin : {format(tempRange.to, "dd MMM yyyy", { locale: fr })}
                  </>
                )}
              </div>
            )}
          </div>

          {(dateRange?.from || tempRange?.from) && (
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateRange}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Effacer la période
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
