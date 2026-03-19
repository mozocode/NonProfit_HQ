"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/constants";
import { EnrollmentForm } from "@/features/enrollment/EnrollmentForm";
import { useEnrollmentMutation } from "@/hooks/useEnrollmentMutation";

export default function StaffFamilyEnrollmentPage() {
  const params = useParams();
  const familyId = params?.familyId as string | null;
  const { existing, isLoading, isSaving, error, refetch, saveDraft, submit } = useEnrollmentMutation(familyId);

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
    return <LoadingState message="Loading enrollment…" />;
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
        title="Enrollment form"
        description="Enroll this family in a program. Save as draft or submit."
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_FAMILY(familyId)}>
            Back to family profile
          </Link>
        }
      />
      <EnrollmentForm
        existing={existing}
        onSaveDraft={saveDraft}
        onSubmit={submit}
        isSaving={isSaving}
      />
    </div>
  );
}
