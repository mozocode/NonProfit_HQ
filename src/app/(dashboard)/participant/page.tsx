"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { ParticipantDashboardView } from "@/features/dashboard/ParticipantDashboardView";

export default function ParticipantDashboardPage() {
  return (
    <RoleGate allow={["participant"]}>
      <AppShell roleLabel="Participant" subtitle="Goals, services, and required documents" title="Participant Dashboard">
        <ParticipantDashboardView />
      </AppShell>
    </RoleGate>
  );
}
