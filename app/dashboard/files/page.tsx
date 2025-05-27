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
import { FilesContent } from "@/components/files-content";

export default async function FilesPage() {
  const role = (await cookies()).get("auth_token")?.value;

  if (!role) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              {role === "admin" && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      Tableau de bord
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Gestion des fichiers</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
              {role === "utilisateur" && (
                <BreadcrumbItem>
                  <BreadcrumbPage>Gestion des fichiers</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <FilesContent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
