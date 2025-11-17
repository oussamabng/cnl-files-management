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
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

import { Group } from "@/lib/generated/prisma";
import { SelectGroup } from "./group-selector";

interface AssignGroupFormProps {
  open: boolean;
  groups: Group[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onSave: (groupIds: string[]) => void;
}

export function AssignGroupDialog({
  open,
  groups,
  onOpenChange,
  onSuccess,
  onSave,
}: AssignGroupFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [error, setError] = useState("");


  const save = async () => {
    try {
      if(selectedGroupIds === null) return;
      await onSave(selectedGroupIds );
      onSuccess();
      onOpenChange(false);
    } catch {}
  };
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError("");
    }
    onOpenChange(newOpen);
  };

  const handleToggle = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>assigner au groupe</DialogTitle>
          <DialogDescription>
            assigner des mot clés à des groupes de filtres
          </DialogDescription>
        </DialogHeader>

        <SelectGroup
          selectedGroupIds={selectedGroupIds}
          onGroupSelect={setSelectedGroupIds}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading }
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading || selectedGroupIds.length === 0} onClick={save}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
