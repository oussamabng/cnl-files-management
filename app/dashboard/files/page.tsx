import { redirect } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { FilesContent } from "@/components/files-content";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { checkPermission } from "@/lib/auth/session/checkPermission";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";
import { getAllGroups } from "@/models/keywordGroup";
import { getAllKeywords } from "@/models/keyword";

export default async function FilesPage() {
  const user = await checkPermission(PERMISSIONS.FILES_VIEW);

  if (!user) {
    redirect("/login");
  }

  const permissions = getUserPermissions(user);

  const groups = await getAllGroups();
  const keywords = await getAllKeywords();

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Gestion des fichiers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <FilesContent
          permissions={permissions}
          keywords={keywords}
          groups={groups}
        />
      </div>
    </>
  );
}
