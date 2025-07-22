import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma, User } from "../generated/prisma";

export async function createUser({
  email,
  password,
  firstName,
  lastName,
}: Prisma.UserCreateInput) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const role = await prisma.role.upsert({
    where: { name: "REGULARUSER" },
    update: {},
    create: { name: "REGULARUSER" },
  });

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      userRoles: {
        create: {
          roleId: role.id,
        },
      },
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  return newUser;
}
