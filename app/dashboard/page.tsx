import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { DashboardStats } from "@/components/dashboard-stats";

export default async function DashboardPage() {
  const role = (await cookies()).get("auth_token")?.value;

  if (!role) {
    redirect("/login");
  }

  // Rediriger les utilisateurs vers la page des fichiers car le dashboard est réservé aux admins
  if (role !== "admin") {
    redirect("/dashboard/files");
  }

  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Tableau de bord</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Bienvenue Admin</h1>
            <p className="text-muted-foreground">
              Voici un aperçu de votre système de gestion de fichiers
            </p>
          </div>

          <DashboardStats />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
