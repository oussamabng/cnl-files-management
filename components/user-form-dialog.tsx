"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Shield, Info } from "lucide-react";
import type { UserWithRolesAndPermissions } from "@/types/authorization";

type RoleWithPermissions = {
  name: string;
  id: number;
} & {
  permissions: {
    id: number;
    key: string;
    description: string;
  }[];
};

const formSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  roleIds: z.array(z.string()).min(1, "Au moins un rôle doit être sélectionné"),
});

type FormData = z.infer<typeof formSchema>;

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

function RolePermissionsTooltip({
  role,
  children,
}: RolePermissionsTooltipProps) {
  if (!role.permissions || role.permissions.length === 0) {
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
              Permissions ({role.permissions.length})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {role.permissions.map((permission) => (
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
  const hasPermissions = role.permissions && role.permissions.length > 0;

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
            {role.permissions.length} permission
            {role.permissions.length > 1 ? "s" : ""}
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

export function UserFormDialog({
  user,
  open,
  onOpenChange,
  availableRoles,
  onUserUpdated,
}: UserFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roleIds: [],
    },
  });

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        // Edit mode - populate form with user data
        form.reset({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email,
          password: "", // Always reset password for security
          roleIds: user.userRoles.map((ur) => ur.role.id.toString()),
        });
      } else {
        // Create mode - reset to empty form
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          roleIds: [],
        });
      }
      setError(null);
    }
  }, [open, user, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          roleIds: data.roleIds,
        }),
      });

      const result = await response.json();
      console.log(result);



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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mot de passe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
