import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { UserWithRolesAndPermissions } from "@/types/authorization";

const JWT_SECRET = process.env.JWT_SECRET as string || "your-jwt-secret";

export async function getSessionUser(): Promise<UserWithRolesAndPermissions | null> {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return user as UserWithRolesAndPermissions;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}
