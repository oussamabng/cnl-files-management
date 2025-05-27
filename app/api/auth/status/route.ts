import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const role = (await cookies()).get("auth_token")?.value;

    if (!role) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({ role });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
