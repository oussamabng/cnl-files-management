"use client";

import {
  FileText,
  Filter,
  LogOut,
  User,
  LayoutDashboard,
  Folder,
  UsersIcon,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

import { PERMISSIONS, PermissionValue } from "@/lib/constants/permissions";
import { UserWithRolesAndPermissions } from "@/types/authorization";
import { getUserPermissions } from "@/lib/auth/client/getUserPermissions";
import { getUserName } from "@/lib/utils";

interface AppSidebarProps {
  user: UserWithRolesAndPermissions;
}

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [permissions, setPermissions] = useState<PermissionValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchPermissions = () => {
      const userPermissions = getUserPermissions(user);
      setPermissions(userPermissions);
      setLoading(false);
    };
    fetchPermissions();
  }, [user]);

  useEffect(() => {
    const userRoles = user.userRoles.map((r) => r.role.name);
    console.log(user.userRoles);

    setRoles(userRoles);
  }, [user]);

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
    permissions.includes(PERMISSIONS.FOLDERS_VIEW) && {
      title: "Gestion des dossiers",
      url: "/dashboard/folders",
      icon: Folder,
    },
    permissions.includes(PERMISSIONS.FILTERS_VIEW) && {
      title: "Gestion des filtres",
      url: "/dashboard/filters",
      icon: Filter,
    },
    permissions.includes(PERMISSIONS.FILES_VIEW) && {
      title: "Gestion des fichiers",
      url: "/dashboard/files",
      icon: FileText,
    },
    permissions.includes(PERMISSIONS.USERS_VIEW) && {
      title: "Gestion des utilisateurs",
      url: "/dashboard/users",
      icon: UsersIcon,
    },
    permissions.includes(PERMISSIONS.ROLES_VIEW) && {
      title: "Gestion des roles",
      url: "/dashboard/roles",
      icon: Crown,
    },
    permissions.includes(PERMISSIONS.CHAT_VIEW) && {
      title: "chats",
      url: "/dashboard/chat",
      icon: Crown,
    },
  ];

  const menuItems: MenuItem[] = rawMenuItems.filter((item): item is MenuItem =>
    Boolean(item)
  );

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url);
  };

  const isLoggedIn = permissions.length > 0;

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <User className="h-5 w-5" />
          </div>
          <div className="flex flex-col justify-center space-y-0.5 truncate">
            <p className="text-xs uppercase text-muted-foreground flex-wrap">
              {roles.join(", ")}
            </p>
            <p className="text-lg font-bold truncate capitalize leading-tight">
              {getUserName({
                firstName: user.firstName,
                lastName: user.lastName,
              })}
            </p>
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
