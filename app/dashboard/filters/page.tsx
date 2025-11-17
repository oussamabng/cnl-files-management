import { redirect } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { FiltersContent } from "@/components/filters-content";
import { checkPermission } from "@/lib/auth/session/checkPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";
import { GroupsContent } from "@/components/groups-content";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function FiltersPage() {
  const user = await checkPermission(PERMISSIONS.FILTERS_VIEW);

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
              <BreadcrumbPage>Gestion des filtres</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Tabs defaultValue="keywords" className="w-full">
          <TabsList>
            <TabsTrigger value="keywords" className="p-4">
              Mots-clés
            </TabsTrigger>
            <TabsTrigger value="groups" className="p-4">
              Groupes de filtres
            </TabsTrigger>
          </TabsList>
          <TabsContent value="keywords">
            <FiltersContent permissions={permissions} />
          </TabsContent>
          <TabsContent value="groups">
            <GroupsContent permissions={permissions} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
