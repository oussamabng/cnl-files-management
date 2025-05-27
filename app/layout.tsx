import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { initializeApp } from "@/lib/startup";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "File Management System",
  description: "A secure file management system with authentication",
};

initializeApp();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
