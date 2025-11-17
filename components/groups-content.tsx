"use client";

import { useState } from "react";
import { GroupBrowser } from "@/components/group-browser";
import { PermissionValue } from "../lib/constants/permissions";

interface GroupsContentProps {
  permissions: PermissionValue[];
}

export function GroupsContent({permissions}:GroupsContentProps) {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <GroupBrowser
        permissions={permissions}
        currentGroupId={currentGroupId}
        onGroupChange={setCurrentGroupId}
      />
    </div>
  );
}
