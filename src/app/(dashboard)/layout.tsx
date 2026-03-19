"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";

/**
 * Protected dashboard layout: only authenticated users see child routes.
 * Role-specific access (admin / staff / participant) is enforced by RoleGate
 * in each dashboard page.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
