import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldOff } from "lucide-react"
import { getSessionUser } from "@/lib/auth/session/getUserSession"
import { UnauthorizedActions } from "@/components/unauthorized-actions"

export default async function UnauthorizedPage() {
  const user = await getSessionUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <ShieldOff className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold">Accès non autorisé</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Vous n'avez pas la permission d'accéder à cette page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UnauthorizedActions user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
