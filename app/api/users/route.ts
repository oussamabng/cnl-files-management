import { requireApiPermission } from "@/lib/auth/session/requireApiPermission";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth/session/create-user";

export async function GET(req: Request) {
  try {
    const auth = await requireApiPermission(PERMISSIONS.USERS_VIEW);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error, message: auth.message, success: false },
        { status: auth.status }
      );
    }

    const url = new URL(req.url);

    const pageIndex = clamp(
      toInt(url.searchParams.get("pageIndex"), 0),
      0,
      1_000_000
    );
    const pageSize = clamp(toInt(url.searchParams.get("pageSize"), 10), 1, 100);

    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortDir =
      (url.searchParams.get("sortDir") || "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";

    const allowedSortBy = new Set([
      "firstName",
      "lastName",
      "email",
      "createdAt",
    ]);
    const effectiveSortBy = allowedSortBy.has(sortBy) ? sortBy : "createdAt";

    const qRaw = (url.searchParams.get("q") || "").trim();
    const q = qRaw.length ? qRaw : null;

    const roleIds = parseCsvInts(url.searchParams.get("roleIds"));

    const where: any = {
      AND: [
        {
          NOT: {
            userRoles: {
              some: {
                role: { name: "SUPERADMIN" },
              },
            },
          },
        },
      ],
    };

    if (q) {
      where.AND.push({
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    if (roleIds.length) {
      where.AND.push({
        userRoles: {
          some: {
            roleId: { in: roleIds },
          },
        },
      });
    }

    const skip = pageIndex * pageSize;
    const take = pageSize;

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: { include: { permission: true } },
                },
              },
            },
          },
        },
        orderBy: { [effectiveSortBy]: sortDir } as any,
        skip,
        take,
      }),
    ]);

    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      success: true,
      data: users,
      meta: { pageIndex, pageSize, total, pageCount },
      stats: { totalUsers: total },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur interne du serveur", success: false },
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

    if (!user) {
      return NextResponse.json({
        message: "User already exists",
        status: false,
      });
    }

    const otherUsers = await prisma.user.findMany({
      where: {
        id: {
          not: user.id,
        },
      },
    });

    await Promise.all(
      otherUsers.map((otherUser) =>
        prisma.chatRoom.create({
          data: {
            name: `Chat between ${user.firstName} and ${otherUser.firstName}`,
            participants: {
              connect: [{ id: user.id }, { id: otherUser.id }],
            },
          },
        })
      )
    );

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("User registration failed:", error);
    return NextResponse.json(
      { error: "User creation failed" },
      { status: 500 }
    );
  }
}

function toInt(v: string | null, fallback: number) {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseCsvInts(v: string | null) {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => Number.parseInt(x.trim(), 10))
    .filter((x) => Number.isFinite(x));
}
