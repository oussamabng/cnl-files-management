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
import { FiltersContent } from "@/components/filters-content";
import { checkPermission } from "@/lib/auth/checkPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";

export default async function FiltersPage() {
  const user = checkPermission(PERMISSIONS.FILES_VIEW);

  if (!user) {
    redirect("/login");
  }

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
                <BreadcrumbPage>Gestion des filtres</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <FiltersContent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
