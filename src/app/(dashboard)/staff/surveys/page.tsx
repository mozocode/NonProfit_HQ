"use client";

import { useMemo } from "react";

import { useSurveysList } from "@/hooks/useSurveys";
import { SurveysListView } from "@/features/surveys/SurveysListView";
import { ROUTES } from "@/constants";

export default function StaffSurveysPage() {
  const { surveys, isLoading } = useSurveysList({ status: "active" });
  const filtered = useMemo(() => surveys.filter((s) => s.audience === "staff"), [surveys]);

  return (
    <SurveysListView
      title="Staff surveys"
      description="Complete organization surveys assigned to staff."
      surveys={filtered}
      isLoading={isLoading}
      emptyTitle="No staff surveys"
      emptyDescription="When an admin publishes a staff survey, it will show here."
      hrefForSurvey={ROUTES.STAFF_SURVEY}
      backHref={ROUTES.STAFF}
      backLabel="Dashboard"
    />
  );
}
