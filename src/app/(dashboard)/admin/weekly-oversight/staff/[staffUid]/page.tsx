"use client";

import { useParams } from "next/navigation";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminWeeklyOversightStaffView } from "@/features/weekly-planning/weekly-oversight/AdminWeeklyOversightStaffView";

export default function AdminWeeklyOversightStaffPage() {
  const params = useParams();
  const staffUid = typeof params?.staffUid === "string" ? params.staffUid : "";
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Single staff planned vs actual" title="Weekly oversight">
        <AdminWeeklyOversightStaffView staffUid={staffUid} />
      </AppShell>
    </RoleGate>
  );
}
