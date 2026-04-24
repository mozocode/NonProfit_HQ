"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { PlatformUsersView } from "@/features/platform-admin/PlatformUsersView";

export default function AdminToolsStaffPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Users, org memberships, and ownership status" title="USERS">
        <PlatformUsersView />
      </AppShell>
    </RoleGate>
  );
}
