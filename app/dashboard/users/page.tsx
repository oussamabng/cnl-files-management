import { redirect } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { UsersContent } from "@/components/users-content";
import { checkPermission } from "@/lib/auth/session/checkPermission";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";

export default async function UsersPage() {
  const currentUser = await checkPermission(PERMISSIONS.USERS_VIEW);

  if (!currentUser) {
    redirect("/login");
  }

  const permissions = getUserPermissions(currentUser);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Gestion des Utilisateurs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <UsersContent permissions={permissions} />
      </div>
    </>
  );
}
