"use client";

import { useState } from "react";
import { KeywordGroupsBrowser } from "./keyword-groups-browser";
import { PermissionValue } from "../lib/constants/permissions";

interface KeywordGroupsContentProps {
  permissions: PermissionValue[];
}

export function KeywordGroupsContent({
  permissions,
}: KeywordGroupsContentProps) {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  // DEBUG: log current group changes
  console.log("[KeywordGroupsContent] currentGroupId:", currentGroupId);

  return (
    <div className="space-y-4">
      <KeywordGroupsBrowser
        permissions={permissions}
        currentGroupId={currentGroupId}
        onGroupChange={(id) => {
          console.log(
            "[KeywordGroupsContent] onGroupChange called with id:",
            id
          );
          setCurrentGroupId(id);
        }}
      />
    </div>
  );
}
