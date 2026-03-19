"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminExportsView } from "@/features/admin-dashboard/AdminExportsView";

export default function AdminExportsPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Downloads and reporting exports" title="Exports">
        <AdminExportsView />
      </AppShell>
    </RoleGate>
  );
}
