"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminWeeklySubmissionsView } from "@/features/weekly-planning/AdminWeeklySubmissionsView";

export default function AdminWeeklySubmissionsPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell
        roleLabel="Admin"
        subtitle="Agendas, reports, compliance"
        title="Weekly planning & reports"
      >
        <AdminWeeklySubmissionsView />
      </AppShell>
    </RoleGate>
  );
}
