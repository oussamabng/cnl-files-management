import { PrismaClient } from "../lib/generated/prisma";
import { PERMISSIONS, PERMISSION_GROUPS } from "../lib/constants/permissions";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedPermissions() {
  const permissionValues = Object.values(PERMISSIONS);

  for (const key of permissionValues) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: {
        key,
        description: key.replace(/_/g, " ").toLowerCase(),
      },
    });
  }

  console.log("✅ Permissions seeded");
}

async function seedRole(name: string, permissionKeys: string[]) {
  const role = await prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  const permissions = await prisma.permission.findMany({
    where: { key: { in: permissionKeys } },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  console.log(
    `✅ Role "${name}" seeded with ${permissions.length} permissions`
  );
  return role;
}

async function seedUsers(superAdminRoleId: number, regularUserRoleId: number) {
  const adminEmail = (process.env.ADMIN_EMAIL as string) || "admin@example.com";
  const regularUserEmail =
    (process.env.USER_EMAIL as string) || "user@example.com";

  const adminPassword = await bcrypt.hash(
    (process.env.ADMIN_PASS as string) || "Admin#123",
    10
  );
  const userPassword = await bcrypt.hash(
    (process.env.USER_PASS as string) || "User#123",
    10
  );

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      firstName: "Admin",
      lastName: "Root",
      userRoles: {
        create: {
          roleId: superAdminRoleId,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: regularUserEmail },
    update: {},
    create: {
      email: regularUserEmail,
      password: userPassword,
      firstName: "Regular",
      lastName: "User",
      userRoles: {
        create: {
          roleId: regularUserRoleId,
        },
      },
    },
  });

  console.log("✅ Admin and regular user seeded");
}

async function main() {
  await seedPermissions();

  const allPermissions = Object.values(PERMISSIONS).filter(
    (p) => p !== PERMISSIONS.SUPER_ADMIN
  );

  const regularUserPermissions = Object.values(PERMISSION_GROUPS)
    .map((group) => group.find((p) => p.endsWith("_VIEW")))
    .filter(Boolean) as string[];

  regularUserPermissions.push(
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FILES_UPLOAD
  );

  const superAdmin = await seedRole("SUPERADMIN", allPermissions);
  const regularUser = await seedRole("REGULARUSER", regularUserPermissions);

  await seedUsers(superAdmin.id, regularUser.id);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
