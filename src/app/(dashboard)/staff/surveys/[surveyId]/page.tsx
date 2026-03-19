"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useSurveyDetail } from "@/hooks/useSurveys";
import { SurveyTakeForm } from "@/features/surveys/SurveyTakeForm";
import { ROUTES } from "@/constants";

export default function StaffSurveyTakePage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params?.surveyId as string;
  const { survey, isLoading } = useSurveyDetail(surveyId ?? null);

  const canTake = survey && survey.status === "active" && survey.audience === "staff";

  return (
    <>
      {isLoading ? (
        <LoadingState message="Loading survey…" />
      ) : !survey ? (
        <EmptyState
          title="Survey not found"
          action={
            <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_SURVEYS}>
              Back to surveys
            </Link>
          }
        />
      ) : !canTake ? (
        <EmptyState
          title="This survey is not available"
          description="It may be closed or not a staff survey."
          action={
            <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_SURVEYS}>
              Back to surveys
            </Link>
          }
        />
      ) : (
        <div className="mx-auto max-w-2xl space-y-6">
          <SurveyTakeForm survey={survey} onSuccess={() => router.push(ROUTES.STAFF_SURVEYS)} />
          <Link className={buttonVariants({ variant: "ghost" })} href={ROUTES.STAFF_SURVEYS}>
            Cancel
          </Link>
        </div>
      )}
    </>
  );
}
