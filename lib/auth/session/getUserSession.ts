import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { UserWithRolesAndPermissions } from "@/types/authorization";
import { ROLES } from "@/lib/constants/roles";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";

export async function getSessionUser(): Promise<UserWithRolesAndPermissions | null> {
  try {
    // 🧩 Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    // 🔒 Defensive check before verifying
    if (!token || typeof token !== "string" || !token.includes(".")) {
      console.warn("Invalid or missing auth_token:", token);
      return null;
    }

    // 🔐 Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      isViewer?: boolean;
    };

    if (typeof decoded !== "object" || !decoded) {
      console.warn("Decoded token is invalid:", decoded);
      return null;
    }

    // 👤 Handle guest/viewer user
    if (decoded.isViewer) {
      const viewerRole = await prisma.role.findFirst({});

      if (!viewerRole) {
        console.warn("Viewer role not found in database");
        return null;
      }

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

    // 🧭 Validate userId presence
    if (!decoded.userId) {
      console.warn("Token does not contain userId");
      return null;
    }

    // 🧱 Fetch user with roles and permissions
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

    if (!user) {
      console.warn("No user found for id:", decoded.userId);
      return null;
    }

    return user as UserWithRolesAndPermissions;
  } catch (err) {
    // 🩹 Catch specific JWT errors
    if (err instanceof jwt.TokenExpiredError) {
      console.warn("JWT expired");
    } else if (err instanceof jwt.JsonWebTokenError) {
      console.warn("Invalid JWT:", err.message);
    } else {
      console.error("Unexpected error verifying JWT:", err);
    }
    return null;
  }
}
