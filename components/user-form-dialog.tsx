"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  Shield,
  Info,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Lock,
  Copy,
  Users,
} from "lucide-react";
import type { UserWithRolesAndPermissions } from "@/types/authorization";
import type { RoleWithPermissions } from "@/types/roles";
import { PERMISSIONS } from "@/lib/constants/permissions"; // Import PERMISSIONS

// Mock types - replace with your actual types
interface UserFormDialogProps {
  user: UserWithRolesAndPermissions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableRoles: RoleWithPermissions[];
  onUserUpdated: () => void;
}

interface RolePermissionsTooltipProps {
  role: RoleWithPermissions;
  children: React.ReactNode;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

function RolePermissionsTooltip({
  role,
  children,
}: RolePermissionsTooltipProps) {
  if (!role.rolePermissions || role.rolePermissions.length === 0) {
    return <>{children}</>;
  }

  // Group permissions by category for better organization
  const groupedPermissions = role.rolePermissions.reduce(
    (acc, { permission }) => {
      const category = permission.key.split("_")[0] || "OTHER";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const getCategoryName = (category: string) => {
    switch (category.toLowerCase()) {
      case "files":
        return "Fichiers";
      case "folders":
        return "Dossiers";
      case "users":
        return "Utilisateurs";
      case "roles":
        return "Rôles";
      case "dashboard":
        return "Tableau de bord";
      case "filters":
        return "Filtres";
      case "comments":
        return "Commentaires";
      case "admin":
        return "Administration";
      default:
        return category;
    }
  };

  const getPermissionActionLabel = (key: string) => {
    if (key.includes("VIEW")) return "Voir";
    if (key.includes("CREATE")) return "Créer";
    if (key.includes("UPDATE")) return "Modifier";
    if (key.includes("DELETE")) return "Supprimer";
    if (key.includes("UPLOAD")) return "Télécharger";
    if (key.includes("SUPER_ADMIN")) return "Super Admin";
    return "Accès";
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className="w-full">{children}</div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="max-w-sm p-0 z-50 border-0 shadow-xl bg-white dark:bg-gray-900 flex flex-col max-h-[90vh]" // Added flex-col and max-h
        sideOffset={8}
      >
        <div className="overflow-hidden rounded-lg flex flex-col flex-1">
          {" "}
          {/* Added flex-col and flex-1 */}
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  {role.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {role.rolePermissions.length} permission
                  {role.rolePermissions.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          {/* Content */}
          <ScrollArea className="flex-1">
            {" "}
            {/* Changed max-h-80 to flex-1 */}
            <div className="p-4 space-y-4">
              {Object.entries(groupedPermissions).map(
                ([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2 pb-2">
                      <h5 className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                        {getCategoryName(category)}
                      </h5>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="space-y-1.5">
                      {permissions.map((permission) => {
                        const actionLabel = getPermissionActionLabel(
                          permission.key
                        );
                        return (
                          <div
                            key={permission.id}
                            className="flex items-center gap-2.5 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium text-foreground">
                                  {actionLabel}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  sur
                                </span>
                                <span className="text-xs text-foreground truncate">
                                  {getCategoryName(category)}
                                </span>
                              </div>
                              {permission.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </ScrollArea>
          {/* Footer */}
          <div className="px-4 py-2 bg-muted/20 border-t flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  Permissions actives
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {role.rolePermissions.length}
              </Badge>
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface RoleCheckboxItemProps {
  role: RoleWithPermissions;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  allSelectedPermissions: Set<string>; // New prop to pass all currently selected permissions
}

function RoleCheckboxItem({
  role,
  isChecked,
  onCheckedChange,
  allSelectedPermissions,
}: RoleCheckboxItemProps) {
  const hasPermissions =
    role.rolePermissions && role.rolePermissions.length > 0;

  // Determine if this specific role grants USERS_CREATE
  const grantsUsersCreate = role.rolePermissions.some(
    (rp) => rp.permission.key === PERMISSIONS.USERS_CREATE
  );

  // Check if ROLES_VIEW is globally selected (across all currently chosen roles)
  const hasRolesViewGlobally = allSelectedPermissions.has(
    PERMISSIONS.ROLES_VIEW
  );

  // Disable if this role grants USERS_CREATE AND ROLES_VIEW is NOT globally selected,
  // AND this role itself does NOT grant ROLES_VIEW (to avoid disabling if ROLES_VIEW is part of this role)
  const isDisabled =
    grantsUsersCreate &&
    !hasRolesViewGlobally &&
    !role.rolePermissions.some(
      (rp) => rp.permission.key === PERMISSIONS.ROLES_VIEW
    );

  const checkboxContent = (
    <FormItem
      className={`flex flex-row items-start space-x-3 space-y-0 p-3 rounded-lg border transition-all duration-200 w-full group ${
        isDisabled
          ? "opacity-50 cursor-not-allowed bg-muted/20"
          : "hover:bg-muted/30 cursor-pointer"
      }`}
    >
      <FormControl>
        <Checkbox
          checked={isChecked}
          onCheckedChange={onCheckedChange}
          className="mt-0.5"
          disabled={isDisabled} // Apply disabled prop
        />
      </FormControl>
      <div className="flex-1 space-y-1.5 leading-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FormLabel
              className={`text-sm font-medium ${
                isDisabled
                  ? "cursor-not-allowed"
                  : "cursor-pointer group-hover:text-primary transition-colors"
              }`}
            >
              {role.name}
            </FormLabel>
            {hasPermissions && (
              <div className="flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-xs text-muted-foreground">Détails</span>
              </div>
            )}
          </div>
        </div>
        {hasPermissions && (
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {role.rolePermissions?.length} permission
              {role.rolePermissions && role.rolePermissions.length > 1
                ? "s"
                : ""}{" "}
              assignée
              {role.rolePermissions && role.rolePermissions.length > 1
                ? "s"
                : ""}
            </p>
          </div>
        )}
        {role.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {role.description}
          </p>
        )}
        {isDisabled && (
          <p className="text-xs text-red-500 mt-1">
            Nécessite la permission 'Voir les rôles' pour attribuer la création
            d'utilisateurs.
          </p>
        )}
      </div>
    </FormItem>
  );

  if (hasPermissions) {
    return (
      <RolePermissionsTooltip role={role}>
        {checkboxContent}
      </RolePermissionsTooltip>
    );
  }

  return checkboxContent;
}

function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // For passwords with minimum 8 characters, we prioritize length and uppercase as main requirements
  let score = 0;
  if (requirements.length) score += 2; // Length is worth 2 points
  if (requirements.uppercase) score += 2; // Uppercase is worth 2 points (required)
  if (requirements.lowercase) score += 1;
  if (requirements.number) score += 1;
  if (requirements.special) score += 1;

  // Normalize score to 0-5 scale
  const normalizedScore = Math.min(5, score);

  let label = "";
  let color = "";

  switch (normalizedScore) {
    case 0:
    case 1:
      label = "Très faible";
      color = "bg-red-500";
      break;
    case 2:
      label = "Faible";
      color = "bg-orange-500";
      break;
    case 3:
      label = "Moyen";
      color = "bg-yellow-500";
      break;
    case 4:
      label = "Fort";
      color = "bg-blue-500";
      break;
    case 5:
      label = "Très fort";
      color = "bg-green-500";
      break;
  }

  return { score: normalizedScore, label, color, requirements };
}

function generatePassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = '!@#$%^&*(),.?":{}|<>';
  const allChars = lowercase + uppercase + numbers + special;

  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];

  for (let i = 1; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

interface PasswordFieldProps {
  field: any;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  loading: boolean;
  isEdit: boolean;
  onGenerate: (password: string) => void;
  onCopy: (password: string) => void;
  copySuccess: boolean;
}

function PasswordField({
  field,
  showPassword,
  setShowPassword,
  loading,
  isEdit,
  onGenerate,
  onCopy,
  copySuccess,
}: PasswordFieldProps) {
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(field.value || ""),
    [field.value]
  );

  const handleGenerate = () => {
    const newPassword = generatePassword();
    onGenerate(newPassword);
  };

  return (
    <FormItem>
      <FormLabel className="flex items-center gap-2">
        <Lock className="h-4 w-4" />
        Mot de passe
        {isEdit && (
          <span className="text-xs text-muted-foreground font-normal">
            (Laissez vide pour conserver le mot de passe actuel)
          </span>
        )}
      </FormLabel>
      <FormControl>
        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={
                isEdit ? "Nouveau mot de passe (optionnel)" : "Mot de passe"
              }
              {...field}
              className="pr-28"
            />
            <div className="absolute right-1 top-1 flex gap-1">
              {field.value && field.value.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 transition-colors ${
                        copySuccess ? "text-green-600 bg-green-50" : ""
                      }`}
                      onClick={() => onCopy(field.value)}
                      disabled={loading}
                    >
                      {copySuccess ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {copySuccess ? "Copié!" : "Copier le mot de passe"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {copySuccess
                        ? "Copié dans le presse-papiers!"
                        : "Copier le mot de passe"}
                    </p>
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
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Générer un mot de passe</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Générer un mot de passe sécurisé</p>
                </TooltipContent>
              </Tooltip>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"}
                </span>
              </Button>
            </div>
          </div>
          {field.value && field.value.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Progress
                  value={(passwordStrength.score / 5) * 100}
                  className="flex-1 h-2"
                />
                <span className="text-xs font-medium min-w-fit">
                  {passwordStrength.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
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
      </FormControl>
      <FormMessage />
    </FormItem>
  );
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

  const formSchema = z
    .object({
      firstName: z.string().min(1, "Le prénom est requis"),
      lastName: z.string().min(1, "Le nom est requis"),
      email: z.string().email("Email invalide"),
      password: user
        ? z
            .string()
            .min(8, "Le mot de passe doit contenir au moins 8 caractères")
            .regex(
              /[A-Z]/,
              "Le mot de passe doit contenir au moins une majuscule"
            )
            .or(z.literal(""))
        : z
            .string()
            .min(8, "Le mot de passe doit contenir au moins 8 caractères")
            .regex(
              /[A-Z]/,
              "Le mot de passe doit contenir au moins une majuscule"
            ),
      confirmPassword: user
        ? z.string().optional()
        : z.string().min(1, "Veuillez confirmer le mot de passe"),
      roleIds: z
        .array(z.string())
        .min(1, "Au moins un rôle doit être sélectionné"),
    })
    .refine(
      (data) => {
        if (!user) {
          return data.password === data.confirmPassword;
        }
        if (data.password && data.password.length > 0) {
          return data.password === data.confirmPassword;
        }
        return true;
      },
      {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
      }
    )
    .refine(
      (data) => {
        const selectedRoleObjects = availableRoles.filter((role) =>
          data.roleIds.includes(role.id.toString())
        );

        const allSelectedPermissions = new Set<string>();
        selectedRoleObjects.forEach((role) => {
          role.rolePermissions.forEach((rp) => {
            allSelectedPermissions.add(rp.permission.key);
          });
        });

        // Validation: ROLES_CREATE/UPDATE/DELETE require ROLES_VIEW
        const dependentRoleManagementPermissions = [
          PERMISSIONS.ROLES_CREATE,
          PERMISSIONS.ROLES_UPDATE,
          PERMISSIONS.ROLES_DELETE,
        ];
        const requiresRolesViewForRoleManagement =
          dependentRoleManagementPermissions.some((depPerm) =>
            allSelectedPermissions.has(depPerm)
          );

        if (
          requiresRolesViewForRoleManagement &&
          !allSelectedPermissions.has(PERMISSIONS.ROLES_VIEW)
        ) {
          return false; // Fails if role management permissions are selected without ROLES_VIEW
        }

        // New validation: USERS_CREATE requires ROLES_VIEW
        const requiresRolesViewForUserCreation = allSelectedPermissions.has(
          PERMISSIONS.USERS_CREATE
        );
        if (
          requiresRolesViewForUserCreation &&
          !allSelectedPermissions.has(PERMISSIONS.ROLES_VIEW)
        ) {
          return false; // Fails if USERS_CREATE is selected without ROLES_VIEW
        }

        return true; // All checks passed
      },
      {
        message:
          "Les permissions de création, modification ou suppression de rôles nécessitent la permission de 'Voir les rôles'. De plus, la permission de 'Créer des utilisateurs' nécessite également la permission de 'Voir les rôles'.",
        path: ["roleIds"], // Attach error to roleIds field
      }
    );

  type FormData = z.infer<typeof formSchema>;

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

  useEffect(() => {
    if (open) {
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
    }
  }, [open, user, form]);

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

      if (!result.success)
        throw new Error(result.message || "Une erreur est survenue");

      onUserUpdated();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    const currentRoles = form.getValues("roleIds");
    if (checked) {
      form.setValue("roleIds", [...currentRoles, roleId]);
    } else {
      form.setValue(
        "roleIds",
        currentRoles.filter((id) => id !== roleId)
      );
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy password:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handlePasswordGenerate = (password: string) => {
    form.setValue("password", password);
    form.setValue("confirmPassword", password);
  };

  // Calculate all currently selected permissions based on the form's roleIds
  const allSelectedPermissions = useMemo(() => {
    const permissionsSet = new Set<string>();
    const currentRoleIds = form.watch("roleIds");
    currentRoleIds.forEach((roleId) => {
      const role = availableRoles.find((r) => r.id.toString() === roleId);
      if (role) {
        role.rolePermissions.forEach((rp) =>
          permissionsSet.add(rp.permission.key)
        );
      }
    });
    return permissionsSet;
  }, [form.watch("roleIds"), availableRoles]); // Re-calculate when roleIds change

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <TooltipProvider>
          <DialogHeader>
            <DialogTitle>
              {user ? "Modifier l'utilisateur" : "Créer un utilisateur"}
            </DialogTitle>
            <DialogDescription>
              {user
                ? "Modifiez les informations de l'utilisateur ci-dessous."
                : "Remplissez les informations pour créer un nouvel utilisateur."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemple.com"
                        {...field}
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
                  <PasswordField
                    field={field}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    loading={loading}
                    isEdit={!!user}
                    onGenerate={handlePasswordGenerate}
                    onCopy={copyToClipboard}
                    copySuccess={copySuccess}
                  />
                )}
              />

              {(!user ||
                (form.watch("password") &&
                  form.watch("password").length > 0)) && (
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmer le mot de passe"
                            {...field}
                            className="pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-8 w-8 p-0"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="roleIds"
                render={() => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Rôles
                    </FormLabel>
                    <ScrollArea className="max-h-60 border rounded-lg p-2">
                      <div className="space-y-2">
                        {availableRoles.map((role) => (
                          <FormField
                            key={role.id}
                            control={form.control}
                            name="roleIds"
                            render={({ field }) => (
                              <RoleCheckboxItem
                                role={role}
                                isChecked={
                                  field.value?.includes(role.id.toString()) ||
                                  false
                                }
                                onCheckedChange={(checked) =>
                                  handleRoleChange(role.id.toString(), checked)
                                }
                                allSelectedPermissions={allSelectedPermissions} // Pass all selected permissions
                              />
                            )}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {user ? "Modifier" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
