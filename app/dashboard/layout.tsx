import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getUserSession"; // adjust path if needed

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      {/* You can optionally include dashboard-specific layout like Sidebar/Header here */}
      <main className="flex-1">
        {children}
      </main>
    </>
  );
}
