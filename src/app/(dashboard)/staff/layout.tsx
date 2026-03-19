"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["staff", "admin"]}>
      <AppShell
        roleLabel="Staff"
        subtitle="Caseload execution, tasks, and weekly agenda"
        title="Staff Dashboard"
      >
        {children}
      </AppShell>
    </RoleGate>
  );
}
