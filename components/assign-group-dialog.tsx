"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";


interface AssignGroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyword?: { id: string; name: string } | null;
  onSuccess: () => void;
}

export function AssignGroupDialog({
  open,
  onOpenChange,
  keyword,
  onSuccess,
}: AssignGroupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [error, setError] = useState("");

  const onSubmit = async (values: string[]) => {
    setIsLoading(true);
    setError("");

    try {
      const url = keyword ? `/api/keywords/${keyword.id}` : "/api/keywords";
      const method = keyword ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(data.message || "Une erreur est survenue");
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError("");
    }
    onOpenChange(newOpen);
  };

  const handleToggle = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter((id) => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  type Group = {
    id: string;
    name: string;
  };

  const groups: Group[] = [
    {
      id: "1",
      name: "Groupe 1",
    },
    {
      id: "2",
      name: "Groupe 2",
    },
    {
      id: "3",
      name: "Groupe 3",
    },
    {
      id: "4",
      name: "Groupe 4",
    },
  ];
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>assigner au groupe</DialogTitle>
          <DialogDescription>
            assigner des mot clés à des groupes de filtres
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="mt-4 max-h-60 rounded-md border p-3">
          <div className="space-y-3">
            {groups.length > 0 ? (
              groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center space-x-3 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors"
                >
                  <Checkbox
                    id={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={() => handleToggle(group.id)}
                  />
                  <Label
                    htmlFor={group.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {group.name}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun groupe disponible.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isLoading || selectedGroups.length === 0}
          >
            {isLoading ? "Enregistrement..." : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
