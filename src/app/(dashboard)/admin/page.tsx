"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminDashboardView } from "@/features/dashboard/AdminDashboardView";

export default function AdminDashboardPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell
        roleLabel="Admin"
        subtitle="Overview, live activity, staff oversight, and quick links"
        title="Admin Command Center"
      >
        <AdminDashboardView />
      </AppShell>
    </RoleGate>
  );
}
