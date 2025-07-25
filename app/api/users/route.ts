import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth/session/create-user";

export async function GET(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.USERS_VIEW);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }

    const users = await prisma.user.findMany({
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

    if (!users)
      return NextResponse.json({ status: 404, message: "Aucun utilisateur" });

    return NextResponse.json({ status: 200, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal session error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const response = await requireApiPermission(PERMISSIONS.USERS_CREATE);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error, message: response.message },
        { status: response.status }
      );
    }
    const { email, password, firstName, lastName, roleIds } = await req.json();

    const userRoles = roleIds?.map((id: string | number) => ({
      role: {
        connect: { id: Number(id) },
      },
    }));

    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      userRoles: { create: userRoles },
    });

    if (!user)
      return NextResponse.json({
        message: "User already exists",
        status: false,
      });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("User registration failed:", error);
    return NextResponse.json(
      { error: "User creation failed" },
      { status: 500 }
    );
  }
}
