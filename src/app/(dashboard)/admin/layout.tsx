"use client";

import { SuperAdminGate } from "@/components/auth/SuperAdminGate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SuperAdminGate>{children}</SuperAdminGate>;
}
