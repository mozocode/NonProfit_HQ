"use client";

import Link from "next/link";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminSurveyReportView } from "@/features/surveys/AdminSurveyReportView";
import { ROUTES } from "@/constants";
import { useParams } from "next/navigation";

export default function AdminSurveyReportPage() {
  const params = useParams();
  const surveyId = typeof params?.surveyId === "string" ? params.surveyId : "";

  return (
    <RoleGate allow={["admin"]}>
      <AppShell roleLabel="Admin" subtitle="Outcomes reporting" title="Survey report">
        {surveyId ? (
          <AdminSurveyReportView surveyId={surveyId} />
        ) : (
          <EmptyState
            title="Invalid survey"
            action={
              <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.ADMIN_SURVEYS}>
                All surveys
              </Link>
            }
          />
        )}
      </AppShell>
    </RoleGate>
  );
}
