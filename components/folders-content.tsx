"use client";

import { useState } from "react";
import { FolderBrowser } from "@/components/folder-browser";
import { PermissionValue } from "../lib/constants/permissions";

interface FoldersContentProps {
  permissions: PermissionValue[];
}

export function FoldersContent({permissions}:FoldersContentProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <FolderBrowser
        permissions={permissions}
        currentFolderId={currentFolderId}
        onFolderChange={setCurrentFolderId}
      />
    </div>
  );
}
