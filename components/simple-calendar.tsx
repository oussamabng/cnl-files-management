/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { fr } from "date-fns/locale";

interface SimpleCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
}

export function SimpleCalendar({
  selected,
  onSelect,
  initialFocus,
}: SimpleCalendarProps) {
  const [viewDate, setViewDate] = useState(selected || new Date());

  const currentYear = new Date().getFullYear();

  // Quick year presets
  const yearPresets = [
    { label: "Cette année", year: currentYear },
    { label: "Année dernière", year: currentYear - 1 },
    { label: "Il y a 2 ans", year: currentYear - 2 },
    { label: "Il y a 3 ans", year: currentYear - 3 },
    { label: "Il y a 5 ans", year: currentYear - 5 },
  ];

  const goToYear = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    newDate.setMonth(0); // January
    newDate.setDate(1);
    setViewDate(newDate);
  };

  const goToPreviousYear = () => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(viewDate.getFullYear() - 1);
    setViewDate(newDate);
  };

  const goToNextYear = () => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(viewDate.getFullYear() + 1);
    setViewDate(newDate);
  };

  return (
    <div className="space-y-4">
      {/* Year Presets */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Accès rapide :
        </p>
        <div className="flex flex-wrap gap-2">
          {yearPresets.map((preset) => (
            <Button
              key={preset.year}
              variant="outline"
              size="sm"
              onClick={() => goToYear(preset.year)}
              className="h-7 text-xs"
            >
              {preset.label}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                {preset.year}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Year Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goToPreviousYear}>
          <ChevronLeft className="h-4 w-4" />
          {viewDate.getFullYear() - 1}
        </Button>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{viewDate.getFullYear()}</span>
        </div>

        <Button variant="outline" size="sm" onClick={goToNextYear}>
          {viewDate.getFullYear() + 1}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar */}
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={viewDate}
        onMonthChange={setViewDate}
        initialFocus={initialFocus}
        locale={fr}
        className="rounded-md border-0"
      />

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const today = new Date();
            setViewDate(today);
            onSelect?.(today);
          }}
          className="text-xs"
        >
          Aujourd'hui
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect?.(undefined)}
          className="text-xs text-muted-foreground"
        >
          Effacer
        </Button>
      </div>
    </div>
  );
}
