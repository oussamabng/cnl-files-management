import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type CreateUserArgs = Omit<Prisma.UserCreateInput, "password" | "userRoles"> & {
  password: string;
  userRoles?: Prisma.UserCreateInput["userRoles"];
};

export async function createUser({
  email,
  password,
  firstName,
  lastName,
  userRoles,
}: CreateUserArgs) {
  const existingUser = await prisma.user.findFirst({ where: { email } });

  if(existingUser) return null;
  const hashedPassword = await bcrypt.hash(password, 10);

  const finalUserRoles = userRoles ?? {
    create: [
      {
        role: {
          connectOrCreate: {
            where: { name: "REGULARUSER" },
            create: { name: "REGULARUSER" },
          },
        },
      },
    ],
  };

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      userRoles: finalUserRoles,
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
