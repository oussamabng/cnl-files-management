import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/auth/session/checkPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getUserName } from "@/lib/utils";

export default async function DiscussionsPage() {
  const user = await checkPermission(PERMISSIONS.DASHBOARD_VIEW);
  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Discussions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">
              Bienvenue {getUserName({ firstName: user.firstName, lastName: user.lastName })}
            </h1>
            <p className="text-muted-foreground">
              Partagez, discutez et collaborez en temps réel avec votre équipe.
            </p>
          </div>

          
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
