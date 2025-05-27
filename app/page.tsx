import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const role = (await cookies()).get("auth_token")?.value;

  if (role === "admin") {
    redirect("/dashboard");
  } else if (role === "utilisateur") {
    redirect("/dashboard/files");
  } else {
    redirect("/login");
  }
}
