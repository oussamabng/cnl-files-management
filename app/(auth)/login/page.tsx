import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session/getUserSession";
import LoginPage from "./_components/login-form";

export default async function LoginPageServerWrapper() {
  const user = await getSessionUser();

  if (user) {
    redirect("/");
  }

  return <LoginPage />;
}
