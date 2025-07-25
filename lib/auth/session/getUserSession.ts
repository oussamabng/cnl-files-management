import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { UserWithRolesAndPermissions } from "@/types/authorization";
import { ROLES } from "@/lib/constants/roles";
import { RoleValue } from "../../constants/roles";

const JWT_SECRET = (process.env.JWT_SECRET as string) || "your-jwt-secret";

export async function getSessionUser(): Promise<UserWithRolesAndPermissions | null> {
  console.log("fetching user session");

  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      isViewer?: boolean;
    };
    console.log("decoded",decoded);

    if (decoded.isViewer) {
      const viewerRole = await prisma.role.findFirst();

      if (!viewerRole) return null;

      return {
        id: "guest",
        email: "guest@example.com",
        firstName: "Viewer",
        lastName: "Guest",
        userRoles: [
          {
            role: viewerRole,
            roleId: viewerRole.id,
            userId: "guest",
          },
        ],
      } as UserWithRolesAndPermissions;
    }

    if (!decoded.userId) return null;

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
