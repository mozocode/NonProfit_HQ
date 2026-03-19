"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminWorkflowStagesToolView } from "@/features/admin-tools/AdminWorkflowStagesToolView";

export default function AdminToolsWorkflowsPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Case progression labels" title="Workflow stages">
        <AdminWorkflowStagesToolView />
      </AppShell>
    </RoleGate>
  );
}
