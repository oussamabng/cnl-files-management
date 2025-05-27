"use client";

import { useState, useEffect, useRef, JSX } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateInput } from "@/components/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronUpIcon, ChevronDownIcon, CheckIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface Preset {
  name: string;
  label: string;
}

interface SimpleDateRangePickerProps {
  onUpdate?: (values: { range: DateRange }) => void;
  initialDateFrom?: Date | string;
  initialDateTo?: Date | string;
  align?: "start" | "center" | "end";
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

const formatDate = (date: Date): string => {
  return format(date, "dd MMM yyyy", { locale: fr });
};

const getDateAdjustedForTimezone = (dateInput: Date | string): Date => {
  if (typeof dateInput === "string") {
    const parts = dateInput.split("-").map((part) => Number.parseInt(part, 10));
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date;
  } else {
    return dateInput;
  }
};

// Define presets
const PRESETS: Preset[] = [
  { name: "today", label: "Aujourd'hui" },
  { name: "yesterday", label: "Hier" },
  { name: "last7", label: "7 derniers jours" },
  { name: "last14", label: "14 derniers jours" },
  { name: "last30", label: "30 derniers jours" },
  { name: "thisWeek", label: "Cette semaine" },
  { name: "lastWeek", label: "Semaine dernière" },
  { name: "thisMonth", label: "Ce mois" },
  { name: "lastMonth", label: "Mois dernier" },
];

export function SimpleDateRangePicker({
  initialDateFrom,
  initialDateTo,
  onUpdate,
  align = "end",
  dateRange,
  onDateRangeChange,
  placeholder = "Sélectionner une période",
}: SimpleDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize with undefined if no dateRange is provided
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (dateRange?.from) {
      return dateRange;
    }
    if (initialDateFrom) {
      return {
        from: getDateAdjustedForTimezone(initialDateFrom),
        to: initialDateTo
          ? getDateAdjustedForTimezone(initialDateTo)
          : getDateAdjustedForTimezone(initialDateFrom),
      };
    }
    return undefined;
  });

  // Refs to store the values when the date picker is opened
  const openedRangeRef = useRef<DateRange | undefined>(undefined);

  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
    undefined
  );

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < 960 : false
  );

  useEffect(() => {
    const handleResize = (): void => {
      setIsSmallScreen(window.innerWidth < 960);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (dateRange?.from) {
      setRange(dateRange);
    } else if (dateRange === undefined) {
      setRange(undefined);
    }
  }, [dateRange]);

  const getPresetRange = (presetName: string): DateRange => {
    const preset = PRESETS.find(({ name }) => name === presetName);
    if (!preset) throw new Error(`Unknown date range preset: ${presetName}`);
    const from = new Date();
    const to = new Date();
    const first = from.getDate() - from.getDay();

    switch (preset.name) {
      case "today":
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1);
        to.setHours(23, 59, 59, 999);
        break;
      case "last7":
        from.setDate(from.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "last14":
        from.setDate(from.getDate() - 13);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "last30":
        from.setDate(from.getDate() - 29);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "thisWeek":
        from.setDate(first);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "lastWeek":
        from.setDate(from.getDate() - 7 - from.getDay());
        to.setDate(to.getDate() - to.getDay() - 1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
        from.setMonth(from.getMonth() - 1);
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        to.setDate(0);
        to.setHours(23, 59, 59, 999);
        break;
    }

    return { from, to };
  };

  const setPreset = (preset: string): void => {
    const newRange = getPresetRange(preset);
    setRange(newRange);
  };

  const checkPreset = (): void => {
    if (!range?.from) {
      setSelectedPreset(undefined);
      return;
    }

    for (const preset of PRESETS) {
      const presetRange = getPresetRange(preset.name);

      const normalizedRangeFrom = new Date(range.from);
      normalizedRangeFrom.setHours(0, 0, 0, 0);
      const normalizedPresetFrom = new Date(
        presetRange.from.setHours(0, 0, 0, 0)
      );

      const normalizedRangeTo = new Date(range.to ?? 0);
      normalizedRangeTo.setHours(0, 0, 0, 0);
      const normalizedPresetTo = new Date(
        presetRange.to?.setHours(0, 0, 0, 0) ?? 0
      );

      if (
        normalizedRangeFrom.getTime() === normalizedPresetFrom.getTime() &&
        normalizedRangeTo.getTime() === normalizedPresetTo.getTime()
      ) {
        setSelectedPreset(preset.name);
        return;
      }
    }

    setSelectedPreset(undefined);
  };

  const resetValues = (): void => {
    if (dateRange?.from) {
      setRange(dateRange);
    } else if (initialDateFrom) {
      setRange({
        from:
          typeof initialDateFrom === "string"
            ? getDateAdjustedForTimezone(initialDateFrom)
            : initialDateFrom,
        to: initialDateTo
          ? typeof initialDateTo === "string"
            ? getDateAdjustedForTimezone(initialDateTo)
            : initialDateTo
          : typeof initialDateFrom === "string"
          ? getDateAdjustedForTimezone(initialDateFrom)
          : initialDateFrom,
      });
    } else {
      setRange(undefined);
    }
  };

  useEffect(() => {
    checkPreset();
  }, [range]);

  const PresetButton = ({
    preset,
    label,
    isSelected,
  }: {
    preset: string;
    label: string;
    isSelected: boolean;
  }): JSX.Element => (
    <Button
      className={cn(isSelected && "pointer-events-none")}
      variant="ghost"
      onClick={() => {
        setPreset(preset);
      }}
    >
      <>
        <span className={cn("pr-2 opacity-0", isSelected && "opacity-70")}>
          <CheckIcon className="w-4 h-4" />
        </span>
        {label}
      </>
    </Button>
  );

  // Helper function to check if two date ranges are equal
  const areRangesEqual = (a?: DateRange, b?: DateRange): boolean => {
    if (!a || !b) return a === b;
    return (
      a.from.getTime() === b.from.getTime() &&
      (!a.to || !b.to || a.to.getTime() === b.to.getTime())
    );
  };

  useEffect(() => {
    if (isOpen) {
      openedRangeRef.current = range;
    }
  }, [isOpen]);

  const handleUpdate = () => {
    setIsOpen(false);
    if (!areRangesEqual(range, openedRangeRef.current)) {
      if (range?.from) {
        onUpdate?.({ range });
        onDateRangeChange?.(range);
      }
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    resetValues();
  };

  const clearRange = () => {
    setRange(undefined);
    onDateRangeChange?.(undefined);
    setIsOpen(false);
  };

  return (
    <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <div className="text-left">
            {range?.from ? (
              <div className="py-1">
                <div>{`${formatDate(range.from)}${
                  range.to != null ? " - " + formatDate(range.to) : ""
                }`}</div>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <div className="pl-1 opacity-60 -mr-2 scale-125 ml-auto">
            {isOpen ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto max-w-[800px]">
        <div className="flex py-1">
          <div className="flex">
            <div className="flex flex-col">
              <div className="flex flex-col lg:flex-row gap-2 px-2 justify-end items-center lg:items-start pb-2 lg:pb-0">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <DateInput
                      value={range?.from}
                      onChange={(date) => {
                        const toDate =
                          range?.to == null || date > range.to
                            ? date
                            : range.to;
                        setRange({
                          from: date,
                          to: toDate,
                        });
                      }}
                    />
                    <div className="py-1">-</div>
                    <DateInput
                      value={range?.to}
                      onChange={(date) => {
                        if (!range?.from) {
                          setRange({ from: date, to: date });
                        } else {
                          const fromDate =
                            date < range.from ? date : range.from;
                          setRange({
                            from: fromDate,
                            to: date,
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              {isSmallScreen && (
                <Select
                  value={selectedPreset || ""}
                  onValueChange={(value) => {
                    if (value) setPreset(value);
                  }}
                >
                  <SelectTrigger className="w-[180px] mx-auto mb-2">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div>
                <Calendar
                  mode="range"
                  onSelect={(value: { from?: Date; to?: Date } | undefined) => {
                    if (value?.from != null) {
                      setRange({ from: value.from, to: value?.to });
                    }
                  }}
                  selected={range}
                  numberOfMonths={isSmallScreen ? 1 : 2}
                  defaultMonth={
                    range?.from ||
                    new Date(
                      new Date().setMonth(
                        new Date().getMonth() - (isSmallScreen ? 0 : 1)
                      )
                    )
                  }
                  locale={fr}
                  className="p-0"
                />
              </div>
            </div>
          </div>
          {!isSmallScreen && (
            <div className="flex flex-col items-end gap-1 pr-1 pl-4 pb-2">
              <div className="flex w-full flex-col items-end gap-0.5 pr-1 pl-4 pb-2">
                {PRESETS.map((preset) => (
                  <PresetButton
                    key={preset.name}
                    preset={preset.name}
                    label={preset.label}
                    isSelected={selectedPreset === preset.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between gap-2 py-1 px-3">
          <Button
            onClick={clearRange}
            variant="ghost"
            className="text-muted-foreground h-8"
          >
            Effacer
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="ghost" className="h-8">
              Annuler
            </Button>
            <Button onClick={handleUpdate} className="h-8">
              Appliquer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
