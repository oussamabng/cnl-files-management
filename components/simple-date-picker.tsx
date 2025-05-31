"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ImprovedDateInput } from "./improved-date-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SimpleDatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

export function SimpleDatePicker({
  selected,
  onSelect,
  placeholder = "Sélectionner une date",
  className,
  buttonClassName,
}: SimpleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(selected);
  const [activeTab, setActiveTab] = useState("manual");
  const isSmallScreen = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    setTempDate(selected);
  }, [selected]);

  useEffect(() => {
    if (isSmallScreen && activeTab === "calendar") {
      setActiveTab("manual");
    }
  }, [isSmallScreen, activeTab]);

  const clearDate = () => {
    onSelect?.(undefined);
    setOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setTempDate(date);
    onSelect?.(date);
  };

  const handleConfirm = () => {
    onSelect?.(tempDate);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selected && "text-muted-foreground",
              buttonClassName
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {selected
              ? format(selected, "dd MMMM yyyy", { locale: fr })
              : placeholder}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sélectionner une date</DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Saisie
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                disabled={isSmallScreen}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Calendrier
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="py-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Saisie manuelle de la date :
                </p>
                <ImprovedDateInput
                  value={tempDate}
                  onChange={handleDateSelect}
                />
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="py-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Sélection par calendrier :
                </p>
                <div className="flex justify-center overflow-hidden">
                  <CalendarComponent
                    mode="single"
                    selected={tempDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={fr}
                    className="border rounded shadow-sm"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-4">
            {selected && (
              <Button variant="outline" size="sm" onClick={clearDate}>
                <X className="mr-2 h-4 w-4" />
                Effacer
              </Button>
            )}
            <div className={cn("flex justify-end", !selected && "w-full")}>
              <Button onClick={handleConfirm}>Confirmer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
