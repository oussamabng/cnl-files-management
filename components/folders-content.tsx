"use client";

import { useState } from "react";
import { FolderBrowser } from "@/components/folder-browser";

export function FoldersContent() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <FolderBrowser
        role="admin"
        currentFolderId={currentFolderId}
        onFolderChange={setCurrentFolderId}
      />
    </div>
  );
}
