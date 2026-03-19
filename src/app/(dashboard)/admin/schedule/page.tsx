"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminScheduleView } from "@/features/schedule/AdminScheduleView";

export default function AdminSchedulePage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Organization-wide and per-staff calendar" title="Staff schedule">
        <AdminScheduleView />
      </AppShell>
    </RoleGate>
  );
}
