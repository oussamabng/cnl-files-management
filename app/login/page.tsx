/* eslint-disable react/no-unescaped-entities */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";

const loginSchema = z.object({
  email: z.string().min(1, { message: "Email ou Nom requis" }),
  password: z.string().min(1, { message: "Mot de passe requis" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/status");
        if (response.ok) {
          const data = await response.json();
          setCurrentRole(data.role);
        }
      } catch {
        setCurrentRole(null);
      }
    };
    checkAuth();
  }, []);

  const onSubmit = async (values: LoginFormValues) => {
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Identifiants invalides");
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleutilisateurLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/utilisateur", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Échec de la connexion en tant qu'utilisateur");
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {currentRole === "utilisateur"
              ? "Passer en administrateur"
              : "Connexion administrateur"}
          </CardTitle>
          <CardDescription className="text-center">
            {currentRole === "utilisateur"
              ? "Entrez les identifiants administrateur pour passer à un accès supérieur"
              : "Entrez vos identifiants pour accéder au panneau d’administration"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentRole === "utilisateur" && (
            <Alert className="mb-4">
              <AlertDescription>
                Vous êtes actuellement connecté en tant qu'utilisateur. Entrez
                les identifiants administrateur ci-dessous pour passer à un
                accès supérieur.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email administrateur</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin@cnl.app"
                        {...field}
                        disabled={isLoading}
                        autoComplete="additional-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Votre mot de passe"
                        {...field}
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loading variant="spinner" size="sm" text="Connexion..." />
                ) : currentRole === "utilisateur" ? (
                  "Passer en administrateur"
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </Form>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!currentRole && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleutilisateurLogin}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loading variant="spinner" size="sm" text="Connexion..." />
                ) : (
                  "Continuer en tant qu'utilisateur"
                )}
              </Button>
            </>
          )}

          {currentRole === "utilisateur" && (
            <Button
              variant="outline"
              onClick={handleBackToDashboard}
              className="w-full"
              disabled={isLoading}
            >
              Retour au tableau de bord
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
