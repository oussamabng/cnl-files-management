import { cookies } from "next/headers";

export async function isAdmin() {
  const cookie = (await cookies()).get("auth_token");
  return cookie?.value === "admin";
}
