// app/api/register/route.ts
import { createUser } from "@/lib/auth/server/create-user";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password, firstName, lastName } = await req.json();
  try {
    const user = await createUser({email, password, firstName, lastName});
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "User creation failed" }, { status: 500 });
  }
}
