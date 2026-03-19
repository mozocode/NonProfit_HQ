"use client";

import { useMemo } from "react";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { useSurveysList } from "@/hooks/useSurveys";
import { SurveysListView } from "@/features/surveys/SurveysListView";
import { ROUTES } from "@/constants";

export default function ParticipantSurveysPage() {
  const { surveys, isLoading } = useSurveysList({ status: "active" });
  const filtered = useMemo(
    () => surveys.filter((s) => s.audience === "parent" || s.audience === "child"),
    [surveys]
  );

  return (
    <RoleGate allow={["participant"]}>
      <AppShell roleLabel="Participant" subtitle="Share your feedback" title="Surveys">
        <SurveysListView
          title="Your surveys"
          description="Complete surveys for your family. Your answers help us improve services."
          surveys={filtered}
          isLoading={isLoading}
          emptyTitle="No surveys right now"
          emptyDescription="When your organization publishes a survey for families, it will appear here."
          hrefForSurvey={ROUTES.PARTICIPANT_SURVEY}
          backHref={ROUTES.PARTICIPANT}
          backLabel="Dashboard"
        />
      </AppShell>
    </RoleGate>
  );
}
