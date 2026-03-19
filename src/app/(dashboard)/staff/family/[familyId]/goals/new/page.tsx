"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/constants";
import { CreateGoalForm } from "@/features/goals/CreateGoalForm";
import { useAuth } from "@/hooks/useAuth";
import { createGoal } from "@/services/firestore/goalsTasksService";
import type { CreateGoalInput } from "@/types/goalsTasks";

export default function NewGoalPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params?.familyId as string | null;
  const { orgId, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!familyId) {
    return (
      <div className="space-y-4">
        <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF}>
          Back to dashboard
        </Link>
        <p className="text-sm text-muted-foreground">Missing family.</p>
      </div>
    );
  }

  const handleSubmit = async (input: CreateGoalInput) => {
    if (!orgId || !user?.uid) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const goalId = await createGoal(orgId, familyId, user.uid, input);
      router.push(ROUTES.STAFF_FAMILY_GOAL(familyId, goalId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create goal");
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add goal"
        description="Create a long-term or short-term goal for this family."
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href={ROUTES.STAFF_FAMILY(familyId)}>
            Cancel
          </Link>
        }
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <CreateGoalForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
