"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { useSurveysList } from "@/hooks/useSurveys";
import { SurveysListView } from "@/features/surveys/SurveysListView";
import { CreateSurveySheet } from "@/features/surveys/CreateSurveySheet";
import { ROUTES } from "@/constants";

export default function AdminSurveysPage() {
  const { surveys, isLoading, refetch } = useSurveysList();

  return (
    <RoleGate allow={["admin"]}>
      <AppShell
        roleLabel="Admin"
        subtitle="Definitions, responses, and outcomes"
        title="Surveys & outcomes"
      >
        <SurveysListView
          title="All surveys"
          description="Create surveys for parents, children/youth, or staff. Open a survey for reporting and export-ready summaries."
          surveys={surveys}
          isLoading={isLoading}
          emptyTitle="No surveys yet"
          emptyDescription="Create your first survey to collect structured feedback."
          hrefForSurvey={ROUTES.ADMIN_SURVEY_REPORT}
          backHref={ROUTES.ADMIN}
          backLabel="Command center"
          headerActions={<CreateSurveySheet onCreated={() => refetch()} />}
        />
        <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Reporting</p>
          <p className="mt-1">
            Each survey has response counts, monthly trends, lay summaries, and copy-ready cards for grants and
            newsletters. Surveys are stored in Firestore per the data model (
            <code className="rounded bg-muted px-1">surveys</code>,{" "}
            <code className="rounded bg-muted px-1">surveyQuestions</code> subcollection,{" "}
            <code className="rounded bg-muted px-1">surveyResponses</code>).
          </p>
        </div>
      </AppShell>
    </RoleGate>
  );
}
