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
import { FoldersContent } from "@/components/folders-content";
import { checkPermission } from "@/lib/auth/checkPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getUserPermissions } from '../../../lib/auth/getUserPermissions';

export default async function FoldersPage() {
  const user = await checkPermission(PERMISSIONS.FOLDERS_VIEW);

  if (!user) {
    redirect("/login");
  }
  const permissions = getUserPermissions(user);
  
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
                <BreadcrumbPage>Gestion des dossiers</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <FoldersContent permissions={permissions}  />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
