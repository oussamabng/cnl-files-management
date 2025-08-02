export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";").map((c) => c.trim());
  const tokenCookie = cookies.find((cookie) =>
    cookie.startsWith("auth-token=")
  );

  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null;
}
