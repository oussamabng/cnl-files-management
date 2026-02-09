/* eslint-disable no-console */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect" },
        { status: 401 },
      );
    }

    const token = jwt.sign(
      { userId: user.id, role: user.userRoles[0]?.role.name },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // ✅ HTTP-only usage: cookie MUST be non-secure, otherwise it won't be stored/sent
    (await cookies()).set("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 90 days
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
