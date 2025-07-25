"use client"

import { Button } from "@/components/ui/button"
import { UserWithRolesAndPermissions } from "@/types/authorization"
import { LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface UnauthorizedActionsProps {
  user: UserWithRolesAndPermissions | null
}

export function UnauthorizedActions({ user }: UnauthorizedActionsProps) {
    const [isLoggingOut,setIsLoggingOut] = useState(false)
    const router = useRouter()
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

  return (
    <>
      {user ? (
        <>
          <Button asChild className="w-full">
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
          <span className="text-muted-foreground">OU</span>
          <Button variant="outline" className="w-full bg-transparent" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </>
      ) : (
        <Button asChild className="w-full">
          <Link href="/login">Se connecter</Link>
        </Button>
      )}
    </>
  )
}
