"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminOrganizationSettingsToolView } from "@/features/admin-tools/AdminOrganizationSettingsToolView";

export default function AdminToolsOrganizationPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Tenant profile and onboarding notes" title="Organization">
        <AdminOrganizationSettingsToolView />
      </AppShell>
    </RoleGate>
  );
}
