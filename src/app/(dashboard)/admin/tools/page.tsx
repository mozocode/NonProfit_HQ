"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminToolsHubView } from "@/features/admin-tools/AdminToolsHubView";

export default function AdminToolsPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Configuration, compliance, and tenant onboarding" title="Admin tools">
        <AdminToolsHubView />
      </AppShell>
    </RoleGate>
  );
}
