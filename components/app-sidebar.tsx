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

interface AppSidebarProps {
  role: string;
}

export function AppSidebar({ role }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  const menuItems = [
    ...(role === "admin"
      ? [
          {
            title: "Tableau de bord",
            url: "/dashboard",
            icon: LayoutDashboard,
          },
        ]
      : []),
    ...(role === "admin"
      ? [
          {
            title: "Gestion des dossiers",
            url: "/dashboard/folders",
            icon: Folder,
          },
          {
            title: "Gestion des filtres",
            url: "/dashboard/filters",
            icon: Filter,
          },
        ]
      : []),
    {
      title: "Gestion des fichiers",
      url: "/dashboard/files",
      icon: FileText,
    },
  ];

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (url === "/dashboard/files") {
      return (
        pathname.startsWith(url) ||
        (role === "utilisateur" && pathname === "/dashboard")
      );
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {role === "admin" ? "Panneau Admin" : "Panneau utilisateur"}
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
                <SidebarMenuItem key={item.title}>
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
        {role === "utilisateur" ? (
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
