"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminWeeklyOversightView } from "@/features/weekly-planning/weekly-oversight/AdminWeeklyOversightView";

export default function AdminWeeklyOversightPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Planned agendas vs submitted reports" title="Weekly oversight">
        <AdminWeeklyOversightView />
      </AppShell>
    </RoleGate>
  );
}
