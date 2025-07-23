// app/page.tsx

import { redirect } from "next/navigation";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getSessionUser } from "@/lib/auth/server/getUserSession";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";

export default async function HomePage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const permissions = getUserPermissions(sessionUser);
  console.log("user perssions are:", permissions);
  console.log("user session is:", sessionUser);

  // // Super admin has full access
  if (permissions.includes(PERMISSIONS.SUPER_ADMIN)) {
    redirect("/dashboard");
  }

  // Prioritized redirection based on permission
  if (permissions.includes(PERMISSIONS.DASHBOARD_VIEW)) {
    redirect("/dashboard");
  }

  if (permissions.includes(PERMISSIONS.FILES_VIEW)) {
    redirect("/dashboard/files");
  }

  if (permissions.includes(PERMISSIONS.FOLDERS_VIEW)) {
    redirect("/dashboard/folders");
  }
  return <>taha</>;

  // Default fallback (no known permission)
  redirect("/unauthorized"); // Or a friendly access denied page
}
