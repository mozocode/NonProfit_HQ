"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminWeeklyOversightStaffView } from "@/features/weekly-planning/weekly-oversight/AdminWeeklyOversightStaffView";

export default function AdminWeeklyOversightStaffPage({ params }: { params: { staffUid: string } }) {
  const staffUid = params.staffUid;
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Single staff planned vs actual" title="Weekly oversight">
        <AdminWeeklyOversightStaffView staffUid={staffUid} />
      </AppShell>
    </RoleGate>
  );
}
