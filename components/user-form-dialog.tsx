"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

import type { UserWithRolesAndPermissions } from "@/types/authorization";
import type { RoleWithPermissions } from "@/types/roles";

import { FormField, type SelectOption } from "@/components/ui/form-field";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { calculatePasswordStrength } from "@/lib/utils";
import { RolePermissionsTooltip } from "./role-permissions-tooltip";
import { buildUserFormSchema } from "@/lib/validation/user-form.schema";

interface UserFormDialogProps {
  user: UserWithRolesAndPermissions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableRoles: RoleWithPermissions[];
  onUserUpdated: () => void;
}

// Local utils (keep here or move to "@/lib/utils/password.utils")
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

function generateSecurePassword(length = 14): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";

  const cryptoObj = window.crypto || (window as any).msCrypto;
  const randomValues = new Uint32Array(length);
  cryptoObj.getRandomValues(randomValues);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}

export function UserFormDialog({
  user,
  open,
  onOpenChange,
  availableRoles,
  onUserUpdated,
}: UserFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const formSchema = useMemo(
    () => buildUserFormSchema(Boolean(user), availableRoles),
    [user, availableRoles]
  );

  type FormData = z.infer<ReturnType<typeof buildUserFormSchema>>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      roleIds: [],
    },
  });

  const roleOptions = useMemo<SelectOption<RoleWithPermissions>[]>(() => {
    return availableRoles.map((role) => ({
      label: role.name,
      value: role.id.toString(),
      meta: role,
    }));
  }, [availableRoles]);

  useEffect(() => {
    if (!open) return;

    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        password: "",
        confirmPassword: "",
        roleIds: user.userRoles.map((ur) => ur.role.id.toString()),
      });
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        roleIds: [],
      });
    }

    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCopySuccess(false);
  }, [open, user, form]);

  const passwordValue = form.watch("password") || "";
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(passwordValue),
    [passwordValue]
  );

  const handleCopyPassword = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (!ok) return;

    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePasswordGenerate = () => {
    const password = generateSecurePassword();
    form.setValue("password", password, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("confirmPassword", password, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PUT" : "POST";

      const payload: Partial<FormData> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        roleIds: data.roleIds,
      };

      if (data.password && data.password.length > 0) {
        payload.password = data.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Une erreur est survenue");
      }

      onUserUpdated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] overflow-hidden p-0 sm:max-w-3xl">
        <TooltipProvider>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex max-h-[90vh] min-h-0 flex-col"
            >
              <div className="border-b px-6 py-5">
                <DialogHeader className="space-y-2">
                  <DialogTitle>
                    {user ? "Modifier l'utilisateur" : "Créer un utilisateur"}
                  </DialogTitle>
                  <DialogDescription>
                    {user
                      ? "Modifiez les informations de l'utilisateur ci-dessous."
                      : "Remplissez les informations pour créer un nouvel utilisateur."}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <ScrollArea className="min-h-0 flex-1 px-6 py-5">
                <div className="mx-auto w-full space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      type="text"
                      label="Prénom"
                      required
                      placeholder="Prénom"
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      type="text"
                      label="Nom"
                      required
                      placeholder="Nom"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    type="email"
                    label="Email"
                    required
                    placeholder="email@exemple.com"
                  />

                  {/* ✅ FIX: align items from top so password expansion doesn't vertically center confirm field */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 items-start">
                    {/* PASSWORD */}
                    <div className="flex flex-col">
                      <FormField
                        control={form.control}
                        name="password"
                        label={
                          <span className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Mot de passe{" "}
                            {user && (
                              <span className="text-xs font-normal text-muted-foreground">
                                (Laissez vide pour conserver l'actuel)
                              </span>
                            )}
                          </span>
                        }
                        render={({ field }) => (
                          <div className="space-y-3">
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder={
                                  user
                                    ? "Nouveau mot de passe (optionnel)"
                                    : "Mot de passe"
                                }
                                {...field}
                                value={(field.value as string) || ""}
                                className="pr-28"
                                disabled={loading}
                              />

                              <div className="absolute right-1 top-1 flex gap-1">
                                {(field.value as string)?.length > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className={`h-8 w-8 p-0 transition-colors ${
                                          copySuccess
                                            ? "bg-green-50 text-green-600"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          handleCopyPassword(
                                            field.value as string
                                          )
                                        }
                                        disabled={loading}
                                      >
                                        {copySuccess ? (
                                          <Check className="h-4 w-4" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                        <span className="sr-only">
                                          {copySuccess
                                            ? "Copié!"
                                            : "Copier le mot de passe"}
                                        </span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {copySuccess
                                        ? "Copié !"
                                        : "Copier le mot de passe"}
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={handlePasswordGenerate}
                                      disabled={loading}
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                      <span className="sr-only">Générer</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Générer un mot de passe sécurisé
                                  </TooltipContent>
                                </Tooltip>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setShowPassword((s) => !s)}
                                  disabled={loading}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">
                                    {showPassword ? "Masquer" : "Afficher"}
                                  </span>
                                </Button>
                              </div>
                            </div>

                            {(field.value as string)?.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={(passwordStrength.score / 5) * 100}
                                    className="h-2 flex-1"
                                  />
                                  <span className="min-w-fit text-xs font-medium">
                                    {passwordStrength.label}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                                  <div className="flex items-center gap-1">
                                    {passwordStrength.requirements.length ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <X className="h-3 w-3 text-red-500" />
                                    )}
                                    <span
                                      className={
                                        passwordStrength.requirements.length
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      8+ caractères
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {passwordStrength.requirements.uppercase ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <X className="h-3 w-3 text-red-500" />
                                    )}
                                    <span
                                      className={
                                        passwordStrength.requirements.uppercase
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      Majuscule (requis)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      />
                    </div>

                    {/* CONFIRM */}
                    {(!user || (passwordValue && passwordValue.length > 0)) && (
                      <div className="flex flex-col">
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          label="Confirmer le mot de passe"
                          render={({ field }) => (
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirmer le mot de passe"
                                {...field}
                                value={(field.value as string) || ""}
                                className="pr-12"
                                disabled={loading}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-8 w-8 p-0"
                                onClick={() =>
                                  setShowConfirmPassword((s) => !s)
                                }
                                disabled={loading}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {showConfirmPassword ? "Masquer" : "Afficher"}
                                </span>
                              </Button>
                            </div>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {/* ✅ ROLES FIELD (kept as-is) */}
                  <FormField<FormData, "roleIds", RoleWithPermissions>
                    control={form.control}
                    name="roleIds"
                    type="multiselect"
                    label={
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Rôles
                      </span>
                    }
                    required
                    options={roleOptions}
                    selectPlaceholder="Sélectionner des rôles"
                    searchPlaceholder="Rechercher un rôle..."
                    emptyText="Aucun rôle trouvé."
                    renderOption={(opt) => {
                      const role = opt.meta!;
                      const content = (
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm">
                                {opt.label}
                              </span>
                              {role.rolePermissions?.length ? (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Info className="h-3.5 w-3.5 text-primary/60" />
                                  Détails
                                </span>
                              ) : null}
                            </div>
                            {role.description ? (
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                {role.description}
                              </p>
                            ) : null}
                          </div>

                          {role.rolePermissions?.length ? (
                            <Badge variant="secondary" className="shrink-0">
                              {role.rolePermissions.length}
                            </Badge>
                          ) : null}
                        </div>
                      );

                      return role.rolePermissions?.length ? (
                        <RolePermissionsTooltip role={role}>
                          {content}
                        </RolePermissionsTooltip>
                      ) : (
                        content
                      );
                    }}
                    description="Sélectionnez un ou plusieurs rôles."
                  />

                  {error && (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t px-6 py-4">
                <DialogFooter className="flex-row justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Annuler
                  </Button>

                  <Button type="submit" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {user ? "Modifier" : "Créer"}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
