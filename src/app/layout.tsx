import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppProviders } from "@/providers/AppProviders";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NonProfit HQ",
  description: "Multi-tenant nonprofit operating system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
