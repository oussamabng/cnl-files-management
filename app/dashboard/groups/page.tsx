import { redirect } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { KeywordGroupsContent } from "@/components/keyword-groups-content";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { checkPermission } from "@/lib/auth/session/checkPermission";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";

export default async function GroupsPage() {
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
              <BreadcrumbPage>Gestion des groupes</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <KeywordGroupsContent permissions={permissions} />
      </div>
    </>
  );
}
