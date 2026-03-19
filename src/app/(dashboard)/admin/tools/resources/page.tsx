"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminResourcesToolView } from "@/features/admin-tools/AdminResourcesToolView";

export default function AdminToolsResourcesPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Categories and listings" title="Resource directory">
        <AdminResourcesToolView />
      </AppShell>
    </RoleGate>
  );
}
