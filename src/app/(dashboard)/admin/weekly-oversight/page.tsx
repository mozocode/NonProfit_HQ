"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { PlatformBusinessIntelligenceView } from "@/features/platform-admin/PlatformBusinessIntelligenceView";

export default function AdminWeeklyOversightPage() {
  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Strategic metrics, growth velocity, and platform health" title="Business Intelligence">
        <PlatformBusinessIntelligenceView />
      </AppShell>
    </RoleGate>
  );
}
