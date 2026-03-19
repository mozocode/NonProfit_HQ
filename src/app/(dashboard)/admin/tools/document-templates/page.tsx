"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminDocumentTemplatesToolView } from "@/features/admin-tools/AdminDocumentTemplatesToolView";

export default function AdminToolsDocumentTemplatesPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Required uploads" title="Document templates">
        <AdminDocumentTemplatesToolView />
      </AppShell>
    </RoleGate>
  );
}
