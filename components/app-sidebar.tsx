/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  FileText,
  Filter,
  LogOut,
  User,
  LayoutDashboard,
  Folder,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { PERMISSIONS } from "@/lib/constants/permissions";

interface AppSidebarProps {
  permissions: string[];
}

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppSidebar({ permissions }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        router.push("/login");
        router.refresh();
      } else {
        console.error("Échec de la déconnexion");
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const rawMenuItems: (false | MenuItem)[] = [
    permissions.includes(PERMISSIONS.DASHBOARD_VIEW) && {
      title: "Tableau de bord",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    permissions.includes(PERMISSIONS.FOLDERS_MANAGE) && {
      title: "Gestion des dossiers",
      url: "/dashboard/folders",
      icon: Folder,
    },
    permissions.includes(PERMISSIONS.FILTERS_MANAGE) && {
      title: "Gestion des filtres",
      url: "/dashboard/filters",
      icon: Filter,
    },
    permissions.includes(PERMISSIONS.FILES_VIEW) && {
      title: "Gestion des fichiers",
      url: "/dashboard/files",
      icon: FileText,
    },
  ];

  const menuItems: MenuItem[] = rawMenuItems.filter((item): item is MenuItem =>
    Boolean(item)
  );

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url);
  };

const getPanelLabel = () => {
  if (permissions.includes(PERMISSIONS.SUPER_ADMIN)) return "Panneau SuperAdmin";
  if (permissions.includes(PERMISSIONS.DASHBOARD_VIEW)) return "Panneau Admin";
  return "Panneau utilisateur";
};

  const isLoggedIn = permissions.length > 0;

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{getPanelLabel()}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {!isLoggedIn ? (
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">
              <User className="h-4 w-4 mr-2" />
              Se connecter
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? "Déconnexion en cours..." : "Se déconnecter"}
          </Button>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
