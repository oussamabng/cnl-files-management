import { redirect } from "next/navigation";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getSessionUser } from "@/lib/auth/session/getUserSession";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";

export default async function HomePage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const permissions = getUserPermissions(sessionUser);
  console.log("user permissions are",permissions);
  


  if (permissions.includes(PERMISSIONS.DASHBOARD_VIEW)) {
    redirect("/dashboard");
  }

  if (permissions.includes(PERMISSIONS.FILES_VIEW)) {
    console.log("useer have view files permisisoin");
    
    redirect("/dashboard/files");
  }

  if (permissions.includes(PERMISSIONS.FOLDERS_VIEW)) {
    redirect("/dashboard/folders");
  }

  if (permissions.includes(PERMISSIONS.USERS_VIEW)) {
    redirect("/dashboard/users");
  }

  if (permissions.includes(PERMISSIONS.ROLES_VIEW)) {
    redirect("/dashboard/roles");
  }

  redirect("/unauthorized");
}
