"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminPartnersDirectoryView } from "@/features/admin-dashboard/AdminPartnersDirectoryView";

export default function AdminPartnersPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Community partners" title="Partner organizations">
        <AdminPartnersDirectoryView />
      </AppShell>
    </RoleGate>
  );
}
