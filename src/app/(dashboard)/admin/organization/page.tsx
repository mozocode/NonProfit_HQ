"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { PlatformAdminDashboardView } from "@/features/platform-admin/PlatformAdminDashboardView";

export default function OrganizationAdminDashboardPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell
        roleLabel="Admin"
        subtitle="Create and manage customer organizations on the SaaS platform"
        title="Organizations"
      >
        <PlatformAdminDashboardView showOpenOrganizationButton={false} />
      </AppShell>
    </RoleGate>
  );
}
