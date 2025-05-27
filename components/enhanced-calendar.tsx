/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";

interface EnhancedCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  locale?: any;
}

export function EnhancedCalendar({
  selected,
  onSelect,
  initialFocus,
  locale = fr,
}: EnhancedCalendarProps) {
  const currentDate = selected || new Date();
  const [viewDate, setViewDate] = useState(currentDate);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Generate year options (from 1900 to current year + 10)
  const currentYearActual = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYearActual - 1900 + 11 },
    (_, i) => 1900 + i
  ).reverse();

  // Month options
  const monthOptions = [
    { value: 0, label: "Janvier" },
    { value: 1, label: "Février" },
    { value: 2, label: "Mars" },
    { value: 3, label: "Avril" },
    { value: 4, label: "Mai" },
    { value: 5, label: "Juin" },
    { value: 6, label: "Juillet" },
    { value: 7, label: "Août" },
    { value: 8, label: "Septembre" },
    { value: 9, label: "Octobre" },
    { value: 10, label: "Novembre" },
    { value: 11, label: "Décembre" },
  ];

  const handleYearChange = (year: string) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(Number.parseInt(year));
    setViewDate(newDate);
  };

  const handleMonthChange = (month: string) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(Number.parseInt(month));
    setViewDate(newDate);
  };

  const goToPreviousYear = () => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(currentYear - 1);
    setViewDate(newDate);
  };

  const goToNextYear = () => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(currentYear + 1);
    setViewDate(newDate);
  };

  return (
    <div className="space-y-4">
      {/* Year and Month Selectors */}
      <div className="flex items-center justify-between px-3">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            value={currentYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentMonth.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={goToNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const today = new Date();
            setViewDate(today);
          }}
        >
          Aujourd'hui
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
        locale={locale}
        className="rounded-md border-0"
      />
    </div>
  );
}
