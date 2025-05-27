"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  (await cookies()).delete("auth_token");
  redirect("/login");
}
