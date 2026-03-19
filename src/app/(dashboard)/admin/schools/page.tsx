"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminSchoolsDirectoryView } from "@/features/admin-dashboard/AdminSchoolsDirectoryView";

export default function AdminSchoolsPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Partner schools" title="Schools">
        <AdminSchoolsDirectoryView />
      </AppShell>
    </RoleGate>
  );
}
