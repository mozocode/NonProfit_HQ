"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminStaffUsersToolView } from "@/features/admin-tools/AdminStaffUsersToolView";

export default function AdminToolsStaffPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Roles and active memberships" title="Staff & members">
        <AdminStaffUsersToolView />
      </AppShell>
    </RoleGate>
  );
}
