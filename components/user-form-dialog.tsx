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
} from "lucide-react";
import { UserWithRolesAndPermissions } from "@/types/authorization";
import { RoleWithPermissions } from "@/types/roles";

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

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <div className="w-full">{children}</div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs p-0 z-50" sideOffset={5}>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">{role.name}</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground mb-2">
              Permissions ({role.rolePermissions.length})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {role.rolePermissions.map(({ permission }) => (
                <div
                  key={permission.id}
                  className="flex flex-col gap-1 p-2 rounded-sm bg-muted/50"
                >
                  <span className="text-xs font-medium text-foreground">
                    {permission.key}
                  </span>
                  {permission.description && (
                    <span className="text-xs text-muted-foreground">
                      {permission.description}
                    </span>
                  )}
                </div>
              ))}
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
}

function RoleCheckboxItem({
  role,
  isChecked,
  onCheckedChange,
}: RoleCheckboxItemProps) {
  const hasPermissions =
    role.rolePermissions && role.rolePermissions.length > 0;

  const checkboxContent = (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer w-full">
      <FormControl>
        <Checkbox checked={isChecked} onCheckedChange={onCheckedChange} />
      </FormControl>
      <div className="flex-1 space-y-1 leading-none">
        <div className="flex items-center gap-2">
          <FormLabel className="text-sm font-normal cursor-pointer">
            {role.name}
          </FormLabel>
          {hasPermissions && <Info className="h-3 w-3 text-muted-foreground" />}
        </div>
        {hasPermissions && (
          <p className="text-xs text-muted-foreground">
            {role.rolePermissions?.length} permission
            {role.rolePermissions && role.rolePermissions.length > 1 ? "s" : ""}
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Rôles</FormLabel>
                    <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
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
                            />
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
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
