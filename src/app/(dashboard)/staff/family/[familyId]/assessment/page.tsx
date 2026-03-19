"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/constants";
import { AssessmentForm } from "@/features/assessment/AssessmentForm";
import { useAssessmentMutation } from "@/hooks/useAssessmentMutation";

export default function StaffFamilyAssessmentPage() {
  const params = useParams();
  const familyId = params?.familyId as string | null;
  const { existing, isLoading, isSaving, error, refetch, saveDraft, submit } = useAssessmentMutation(familyId);

  if (!familyId) {
    return (
      <div className="space-y-4">
        <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
          Back to dashboard
        </Link>
        <p className="text-sm text-muted-foreground">Missing family ID.</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading assessment…" />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment form"
        description="Complete or update the assessment for this family. Save as draft or submit."
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_FAMILY(familyId)}>
            Back to family profile
          </Link>
        }
      />
      <AssessmentForm
        existing={existing}
        onSaveDraft={saveDraft}
        onSubmit={submit}
        isSaving={isSaving}
      />
    </div>
  );
}
