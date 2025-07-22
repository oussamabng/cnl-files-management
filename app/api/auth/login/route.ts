import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, loginType } = body

    // Handle guest login
    if (loginType === "utilisateur" && !email && !password) {
      // Create a guest token
      const guestToken = jwt.sign({ userId: "guest", role: "UTILISATEUR" }, JWT_SECRET, { expiresIn: "24h" })
      ;(await cookies()).set("auth_token", guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      })

      return NextResponse.json({ success: true, role: "UTILISATEUR" })
    }

    // Handle admin login with hardcoded credentials
    if (loginType === "admin") {
      if (email === "admin@example.com" && password === "admin123") {
        const adminToken = jwt.sign({ userId: "admin", role: "ADMIN" }, JWT_SECRET, { expiresIn: "24h" })
        ;(await cookies()).set("auth_token", adminToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24, // 24 hours
        })

        return NextResponse.json({ success: true, role: "ADMIN" })
      }
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
    }

    // Handle regular user login
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
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
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id, role: user.userRoles[0]?.role.name || "UTILISATEUR" }, JWT_SECRET, {
      expiresIn: "24h",
    })
    ;(await cookies()).set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return NextResponse.json({
      success: true,
      role: user.userRoles[0]?.role.name || "UTILISATEUR",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
