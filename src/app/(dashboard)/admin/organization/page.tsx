"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminDashboardView } from "@/features/dashboard/AdminDashboardView";

export default function OrganizationAdminDashboardPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell
        roleLabel="Admin"
        subtitle="Organization-level overview, activity, staff oversight, and quick links"
        title="Organization Admin Command Center"
      >
        <AdminDashboardView />
      </AppShell>
    </RoleGate>
  );
}
