"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { PlatformAdminDashboardView } from "@/features/platform-admin/PlatformAdminDashboardView";

export default function AdminDashboardPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="SaaS-level tenant overview and controls" title="Platform Admin">
        <PlatformAdminDashboardView />
      </AppShell>
    </RoleGate>
  );
}
