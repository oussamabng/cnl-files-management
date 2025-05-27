"use client";

import type React from "react";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";

interface DateInputProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
}

export function DateInput({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
}: DateInputProps) {
  const [inputValue, setInputValue] = useState(
    value ? format(value, "dd/MM/yyyy", { locale: fr }) : ""
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse the date
    const parts = newValue.split("/");
    if (parts.length === 3) {
      const day = Number.parseInt(parts[0], 10);
      const month = Number.parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = Number.parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        if (
          date.getDate() === day &&
          date.getMonth() === month &&
          date.getFullYear() === year
        ) {
          onChange?.(date);
        }
      }
    }
  };

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className="w-[120px]"
    />
  );
}
