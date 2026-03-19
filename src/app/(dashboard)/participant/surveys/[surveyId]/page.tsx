"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { RoleGate } from "@/components/auth/RoleGate";
import { AppShell } from "@/components/layout/AppShell";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useSurveyDetail } from "@/hooks/useSurveys";
import { SurveyTakeForm } from "@/features/surveys/SurveyTakeForm";
import { ROUTES } from "@/constants";

export default function ParticipantSurveyTakePage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params?.surveyId as string;
  const { survey, isLoading } = useSurveyDetail(surveyId ?? null);

  const canTake =
    survey &&
    survey.status === "active" &&
    (survey.audience === "parent" || survey.audience === "child");

  return (
    <RoleGate allow={["participant"]}>
      <AppShell roleLabel="Participant" subtitle="Survey" title={survey?.name ?? "Survey"}>
        {isLoading ? (
          <LoadingState message="Loading survey…" />
        ) : !survey ? (
          <EmptyState
            title="Survey not found"
            action={
              <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.PARTICIPANT_SURVEYS}>
                Back to surveys
              </Link>
            }
          />
        ) : !canTake ? (
          <EmptyState
            title="This survey is not available"
            description="It may be closed or not intended for your role."
            action={
              <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.PARTICIPANT_SURVEYS}>
                Back to surveys
              </Link>
            }
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            <SurveyTakeForm
              survey={survey}
              onSuccess={() => router.push(ROUTES.PARTICIPANT_SURVEYS)}
            />
            <Link className={buttonVariants({ variant: "ghost" })} href={ROUTES.PARTICIPANT_SURVEYS}>
              Cancel
            </Link>
          </div>
        )}
      </AppShell>
    </RoleGate>
  );
}
