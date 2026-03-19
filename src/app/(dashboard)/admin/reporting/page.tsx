"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { AdminReportingView } from "@/features/reporting/AdminReportingView";

export default function AdminReportingPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell
        roleLabel="Admin"
        subtitle="Filters, charts, and export-ready summaries"
        title="Reporting & analytics"
      >
        <AdminReportingView />
      </AppShell>
    </RoleGate>
  );
}
