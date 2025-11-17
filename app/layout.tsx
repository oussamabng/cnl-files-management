import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Archive Management System",
  description:
    "Système de gestion d'archives avec authentification et permissions",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="fr">
      <body className={inter.className}>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
