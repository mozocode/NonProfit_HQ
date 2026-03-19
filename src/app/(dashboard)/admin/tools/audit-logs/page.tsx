"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminAuditLogsToolView } from "@/features/admin-tools/AdminAuditLogsToolView";

export default function AdminToolsAuditLogsPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Organization events" title="Audit logs">
        <AdminAuditLogsToolView />
      </AppShell>
    </RoleGate>
  );
}
