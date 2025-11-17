import { redirect } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { FoldersContent } from "@/components/folders-content";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { checkPermission } from "@/lib/auth/session/checkPermission";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";

export default async function FoldersPage() {
  const user = await checkPermission(PERMISSIONS.FOLDERS_VIEW);

  if (!user) {
    redirect("/login");
  }
  const permissions = getUserPermissions(user);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Gestion des dossiers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <FoldersContent permissions={permissions} />
      </div>
    </>
  );
}
