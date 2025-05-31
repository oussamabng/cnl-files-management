"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ImprovedDateInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
}

export function ImprovedDateInput({
  value,
  onChange,
  className,
}: ImprovedDateInputProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [errors, setErrors] = useState({
    day: false,
    month: false,
    year: false,
  });

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Update local state when value prop changes
  useEffect(() => {
    if (value) {
      setDay(value.getDate().toString().padStart(2, "0"));
      setMonth((value.getMonth() + 1).toString().padStart(2, "0"));
      setYear(value.getFullYear().toString());
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  const validateAndCreateDate = (d: string, m: string, y: string) => {
    const dayNum = Number.parseInt(d);
    const monthNum = Number.parseInt(m);
    const yearNum = Number.parseInt(y);

    const newErrors = {
      day: d !== "" && (isNaN(dayNum) || dayNum < 1 || dayNum > 31),
      month: m !== "" && (isNaN(monthNum) || monthNum < 1 || monthNum > 12),
      year: y !== "" && (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100),
    };

    setErrors(newErrors);

    // If all fields are filled and valid, create date
    if (d && m && y && !newErrors.day && !newErrors.month && !newErrors.year) {
      const date = new Date(yearNum, monthNum - 1, dayNum);
      // Validate that the date is actually valid (handles cases like Feb 30)
      if (
        date.getDate() === dayNum &&
        date.getMonth() === monthNum - 1 &&
        date.getFullYear() === yearNum
      ) {
        onChange?.(date);
        return true;
      } else {
        setErrors((prev) => ({ ...prev, day: true }));
        return false;
      }
    } else if (!d && !m && !y) {
      // All fields empty - clear the date
      onChange?.(undefined);
      return true;
    }

    return false;
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2);
    setDay(value);

    // Auto-advance to month field
    if (value.length === 2 && Number.parseInt(value) <= 31) {
      monthRef.current?.focus();
    }

    validateAndCreateDate(value, month, year);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMonth(value);

    // Auto-advance to year field
    if (value.length === 2 && Number.parseInt(value) <= 12) {
      yearRef.current?.focus();
    }

    validateAndCreateDate(day, value, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setYear(value);
    validateAndCreateDate(day, month, value);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    field: "day" | "month" | "year"
  ) => {
    if (e.key === "Backspace") {
      if (field === "month" && month === "" && day !== "") {
        dayRef.current?.focus();
      } else if (field === "year" && year === "" && month !== "") {
        monthRef.current?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      if (field === "month") dayRef.current?.focus();
      if (field === "year") monthRef.current?.focus();
    } else if (e.key === "ArrowRight") {
      if (field === "day") monthRef.current?.focus();
      if (field === "month") yearRef.current?.focus();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Input
            ref={dayRef}
            type="text"
            placeholder="JJ"
            value={day}
            onChange={handleDayChange}
            onKeyDown={(e) => handleKeyDown(e, "day")}
            className={cn(
              "text-center",
              errors.day && "border-red-500 focus-visible:ring-red-500"
            )}
            maxLength={2}
          />
          <p className="text-xs text-muted-foreground mt-1 text-center">Jour</p>
        </div>

        <span className="text-muted-foreground">/</span>

        <div className="flex-1">
          <Input
            ref={monthRef}
            type="text"
            placeholder="MM"
            value={month}
            onChange={handleMonthChange}
            onKeyDown={(e) => handleKeyDown(e, "month")}
            className={cn(
              "text-center",
              errors.month && "border-red-500 focus-visible:ring-red-500"
            )}
            maxLength={2}
          />
          <p className="text-xs text-muted-foreground mt-1 text-center">Mois</p>
        </div>

        <span className="text-muted-foreground">/</span>

        <div className="flex-1">
          <Input
            ref={yearRef}
            type="text"
            placeholder="AAAA"
            value={year}
            onChange={handleYearChange}
            onKeyDown={(e) => handleKeyDown(e, "year")}
            className={cn(
              "text-center",
              errors.year && "border-red-500 focus-visible:ring-red-500"
            )}
            maxLength={4}
          />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Année
          </p>
        </div>
      </div>

      {(errors.day || errors.month || errors.year) && (
        <p className="text-xs text-red-500">
          {errors.day && "Jour invalide. "}
          {errors.month && "Mois invalide. "}
          {errors.year && "Année invalide. "}
        </p>
      )}
    </div>
  );
}
