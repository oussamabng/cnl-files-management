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

  console.log("Permissions seeded");
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

  console.log(`Role "${name}" seeded with ${permissions.length} permissions`);
  return role;
}

async function seedUsers(superAdminRoleId: number) {
  const adminEmail = (process.env.ADMIN_EMAIL as string) || "admin@example.com";
  const adminPassword = await bcrypt.hash(
    (process.env.ADMIN_PASS as string) || "Admin#123",
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
  console.log("ADMIN seeded");
}
async function seedChatRoomsBetweenUsers() {
  const users = await prisma.user.findMany();
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const userA = users[i];
      const userB = users[j];

      await prisma.chatRoom.create({
        data: {
          name: `Chat between ${userA.email} and ${userB.email}`,
          participants: {
            connect: [{ id: userA.id }, { id: userB.id }],
          },
        },
      });
    }
  }
}

async function main() {
  await seedPermissions();

  const allPermissions = Object.values(PERMISSIONS).filter(
    (p) => p !== PERMISSIONS.SUPER_ADMIN
  );

  const superAdmin = await seedRole("SUPERADMIN", allPermissions);

  await seedUsers(superAdmin.id);

  await seedChatRoomsBetweenUsers();
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
