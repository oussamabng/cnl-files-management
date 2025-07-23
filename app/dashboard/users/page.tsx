import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { UsersContent } from "@/components/users-content";
import { checkPermission } from "@/lib/auth/server/checkPermission";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";
import { getUserRoles } from "@/lib/auth/client/getUserRole";

export default async function UsersPage() {
  const currentUser = await checkPermission(PERMISSIONS.USERS_VIEW);

  if (!currentUser) {
    redirect("/login");
  }

  const permissions = getUserPermissions(currentUser);

  return (
    <SidebarProvider>
      {/* <AppSidebar role={role} /> */}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  Tableau de bord
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Gestion des Utilisateurs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <UsersContent permissions={permissions}/>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
